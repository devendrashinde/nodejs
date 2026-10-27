import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pool, { query } from '../models/db.js';
import { clusterFaces, matchFacesToPeople, normalizeEmbedding } from './faceClusteringService.js';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp']);
const DATA_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'data');
const ALBUM_PATH_SQL = "CONCAT(TRIM(TRAILING '/' FROM p.path), '/', TRIM(BOTH '/' FROM p.album))";
const MAX_SUGGESTION_FACES = 500;

const queryConnection = (connection, sql, params = []) => new Promise((resolve, reject) => {
    connection.query(sql, params, (error, result) => error ? reject(error) : resolve(result));
});

const withTransaction = async (callback) => {
    const connection = await new Promise((resolve, reject) => {
        pool.getConnection((error, value) => error ? reject(error) : resolve(value));
    });
    try {
        await new Promise((resolve, reject) => connection.beginTransaction(error => error ? reject(error) : resolve()));
        const result = await callback(connection);
        await new Promise((resolve, reject) => connection.commit(error => error ? reject(error) : resolve()));
        return result;
    } catch (error) {
        await new Promise(resolve => connection.rollback(() => resolve()));
        throw error;
    } finally {
        connection.release();
    }
};

const photoRelativePath = (photo) => {
    const segments = [photo.path, photo.album, photo.name]
        .filter(Boolean)
        .join('/')
        .replaceAll('\\', '/')
        .split('/');
    if (segments[0] !== 'data' || segments.length < 3 || segments.some(segment => !segment || segment === '.' || segment === '..' || segment.includes(':'))) {
        return null;
    }
    if (!IMAGE_EXTENSIONS.has(path.extname(segments.at(-1)).toLowerCase())) return null;
    return segments.join('/');
};

const imageUrl = (relativePath) => `/data/${relativePath.split('/').slice(1).map(encodeURIComponent).join('/')}`;

const decodeEmbedding = (value) => {
    if (!Buffer.isBuffer(value) || value.byteLength % Float32Array.BYTES_PER_ELEMENT !== 0) return null;
    const start = value.byteOffset;
    const end = start + value.byteLength;
    return Array.from(new Float32Array(value.buffer.slice(start, end)));
};

const encodeEmbedding = (embedding) => Buffer.from(new Float32Array(embedding).buffer);

const readTags = (value) => String(value || '').split(',').map(tag => tag.trim()).filter(Boolean);

export const normalizeAlbumScope = (value) => {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value !== 'string') throw Object.assign(new Error('Invalid album path.'), { statusCode: 400 });

    const normalized = value.replaceAll('\\', '/').split('/').filter(Boolean).join('/');
    const segments = normalized.split('/');
    if (!normalized || segments.some(segment => !segment || segment === '.' || segment === '..' || segment.includes(':') || segment.includes('\0'))) {
        throw Object.assign(new Error('Invalid album path.'), { statusCode: 400 });
    }
    if (segments[0].toLowerCase() === 'data') segments[0] = 'data';
    else segments.unshift('data');
    if (segments.length < 2) throw Object.assign(new Error('Choose a specific album to scan.'), { statusCode: 400 });
    return segments.join('/');
};

const addPersonTag = async (connection, photoId, person) => {
    const [photo] = await queryConnection(connection, 'SELECT tags FROM photos WHERE id = ? FOR UPDATE', [photoId]);
    if (!photo) throw Object.assign(new Error('Photo no longer exists.'), { statusCode: 404 });
    const tags = readTags(photo.tags);
    if (!tags.some(tag => tag.toLowerCase() === person.name.toLowerCase())) {
        tags.push(person.name);
        await queryConnection(connection, 'UPDATE photos SET tags = ? WHERE id = ?', [tags.join(', '), photoId]);
        await queryConnection(connection, 'INSERT INTO person_photo_tags (person_id, photo_id, tag) VALUES (?, ?, ?)', [person.id, photoId, person.name]);
    }
};

// Photos only get a DB row once tagged/edited, so register untagged album images before scanning them.
export const registerAlbumImages = async (albumScope) => {
    const segments = albumScope.split('/');
    const directory = path.resolve(DATA_ROOT, ...segments.slice(1));
    if (directory !== DATA_ROOT && !directory.startsWith(DATA_ROOT + path.sep)) return 0;

    let entries;
    try {
        entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
        if (error.code === 'ENOENT' || error.code === 'ENOTDIR') throw Object.assign(new Error('Album not found.'), { statusCode: 404 });
        throw error;
    }
    const imageNames = entries
        .filter(entry => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
        .map(entry => entry.name);
    if (!imageNames.length) return 0;

    const existing = await query(`SELECT p.name FROM photos p WHERE ${ALBUM_PATH_SQL} = ?`, [albumScope]);
    const known = new Set(existing.map(row => row.name.toLowerCase()));
    const missing = imageNames.filter(name => !known.has(name.toLowerCase()));
    if (!missing.length) return 0;

    const album = segments.at(-1);
    const basePath = segments.slice(0, -1).join('/');
    let inserted = 0;
    for (let index = 0; index < missing.length; index += 500) {
        const result = await query(
            'INSERT INTO photos (name, album, path, tags) VALUES ?',
            [missing.slice(index, index + 500).map(name => [name, album, basePath, ''])]
        );
        inserted += result.affectedRows || 0;
    }
    return inserted;
};

export const getUnscannedPhotos = async (afterId = 0, limit = 100, rawAlbumScope = null, rawPhotoId = null) => {
    const albumScope = normalizeAlbumScope(rawAlbumScope);
    if (albumScope && rawPhotoId) throw Object.assign(new Error('Choose either an album or a single photo.'), { statusCode: 400 });
    if (albumScope && afterId === 0) await registerAlbumImages(albumScope);
    const albumFilter = albumScope ? `AND ${ALBUM_PATH_SQL} = ?` : '';
    const photoFilter = rawPhotoId ? 'AND p.id = ?' : '';
    const params = [afterId];
    if (albumScope) params.push(albumScope);
    if (rawPhotoId) params.push(rawPhotoId);
    params.push(limit);
    const photos = await query(
        `SELECT p.id, p.name, p.album, p.path
         FROM photos p
         LEFT JOIN face_scans s ON s.photo_id = p.id
         WHERE s.photo_id IS NULL AND p.id > ? AND LOWER(p.name) REGEXP '[.](jpg|jpeg|png|bmp|gif|webp)$'
         ${albumFilter}
         ${photoFilter}
         ORDER BY p.id
         LIMIT ?`,
        params
    );
    return photos.flatMap(photo => {
        const relativePath = photoRelativePath(photo);
        return relativePath ? [{ id: photo.id, name: photo.name, album: photo.album, imageUrl: imageUrl(relativePath) }] : [];
    });
};

export const saveFaceScans = async (scans) => withTransaction(async (connection) => {
    let saved = 0;
    for (const scan of scans) {
        const inserted = await queryConnection(
            connection,
            'INSERT IGNORE INTO face_scans (photo_id, face_count) VALUES (?, ?)',
            [scan.photoId, scan.faces.length]
        );
        if (!inserted.affectedRows) continue;

        for (let index = 0; index < scan.faces.length; index += 1) {
            const face = scan.faces[index];
            await queryConnection(
                connection,
                'INSERT INTO photo_faces (photo_id, face_index, embedding, box, confidence) VALUES (?, ?, ?, ?, ?)',
                [scan.photoId, index, encodeEmbedding(face.embedding), JSON.stringify(face.box), face.confidence]
            );
        }
        saved += 1;
    }
    return { saved };
});

export const getFaceSuggestions = async (threshold = 0.88) => {
    const [people, rows, scanStats, assignedRows] = await Promise.all([
        query(
            `SELECT p.id, p.name, COUNT(f.id) AS faceCount, COUNT(DISTINCT f.photo_id) AS photoCount
             FROM people p
             LEFT JOIN photo_faces f ON f.person_id = p.id
             GROUP BY p.id, p.name
             ORDER BY p.name`
        ),
        query(
            `SELECT f.id, f.photo_id, f.embedding, f.box, f.confidence, p.name, p.album, p.path
             FROM photo_faces f
             JOIN photos p ON p.id = f.photo_id
             WHERE f.person_id IS NULL
             ORDER BY f.id
             LIMIT ?`,
            [MAX_SUGGESTION_FACES]
        ),
        query('SELECT COUNT(*) AS scannedPhotos FROM face_scans'),
        query(
              `SELECT assigned.id, assigned.photo_id, assigned.person_id, assigned.embedding, assigned.box, assigned.confidence,
                    assigned.name, assigned.album, assigned.path
             FROM (
                  SELECT f.id, f.photo_id, f.person_id, f.embedding, f.box, f.confidence,
                        p.name, p.album, p.path,
                        ROW_NUMBER() OVER (PARTITION BY f.person_id ORDER BY f.id) AS preview_rank
                 FROM photo_faces f
                 JOIN photos p ON p.id = f.photo_id
                 WHERE f.person_id IS NOT NULL
             ) assigned
             WHERE assigned.preview_rank <= 18
             ORDER BY assigned.person_id, assigned.id`
        )
    ]);

    const assignedFaces = new Map();
    const personEmbeddings = new Map();
    for (const row of assignedRows) {
        const relativePath = photoRelativePath(row);
        if (!relativePath) continue;
        const embedding = decodeEmbedding(row.embedding);
        if (embedding) {
            const embeddings = personEmbeddings.get(row.person_id) || [];
            embeddings.push(embedding);
            personEmbeddings.set(row.person_id, embeddings);
        }
        let box;
        try {
            box = typeof row.box === 'string' ? JSON.parse(row.box) : row.box;
        } catch {
            continue;
        }
        const faces = assignedFaces.get(row.person_id) || [];
        faces.push({
            id: row.id,
            photoId: row.photo_id,
            name: row.name,
            album: row.album,
            imageUrl: imageUrl(relativePath),
            box,
            confidence: Number(row.confidence)
        });
        assignedFaces.set(row.person_id, faces);
    }

    const unassigned = rows.flatMap(row => {
        const relativePath = photoRelativePath(row);
        const embedding = decodeEmbedding(row.embedding);
        if (!relativePath || !embedding) return [];
        let box;
        try {
            box = typeof row.box === 'string' ? JSON.parse(row.box) : row.box;
        } catch {
            return [];
        }
        return [{
            id: row.id,
            photoId: row.photo_id,
            name: row.name,
            album: row.album,
            imageUrl: imageUrl(relativePath),
            box,
            confidence: Number(row.confidence),
            embedding
        }];
    });

    const suggestions = clusterFaces(unassigned, threshold).map(group => ({
        key: group.key,
        faces: group.faces.map(({ embedding, ...face }) => face)
    }));
    const peopleWithEmbeddings = people.map(person => ({
        id: person.id,
        name: person.name,
        embeddings: personEmbeddings.get(person.id) || []
    }));
    const personMatches = matchFacesToPeople(unassigned, peopleWithEmbeddings, threshold)
        .map(({ face, personId, personName, similarity }) => ({
            ...Object.fromEntries(Object.entries(face).filter(([key]) => key !== 'embedding')),
            personId,
            personName,
            similarity
        }));
    return {
        people: people.map(person => ({
            ...person,
            faceCount: Number(person.faceCount),
            photoCount: Number(person.photoCount),
            faces: assignedFaces.get(person.id) || []
        })),
        suggestions,
        personMatches,
        scannedPhotos: Number(scanStats[0]?.scannedPhotos || 0),
        unassignedFaceCount: unassigned.length,
        truncated: rows.length === MAX_SUGGESTION_FACES
    };
};

export const getFaceReference = async (photoId) => {
    const [photos, scans, rows] = await Promise.all([
        query('SELECT id, name, album, path, tags FROM photos WHERE id = ?', [photoId]),
        query('SELECT photo_id, face_count FROM face_scans WHERE photo_id = ?', [photoId]),
        query(
            `SELECT f.id, f.person_id, f.box, f.confidence, people.name AS person_name
             FROM photo_faces f
             LEFT JOIN people ON people.id = f.person_id
             WHERE f.photo_id = ?
             ORDER BY f.face_index`,
            [photoId]
        )
    ]);
    const photo = photos[0];
    if (!photo) throw Object.assign(new Error('Photo not found in the library.'), { statusCode: 404 });
    const relativePath = photoRelativePath(photo);
    if (!relativePath) throw Object.assign(new Error('This photo type cannot be used as a face reference.'), { statusCode: 400 });

    const faces = rows.flatMap(row => {
        try {
            return [{
                id: row.id,
                box: typeof row.box === 'string' ? JSON.parse(row.box) : row.box,
                confidence: Number(row.confidence),
                personId: row.person_id,
                personName: row.person_name
            }];
        } catch {
            return [];
        }
    });
    return {
        photo: { id: photo.id, name: photo.name, album: photo.album, imageUrl: imageUrl(relativePath) },
        tags: readTags(photo.tags),
        scanned: scans.length > 0,
        faces
    };
};

export const assignFaceReference = async (faceId, tag) => withTransaction(async (connection) => {
    const [face] = await queryConnection(
        connection,
        `SELECT f.id, f.person_id, p.id AS photo_id, p.tags
         FROM photo_faces f
         JOIN photos p ON p.id = f.photo_id
         WHERE f.id = ?
         FOR UPDATE`,
        [faceId]
    );
    if (!face) throw Object.assign(new Error('Reference face not found.'), { statusCode: 404 });
    const existingTags = readTags(face.tags);
    const existingTag = existingTags.find(value => value.toLowerCase() === tag.toLowerCase());
    if (!existingTag) throw Object.assign(new Error('Choose a tag already attached to this photo.'), { statusCode: 400 });

    if (face.person_id) {
        const [assignedPerson] = await queryConnection(connection, 'SELECT id, name FROM people WHERE id = ?', [face.person_id]);
        if (assignedPerson?.name.toLowerCase() === existingTag.toLowerCase()) {
            return { person: { id: assignedPerson.id, name: assignedPerson.name }, alreadyAssigned: true };
        }
        throw Object.assign(new Error('This face already belongs to a different named person.'), { statusCode: 409 });
    }

    let [person] = await queryConnection(connection, 'SELECT id, name FROM people WHERE LOWER(name) = LOWER(?) LIMIT 1 FOR UPDATE', [existingTag]);
    if (!person) {
        const inserted = await queryConnection(connection, 'INSERT INTO people (name) VALUES (?)', [existingTag]);
        person = { id: inserted.insertId, name: existingTag };
    }
    await queryConnection(connection, 'UPDATE photo_faces SET person_id = ? WHERE id = ?', [person.id, faceId]);
    await addPersonTag(connection, face.photo_id, person);
    return { person: { id: person.id, name: person.name }, alreadyAssigned: false };
});

export const assignFacesToPerson = async (faceIds, rawName) => withTransaction(async (connection) => {
    const name = rawName.trim();
    let [person] = await queryConnection(connection, 'SELECT id, name FROM people WHERE LOWER(name) = LOWER(?) LIMIT 1 FOR UPDATE', [name]);
    if (!person) {
        const inserted = await queryConnection(connection, 'INSERT INTO people (name) VALUES (?)', [name]);
        person = { id: inserted.insertId, name };
    }

    const placeholders = faceIds.map(() => '?').join(', ');
    const faces = await queryConnection(
        connection,
        `SELECT id, photo_id FROM photo_faces WHERE person_id IS NULL AND id IN (${placeholders}) FOR UPDATE`,
        faceIds
    );
    if (faces.length !== faceIds.length) {
        throw Object.assign(new Error('Some selected faces were already assigned or no longer exist.'), { statusCode: 409 });
    }

    await queryConnection(connection, `UPDATE photo_faces SET person_id = ? WHERE id IN (${placeholders})`, [person.id, ...faceIds]);
    for (const photoId of new Set(faces.map(face => face.photo_id))) {
        await addPersonTag(connection, photoId, person);
    }
    return { person: { id: person.id, name: person.name }, assigned: faces.length };
});

export const unassignFace = async (faceId) => withTransaction(async (connection) => {
    const [face] = await queryConnection(
        connection,
        'SELECT f.id, f.photo_id, f.person_id, p.name FROM photo_faces f JOIN people p ON p.id = f.person_id WHERE f.id = ? FOR UPDATE',
        [faceId]
    );
    if (!face) throw Object.assign(new Error('Assigned face not found.'), { statusCode: 404 });

    await queryConnection(connection, 'UPDATE photo_faces SET person_id = NULL WHERE id = ?', [faceId]);
    const [remaining] = await queryConnection(
        connection,
        'SELECT COUNT(*) AS faceCount FROM photo_faces WHERE person_id = ? AND photo_id = ?',
        [face.person_id, face.photo_id]
    );
    if (Number(remaining.faceCount) === 0) {
        const [managedTag] = await queryConnection(
            connection,
            'SELECT tag FROM person_photo_tags WHERE person_id = ? AND photo_id = ? FOR UPDATE',
            [face.person_id, face.photo_id]
        );
        if (managedTag) {
            const [photo] = await queryConnection(connection, 'SELECT tags FROM photos WHERE id = ? FOR UPDATE', [face.photo_id]);
            const tags = readTags(photo?.tags).filter(tag => tag.toLowerCase() !== managedTag.tag.toLowerCase());
            await queryConnection(connection, 'UPDATE photos SET tags = ? WHERE id = ?', [tags.join(', '), face.photo_id]);
            await queryConnection(connection, 'DELETE FROM person_photo_tags WHERE person_id = ? AND photo_id = ?', [face.person_id, face.photo_id]);
        }
    }
    const [personFaces] = await queryConnection(
        connection,
        'SELECT COUNT(*) AS faceCount FROM photo_faces WHERE person_id = ?',
        [face.person_id]
    );
    if (Number(personFaces.faceCount) === 0) {
        await queryConnection(connection, 'DELETE FROM people WHERE id = ?', [face.person_id]);
    }
    return { unassigned: true };
});

export const unassignPersonFaces = async (personId) => withTransaction(async (connection) => {
    const faces = await queryConnection(
        connection,
        'SELECT id, photo_id FROM photo_faces WHERE person_id = ? FOR UPDATE',
        [personId]
    );
    if (!faces.length) throw Object.assign(new Error('Named group not found.'), { statusCode: 404 });

    await queryConnection(connection, 'UPDATE photo_faces SET person_id = NULL WHERE person_id = ?', [personId]);
    for (const photoId of new Set(faces.map(face => face.photo_id))) {
        const [managedTag] = await queryConnection(
            connection,
            'SELECT tag FROM person_photo_tags WHERE person_id = ? AND photo_id = ? FOR UPDATE',
            [personId, photoId]
        );
        if (!managedTag) continue;
        const [photo] = await queryConnection(connection, 'SELECT tags FROM photos WHERE id = ? FOR UPDATE', [photoId]);
        const tags = readTags(photo?.tags).filter(tag => tag.toLowerCase() !== managedTag.tag.toLowerCase());
        await queryConnection(connection, 'UPDATE photos SET tags = ? WHERE id = ?', [tags.join(', '), photoId]);
    }
    await queryConnection(connection, 'DELETE FROM person_photo_tags WHERE person_id = ?', [personId]);
    await queryConnection(connection, 'DELETE FROM people WHERE id = ?', [personId]);
    return { unassigned: faces.length };
});

export const validateFaceEmbedding = (embedding) => normalizeEmbedding(embedding);

export default { getUnscannedPhotos, saveFaceScans, getFaceSuggestions, assignFacesToPerson, unassignFace, unassignPersonFaces };