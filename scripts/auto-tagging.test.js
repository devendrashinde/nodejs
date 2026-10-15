import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import * as tf from '@tensorflow/tfjs';
import { Jimp } from 'jimp';
import service from '../app/services/autoTaggingService.js';

let directory;
let imagePath;
let original;
const metadataDisabled = { includeExifTags: false, includeFilenameTags: false, includeAlbumTags: false };

beforeEach(async () => {
    original = { model: service.model, initialized: service.isInitialized, autoTagPhoto: service.autoTagPhoto, initialize: service.initialize };
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'photos-auto-tag-'));
    imagePath = path.join(directory, 'sample.png');
    await new Jimp({ width: 8, height: 8, color: 0xff8040ff }).write(imagePath);
    service.isInitialized = true;
});

afterEach(async () => {
    service.model = original.model;
    service.isInitialized = original.initialized;
    service.autoTagPhoto = original.autoTagPhoto;
    service.initialize = original.initialize;
    await fs.rm(directory, { recursive: true, force: true });
});

test('MobileNet receives raw RGB input and tensors are disposed after prediction', async () => {
    const baseline = tf.memory().numTensors;
    let input;
    service.model = { classify: async (tensor, topk) => {
        input = tensor;
        assert.deepEqual(tensor.shape, [224, 224, 3]);
        assert.ok(tensor.dataSync().some(value => value > 1));
        assert.equal(topk, 10);
        return [{ className: 'cat, feline', probability: 0.9 }];
    } };
    const result = await service.autoTagPhoto(imagePath, metadataDisabled);
    assert.equal(result.success, true);
    assert.deepEqual(result.mlTags, ['cat']);
    assert.equal(input.isDisposedInternal, true);
    assert.equal(tf.memory().numTensors, baseline);
});

test('low confidence predictions do not become tags', async () => {
    service.model = { classify: async () => [{ className: 'cat', probability: 0.2 }] };
    const result = await service.autoTagPhoto(imagePath, metadataDisabled);
    assert.equal(result.success, true);
    assert.deepEqual(result.tags, []);
});

test('inference failures are reported and do not leak tensors', async () => {
    const baseline = tf.memory().numTensors;
    service.model = { classify: async () => { throw new Error('Model unavailable'); } };
    const result = await service.autoTagPhoto(imagePath, metadataDisabled);
    assert.equal(result.success, false);
    assert.equal(result.error, 'Model unavailable');
    assert.equal(tf.memory().numTensors, baseline);
});

test('unsupported and missing files need no model initialization', async () => {
    const audioPath = path.join(directory, 'audio.mp3');
    await fs.writeFile(audioPath, 'fixture');
    service.initialize = async () => { throw new Error('Should not initialize'); };
    const result = await service.batchAutoTag([audioPath, path.join(directory, 'missing.jpg')]);
    assert.equal(result.skipped, 1);
    assert.equal(result.failed, 1);
    assert.equal(result.success, 0);
});

test('batch outcomes distinguish generated tags, no tags, skipped files, and failures', async () => {
    const outcomes = {
        tagged: { success: true, tags: ['cat'] },
        empty: { success: true, tags: [] },
        audio: { success: false, skipped: true, error: 'Unsupported image type' },
        broken: { success: false, error: 'Inference failed' }
    };
    service.autoTagPhoto = async selected => outcomes[selected];
    const progress = [];
    const result = await service.batchAutoTag(Object.keys(outcomes), {}, event => progress.push(event.current));
    assert.deepEqual([result.success, result.noTags, result.skipped, result.failed], [1, 1, 1, 1]);
    assert.deepEqual(progress, [1, 2, 3, 4]);
    assert.deepEqual(result.tags, { tagged: ['cat'] });
    assert.equal(result.errors.length, 2);
});