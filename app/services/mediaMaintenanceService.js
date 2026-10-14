import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const defaultRoot = fileURLToPath(new URL('../../data/', import.meta.url));
const relatedTables = ['playlist_items', 'favorites', 'photo_editions'];

const execute = (connection, sql, parameters = []) => new Promise((resolve, reject) => {
    connection.query(sql, parameters, (error, results) => error ? reject(error) : resolve(results));
});

const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

export function createMediaMaintenanceService({ database, root = defaultRoot } = {}) {
    const reports = new Map();
    const rootPath = path.resolve(root);
    const getDatabase = async () => database || (await import('../models/db.js')).default;

    async function checkRoot() {
        const stats = await fs.stat(rootPath);
        if (!stats.isDirectory()) throw fail('The data directory is unavailable. No cleanup is allowed.', 409);
    }

    async function inspect(photo) {
        const parts = [photo.path || '', photo.album || '', photo.name || ''];
        const displayPath = parts.join('/').replaceAll('\\', '/');
        const result = { ...photo, mediaPath: displayPath };
        if (parts.some((part) => typeof part !== 'string') || !photo.name || /[/\\]/.test(photo.name)) {
            return { ...result, status: 'blocked', reason: 'Invalid stored location' };
        }
        const segments = displayPath.split('/').filter(Boolean);
        if (segments[0] !== 'data' || segments.some((segment) => segment === '.' || segment === '..' || segment.includes(':'))) {
            return { ...result, status: 'blocked', reason: 'Stored location is not safely inside data/' };
        }
        let candidate = rootPath;
        for (let index = 1; index < segments.length; index++) {
            candidate = path.join(candidate, segments[index]);
            try {
                const linkStats = await fs.lstat(candidate);
                const stats = linkStats.isSymbolicLink() ? await fs.stat(candidate).catch(() => null) : linkStats;
                if (!stats) return { ...result, status: 'blocked', reason: 'Broken or inaccessible symbolic link' };
                if (index < segments.length - 1 && !stats.isDirectory()) {
                    return { ...result, status: 'blocked', reason: 'Album path is not a directory' };
                }
                if (index === segments.length - 1) {
                    return { ...result, status: stats.isFile() ? 'present' : 'blocked', reason: stats.isFile() ? '' : 'Location is not a media file' };
                }
            } catch (error) {
                if (error.code === 'ENOENT') return { ...result, status: 'missing', reason: 'File not found' };
                return { ...result, status: 'blocked', reason: `Cannot check location (${error.code || 'unknown error'})` };
            }
        }
        return { ...result, status: 'blocked', reason: 'Incomplete stored location' };
    }

    async function scan() {
        await checkRoot();
        const rows = await execute(await getDatabase(), 'SELECT id, name, album, path, tags FROM photos ORDER BY id');
        const entries = [];
        for (const row of rows) {
            const entry = await inspect(row);
            if (entry.status !== 'present') entries.push(entry);
        }
        const now = Date.now();
        for (const [token, report] of reports) {
            if (report.expiresAt < now) reports.delete(token);
        }
        while (reports.size >= 10) reports.delete(reports.keys().next().value);
        const scanId = randomUUID();
        reports.set(scanId, { expiresAt: now + 30 * 60 * 1000, entries: new Map(entries.filter((entry) => entry.status === 'missing').map((entry) => [entry.id, entry])) });
        return { scanId, scanned: rows.length, missing: entries.filter((entry) => entry.status === 'missing').length, blocked: entries.filter((entry) => entry.status === 'blocked').length, entries };
    }

    async function clear({ scanId, ids, confirm } = {}) {
        const report = reports.get(scanId);
        if (!report || report.expiresAt < Date.now()) throw fail('The report has expired. Scan again.', 409);
        if (confirm !== true || !Array.isArray(ids) || !ids.length || ids.length > 250 || ids.some((id) => !Number.isSafeInteger(id) || !report.entries.has(id))) {
            throw fail('Confirm cleanup and select up to 250 missing entries from the report.');
        }
        await checkRoot();
        const activeDatabase = await getDatabase();
        const connection = await new Promise((resolve, reject) => activeDatabase.getConnection((error, value) => error ? reject(error) : resolve(value)));
        try {
            const tables = await execute(connection, 'SELECT TABLE_NAME AS name, ENGINE AS engine FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()');
            const affectedTables = tables.filter((table) => table.name === 'photos' || relatedTables.includes(table.name));
            if (affectedTables.some((table) => table.engine !== 'InnoDB')) throw fail('Cleanup requires transactional InnoDB tables.', 409);
            await execute(connection, 'START TRANSACTION');
            const deletedIds = [];
            const skipped = [];
            for (const id of new Set(ids)) {
                const [photo] = await execute(connection, 'SELECT id, name, album, path FROM photos WHERE id = ? FOR UPDATE', [id]);
                const original = report.entries.get(id);
                if (!photo || ['name', 'album', 'path'].some((field) => photo[field] !== original[field])) {
                    skipped.push({ id, reason: 'Record changed or already removed' });
                    continue;
                }
                const entry = await inspect(photo);
                if (entry.status !== 'missing') {
                    skipped.push({ id, reason: entry.status === 'present' ? 'File exists again' : entry.reason });
                    continue;
                }
                for (const table of affectedTables.filter((table) => table.name !== 'photos')) {
                    if (table.name === 'favorites') {
                        const mediaPath = entry.mediaPath.split('/').filter(Boolean).join('/');
                        const duplicate = await execute(connection, 'SELECT id FROM photos WHERE BINARY path <=> BINARY ? AND BINARY album <=> BINARY ? AND BINARY name = BINARY ? AND id <> ? LIMIT 1', [photo.path, photo.album, photo.name, id]);
                        if (!duplicate.length) await execute(connection, 'DELETE FROM favorites WHERE BINARY photo_path = BINARY ?', [mediaPath]);
                    } else {
                        await execute(connection, 'DELETE FROM ?? WHERE photo_id = ?', [table.name, id]);
                    }
                }
                await execute(connection, 'DELETE FROM photos WHERE id = ?', [id]);
                deletedIds.push(id);
            }
            await execute(connection, 'COMMIT');
            for (const id of [...deletedIds, ...skipped.map((entry) => entry.id)]) report.entries.delete(id);
            return { deleted: deletedIds.length, deletedIds, skipped };
        } catch (error) {
            await execute(connection, 'ROLLBACK').catch(() => {});
            throw error;
        } finally {
            connection.release();
        }
    }

    return { scan, clear };
}

export default createMediaMaintenanceService();