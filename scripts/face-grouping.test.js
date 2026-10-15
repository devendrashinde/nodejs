import test from 'node:test';
import assert from 'node:assert/strict';
import { clusterFaces, cosineSimilarity, matchFacesToPeople, normalizeEmbedding, updateCentroid } from '../app/services/faceClusteringService.js';

test('cosine similarity compares descriptors independent of scale', () => {
    assert.ok(cosineSimilarity([1, 0], [20, 0]) > 0.999);
    assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
});

test('face clustering groups similar descriptors and keeps distinct faces separate', () => {
    const groups = clusterFaces([
        { id: 'first', embedding: Array(32).fill(1) },
        { id: 'same', embedding: Array(32).fill(2) },
        { id: 'different', embedding: [1, ...Array(31).fill(-1)] }
    ]);

    assert.equal(groups.length, 2);
    assert.deepEqual(groups[0].faces.map(face => face.id), ['first', 'same']);
    assert.deepEqual(groups[1].faces.map(face => face.id), ['different']);
});

test('face clustering rejects malformed descriptors and thresholds', () => {
    assert.throws(() => normalizeEmbedding([1, 2]), /invalid length/);
    assert.throws(() => normalizeEmbedding(Array(32).fill(Number.NaN)), /invalid values/);
    assert.throws(() => normalizeEmbedding(Array(32).fill(0)), /cannot be empty/);
    assert.throws(() => clusterFaces([], 1.1), /between 0 and 1/);
});

test('raising the similarity threshold splits borderline suggestions', () => {
    const first = { id: 'first', embedding: [1, ...Array(31).fill(0)] };
    const nearby = { id: 'nearby', embedding: [0.95, Math.sqrt(1 - 0.95 ** 2), ...Array(30).fill(0)] };

    assert.equal(clusterFaces([first, nearby], 0.9).length, 1);
    assert.equal(clusterFaces([first, nearby], 0.98).length, 2);
});

test('centroid updates produce a normalized descriptor', () => {
    const first = normalizeEmbedding([1, 0, ...Array(30).fill(0)]);
    const next = normalizeEmbedding([1, 1, ...Array(30).fill(0)]);
    const centroid = updateCentroid(first, next, 1);
    assert.ok(Math.abs(Math.hypot(...centroid) - 1) < 1e-12);
});

test('reference matching suggests the nearest person and suppresses ambiguous matches', () => {
    const alex = [1, ...Array(31).fill(0)];
    const sam = [0, 1, ...Array(30).fill(0)];
    const nearAlex = [0.99, Math.sqrt(1 - 0.99 ** 2), ...Array(30).fill(0)];
    const ambiguous = [Math.SQRT1_2, Math.SQRT1_2, ...Array(30).fill(0)];
    const matches = matchFacesToPeople(
        [{ id: 1, embedding: normalizeEmbedding(nearAlex) }, { id: 2, embedding: normalizeEmbedding(ambiguous) }],
        [{ id: 7, name: 'Alex', embeddings: [normalizeEmbedding(alex)] }, { id: 8, name: 'Sam', embeddings: [normalizeEmbedding(sam)] }],
        0.9,
        0.03
    );

    assert.deepEqual(matches.map(match => [match.face.id, match.personName]), [[1, 'Alex']]);
});