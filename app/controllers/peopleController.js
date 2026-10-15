import {
    assignFacesToPerson,
    assignFaceReference,
    getFaceReference,
    getFaceSuggestions,
    getUnscannedPhotos,
    normalizeAlbumScope,
    saveFaceScans,
    unassignFace,
    unassignPersonFaces,
    validateFaceEmbedding
} from '../services/faceLibraryService.js';

const errorResponse = (res, error, fallback) => {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    if (error.code === 'ER_NO_SUCH_TABLE') {
        return res.status(503).json({
            error: 'Face grouping requires the v4.1 database migration. Back up the database, then run the matching migration in sql/. '
        });
    }
    console.error(fallback, error);
    return res.status(500).json({ error: fallback });
};

export const getFaceSuggestionsRoute = async (req, res) => {
    try {
        const rawThreshold = req.query.threshold;
        const threshold = rawThreshold === undefined ? 0.88 : Number(rawThreshold);
        if (!Number.isFinite(threshold) || threshold < 0.5 || threshold > 0.99) {
            return res.status(400).json({ error: 'Similarity threshold must be between 0.5 and 0.99.' });
        }
        return res.json(await getFaceSuggestions(threshold));
    } catch (error) {
        return errorResponse(res, error, 'Could not load face groups.');
    }
};

export const getUnscannedPhotosRoute = async (req, res) => {
    const afterId = req.query.afterId === undefined ? 0 : Number(req.query.afterId);
    if (!Number.isSafeInteger(afterId) || afterId < 0) return res.status(400).json({ error: 'Invalid scan cursor.' });
    try {
        const albumPath = normalizeAlbumScope(req.query.album);
        const photoId = req.query.photoId === undefined ? null : Number(req.query.photoId);
        if (photoId !== null && (!Number.isSafeInteger(photoId) || photoId < 1)) return res.status(400).json({ error: 'Invalid photo ID.' });
        return res.json({ albumPath, photoId, photos: await getUnscannedPhotos(afterId, 100, albumPath, photoId) });
    } catch (error) {
        return errorResponse(res, error, 'Could not list photos to scan.');
    }
};

export const getFaceReferenceRoute = async (req, res) => {
    const photoId = Number(req.params.photoId);
    if (!Number.isSafeInteger(photoId) || photoId < 1) return res.status(400).json({ error: 'Invalid photo ID.' });
    try {
        return res.json(await getFaceReference(photoId));
    } catch (error) {
        return errorResponse(res, error, 'Could not load reference photo.');
    }
};

export const assignFaceReferenceRoute = async (req, res) => {
    const faceId = Number(req.body?.faceId);
    const tag = typeof req.body?.tag === 'string' ? req.body.tag.trim() : '';
    const invalidCharacter = Array.from(tag).some(character => character === ',' || character.codePointAt(0) < 32 || character.codePointAt(0) === 127);
    if (!Number.isSafeInteger(faceId) || faceId < 1) return res.status(400).json({ error: 'Invalid face ID.' });
    if (!tag || tag.length > 100 || invalidCharacter) return res.status(400).json({ error: 'Choose one valid existing photo tag.' });
    try {
        return res.json(await assignFaceReference(faceId, tag));
    } catch (error) {
        return errorResponse(res, error, 'Could not use this face as a reference.');
    }
};

export const saveFaceScansRoute = async (req, res) => {
    const scans = req.body?.scans;
    if (!Array.isArray(scans) || scans.length < 1 || scans.length > 25) {
        return res.status(400).json({ error: 'Submit between 1 and 25 photo scans.' });
    }

    const photoIds = new Set();
    let totalFaces = 0;
    try {
        const validatedScans = scans.map(scan => {
            if (!Number.isSafeInteger(scan?.photoId) || scan.photoId < 1 || photoIds.has(scan.photoId)) {
                throw Object.assign(new Error('Photo IDs must be unique positive integers.'), { statusCode: 400 });
            }
            photoIds.add(scan.photoId);
            if (!Array.isArray(scan.faces) || scan.faces.length > 20) {
                throw Object.assign(new Error('Each photo can contain at most 20 detected faces.'), { statusCode: 400 });
            }
            totalFaces += scan.faces.length;
            if (totalFaces > 250) throw Object.assign(new Error('A scan batch can contain at most 250 faces.'), { statusCode: 400 });
            const faces = scan.faces.map(face => {
                const box = face?.box;
                if (!Array.isArray(box) || box.length !== 4 || box.some(value => !Number.isFinite(value)) || box[0] < 0 || box[1] < 0 || box[2] <= 0 || box[3] <= 0) {
                    throw Object.assign(new Error('Face boxes are invalid.'), { statusCode: 400 });
                }
                if (!Number.isFinite(face.confidence) || face.confidence < 0 || face.confidence > 1) {
                    throw Object.assign(new Error('Face confidence must be between 0 and 1.'), { statusCode: 400 });
                }
                return { embedding: validateFaceEmbedding(face.embedding), box, confidence: face.confidence };
            });
            return { photoId: scan.photoId, faces };
        });
        return res.json(await saveFaceScans(validatedScans));
    } catch (error) {
        return errorResponse(res, error, 'Could not save face scans.');
    }
};

export const assignFacesRoute = async (req, res) => {
    const faceIds = req.body?.faceIds;
    const personName = typeof req.body?.personName === 'string' ? req.body.personName.trim() : '';
    if (!Array.isArray(faceIds) || faceIds.length < 1 || faceIds.length > 500 || faceIds.some(id => !Number.isSafeInteger(id) || id < 1)) {
        return res.status(400).json({ error: 'Select between 1 and 500 valid faces.' });
    }
    const hasInvalidCharacter = Array.from(personName).some(character => character === ',' || character.codePointAt(0) < 32 || character.codePointAt(0) === 127);
    if (!personName || personName.length > 100 || hasInvalidCharacter) {
        return res.status(400).json({ error: 'Enter a person name of 1 to 100 characters without commas.' });
    }
    if (new Set(faceIds).size !== faceIds.length) {
        return res.status(400).json({ error: 'Face IDs must be unique.' });
    }
    try {
        return res.json(await assignFacesToPerson(faceIds, personName));
    } catch (error) {
        return errorResponse(res, error, 'Could not assign faces.');
    }
};

export const unassignFaceRoute = async (req, res) => {
    const faceId = Number(req.params.faceId);
    if (!Number.isSafeInteger(faceId) || faceId < 1) return res.status(400).json({ error: 'Invalid face ID.' });
    try {
        return res.json(await unassignFace(faceId));
    } catch (error) {
        return errorResponse(res, error, 'Could not unassign face.');
    }
};

export const unassignPersonRoute = async (req, res) => {
    const personId = Number(req.params.personId);
    if (!Number.isSafeInteger(personId) || personId < 1) return res.status(400).json({ error: 'Invalid person ID.' });
    try {
        return res.json(await unassignPersonFaces(personId));
    } catch (error) {
        return errorResponse(res, error, 'Could not split named group.');
    }
};

export default {
    getFaceSuggestionsRoute,
    getUnscannedPhotosRoute,
    getFaceReferenceRoute,
    assignFaceReferenceRoute,
    saveFaceScansRoute,
    assignFacesRoute,
    unassignFaceRoute,
    unassignPersonRoute
};