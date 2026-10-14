import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createMediaMaintenanceService } from '../app/services/mediaMaintenanceService.js';

async function fixture(context) {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'photos-maintenance-'));
    context.after(() => fs.rm(root, { recursive: true, force: true }));
    await fs.mkdir(path.join(root, 'album'));
    await fs.writeFile(path.join(root, 'album', 'present.jpg'), 'fixture');
    const rows = [
        { id: 1, path: 'data', album: 'album', name: 'present.jpg', tags: '' },
        { id: 2, path: 'data', album: 'album', name: 'missing.mp4', tags: '' },
        { id: 3, path: 'data/nested', album: 'album', name: 'missing.mp3', tags: '' },
        { id: 4, path: 'data/..', album: 'outside', name: 'unsafe.jpg', tags: '' }
    ];
    const state = { rows, calls: [], failDelete: false, engine: 'InnoDB', released: false };
    let snapshot;
    const database = {
        query(sql, parameters, callback) {
            state.calls.push({ sql, parameters });
            try {
                let result = {};
                if (sql.includes('information_schema')) {
                    result = ['photos', 'favorites', 'playlist_items', 'photo_editions'].map((name) => ({ name, engine: state.engine }));
                } else if (sql.includes('FOR UPDATE')) {
                    result = state.rows.filter((row) => row.id === parameters[0]).map((row) => ({ ...row }));
                } else if (sql.includes('id <>')) {
                    result = state.rows.filter((row) => row.path === parameters[0] && row.album === parameters[1] && row.name === parameters[2] && row.id !== parameters[3]);
                } else if (sql.startsWith('SELECT')) {
                    result = state.rows.map((row) => ({ ...row }));
                } else if (sql === 'START TRANSACTION') {
                    snapshot = state.rows.map((row) => ({ ...row }));
                } else if (sql === 'ROLLBACK' && snapshot) {
                    state.rows = snapshot;
                } else if (sql === 'DELETE FROM photos WHERE id = ?') {
                    if (state.failDelete) throw new Error('Simulated database failure');
                    state.rows = state.rows.filter((row) => row.id !== parameters[0]);
                }
                callback(null, result);
            } catch (error) {
                callback(error);
            }
        },
        getConnection(callback) {
            callback(null, { query: this.query, release() { state.released = true; } });
        }
    };
    return { root, state, service: createMediaMaintenanceService({ database, root }) };
}

test('scan reports missing nested media and blocks unsafe or broken-link paths without writes', async (context) => {
    const { root, state, service } = await fixture(context);
    await fs.symlink(path.join(root, 'unavailable'), path.join(root, 'broken'), process.platform === 'win32' ? 'junction' : 'dir');
    state.rows.push({ id: 5, path: 'data', album: 'broken', name: 'unknown.jpg', tags: '' });
    const report = await service.scan();
    assert.equal(report.scanned, 5);
    assert.equal(report.missing, 2);
    assert.equal(report.blocked, 2);
    assert.equal(report.entries.find((entry) => entry.id === 3).mediaPath, 'data/nested/album/missing.mp3');
    assert.ok(state.calls.every((call) => call.sql.startsWith('SELECT')));
});

test('cleanup requires confirmation, a current report, and only reported missing IDs', async (context) => {
    const { service } = await fixture(context);
    const report = await service.scan();
    await assert.rejects(service.clear({ scanId: report.scanId, ids: [2] }), /Confirm cleanup/);
    await assert.rejects(service.clear({ scanId: report.scanId, ids: [1], confirm: true }), /Confirm cleanup/);
    await assert.rejects(service.clear({ scanId: report.scanId, ids: [4], confirm: true }), /Confirm cleanup/);
    await assert.rejects(service.clear({ scanId: report.scanId, ids: Array(251).fill(2), confirm: true }), /up to 250/);
    await assert.rejects(service.clear({ scanId: 'unknown', ids: [2], confirm: true }), /expired/);
});

test('cleanup rechecks restored files and removes dependent records only for still-missing media', async (context) => {
    const { root, state, service } = await fixture(context);
    const report = await service.scan();
    await fs.writeFile(path.join(root, 'album', 'missing.mp4'), 'restored');
    const result = await service.clear({ scanId: report.scanId, ids: [2, 3], confirm: true });
    assert.deepEqual(result.deletedIds, [3]);
    assert.deepEqual(result.skipped, [{ id: 2, reason: 'File exists again' }]);
    assert.ok(state.rows.some((row) => row.id === 2));
    assert.ok(!state.rows.some((row) => row.id === 3));
    const favoriteDelete = state.calls.find((call) => call.sql.startsWith('DELETE FROM favorites'));
    assert.deepEqual(favoriteDelete.parameters, ['data/nested/album/missing.mp3']);
    assert.equal(state.calls.filter((call) => call.sql === 'DELETE FROM ?? WHERE photo_id = ?').length, 2);
    assert.ok(state.calls.some((call) => call.sql === 'COMMIT'));
    assert.ok(state.released);
    assert.equal(await fs.readFile(path.join(root, 'album', 'present.jpg'), 'utf8'), 'fixture');
});

test('cleanup skips relocated records and rejects nontransactional tables', async (context) => {
    const { state, service } = await fixture(context);
    const report = await service.scan();
    state.rows.find((row) => row.id === 2).album = 'different';
    const result = await service.clear({ scanId: report.scanId, ids: [2], confirm: true });
    assert.equal(result.deleted, 0);
    assert.equal(result.skipped[0].reason, 'Record changed or already removed');
    state.engine = 'MyISAM';
    await assert.rejects(service.clear({ scanId: report.scanId, ids: [3], confirm: true }), /InnoDB/);
});

test('failed cleanup rolls back the transaction and releases the connection', async (context) => {
    const { state, service } = await fixture(context);
    const report = await service.scan();
    state.failDelete = true;
    await assert.rejects(service.clear({ scanId: report.scanId, ids: [2], confirm: true }), /Simulated database failure/);
    assert.ok(state.calls.some((call) => call.sql === 'ROLLBACK'));
    assert.ok(state.rows.some((row) => row.id === 2));
    assert.ok(state.released);
});