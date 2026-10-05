import fs from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from '../models/db.js';

const serviceDirectory = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.resolve(serviceDirectory, '../../data');
const maxMoveItems = 250;

class MediaMoveError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.name = 'MediaMoveError';
        this.statusCode = statusCode;
    }
}

const queryConnection = (connection, sql, parameters = []) => new Promise((resolve, reject) => {
    connection.query(sql, parameters, (error, results) => {
        if (error) reject(error);
        else resolve(results);
    });
});

const getConnection = () => new Promise((resolve, reject) => {
    pool.getConnection((error, connection) => {
        if (error) reject(error);
        else resolve(connection);
    });
});

const isWithinDataDirectory = (candidatePath) => {
    const relativePath = path.relative(dataDirectory, candidatePath);
    return relativePath !== ''
        && relativePath !== '..'
        && !relativePath.startsWith(`..${path.sep}`)
        && !path.isAbsolute(relativePath);
};

const moveWithoutOverwrite = async (sourcePath, destinationPath) => {
    try {
        await fs.link(sourcePath, destinationPath);
        try {
            await fs.unlink(sourcePath);
        } catch (error) {
            await fs.unlink(destinationPath).catch((cleanupError) => {
                console.error('Unable to clean up an incomplete media move:', destinationPath, cleanupError);
            });
            throw error;
        }
    } catch (error) {
        if (!['EXDEV', 'EPERM', 'EOPNOTSUPP', 'ENOSYS'].includes(error.code)) {
            throw error;
        }

        await fs.copyFile(sourcePath, destinationPath, fsConstants.COPYFILE_EXCL);
        try {
            await fs.unlink(sourcePath);
        } catch (unlinkError) {
            await fs.unlink(destinationPath).catch((cleanupError) => {
                console.error('Unable to clean up an incomplete media copy:', destinationPath, cleanupError);
            });
            throw unlinkError;
        }
    }
};
const isWithinRealDataDirectory = (realDataDirectory, candidatePath) => {
    const relativePath = path.relative(realDataDirectory, candidatePath);
    return relativePath !== ''
        && relativePath !== '..'
        && !relativePath.startsWith(`..${path.sep}`)
        && !path.isAbsolute(relativePath);
};

const normalizeRelativeSegments = (value) => {
    if (typeof value !== 'string') {
        throw new MediaMoveError('A valid album path is required.');
    }

    const normalized = value.replaceAll('\\', '/');
    const segments = normalized.split('/');
    if (!normalized || segments.some((segment) => !segment || segment === '.' || segment === '..')) {
        throw new MediaMoveError('The album path is invalid.');
    }

    return segments;
};

const normalizeSelectedMediaPath = (value) => {
    if (typeof value !== 'string') {
        throw new MediaMoveError('Selected media paths must be strings.');
    }

    const normalized = value.replaceAll('\\', '/').replace(/^\/+/, '');
    if (!normalized.startsWith('data/')) {
        throw new MediaMoveError('Selected media must be inside the data directory.');
    }

    const relativePath = normalized.slice('data/'.length);
    return normalizeRelativeSegments(relativePath).join('/');
};

export const getPhotoDatabaseLocation = (relativeMediaPath) => {
    const segments = relativeMediaPath.split('/');
    const name = segments.pop();
    const directoryDepth = segments.length;
    const album = segments.pop() || 'data';
    let storedPath = '';
    if (segments.length) {
        storedPath = `data/${segments.join('/')}`;
    } else if (directoryDepth) {
        storedPath = 'data';
    }

    return { path: storedPath, album, name };
};

const pathExists = async (candidatePath) => {
    try {
        await fs.lstat(candidatePath);
        return true;
    } catch (error) {
        if (error.code === 'ENOENT') return false;
        throw error;
    }
};

export const listMediaMoveDestinations = async () => {
    const destinations = [];

    const visitDirectory = async (absoluteDirectory, relativeDirectory, depth) => {
        if (depth > 16 || destinations.length >= 5000) return;

        let entries;
        try {
            entries = await fs.readdir(absoluteDirectory, { withFileTypes: true });
        } catch (error) {
            if (relativeDirectory) return;
            throw error;
        }

        for (const entry of entries) {
            if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

            const relativePath = relativeDirectory
                ? `${relativeDirectory}/${entry.name}`
                : entry.name;
            const absolutePath = path.join(absoluteDirectory, entry.name);
            destinations.push({
                path: relativePath,
                label: relativePath.replaceAll('/', ' / ')
            });

            await visitDirectory(absolutePath, relativePath, depth + 1);
            if (destinations.length >= 5000) break;
        }
    };

    await visitDirectory(dataDirectory, '', 0);
    destinations.sort((left, right) => left.label.localeCompare(right.label));
    return destinations;
};

const resolveDestinationAlbum = async (destinationAlbum) => {
    const segments = normalizeRelativeSegments(destinationAlbum);
    const relativePath = segments.join('/');
    const absolutePath = path.resolve(dataDirectory, ...segments);
    if (!isWithinDataDirectory(absolutePath)) {
        throw new MediaMoveError('The destination must be inside the data directory.');
    }

    const stats = await fs.lstat(absolutePath).catch((error) => {
        if (error.code === 'ENOENT') throw new MediaMoveError('The destination album no longer exists.', 404);
        throw error;
    });
    if (!stats.isDirectory() || stats.isSymbolicLink()) {
        throw new MediaMoveError('The destination must be an existing album directory.');
    }

    const realDataPath = await fs.realpath(dataDirectory);
    const realDestinationPath = await fs.realpath(absolutePath);
    if (!isWithinRealDataDirectory(realDataPath, realDestinationPath)) {
        throw new MediaMoveError('The destination must resolve inside the data directory.');
    }

    return { relativePath, absolutePath, realDataPath };
};

const resolveSelectedFile = async (selectedPath, realDataPath) => {
    const relativePath = normalizeSelectedMediaPath(selectedPath);
    const absolutePath = path.resolve(dataDirectory, ...relativePath.split('/'));
    if (!isWithinDataDirectory(absolutePath)) {
        throw new MediaMoveError('A selected file is outside the data directory.');
    }

    const stats = await fs.lstat(absolutePath).catch((error) => {
        if (error.code === 'ENOENT') throw new MediaMoveError(`A selected file no longer exists: ${selectedPath}`, 404);
        throw error;
    });
    if (!stats.isFile() || stats.isSymbolicLink()) {
        throw new MediaMoveError('Only regular media files can be moved.');
    }

    const realPath = await fs.realpath(absolutePath);
    if (!isWithinRealDataDirectory(realDataPath, realPath)) {
        throw new MediaMoveError('A selected file resolves outside the data directory.');
    }

    return { relativePath, absolutePath, realPath };
};

const createMovePlan = async (selectedPath, destination, reservedPaths) => {
    const source = await resolveSelectedFile(selectedPath, destination.realDataPath);
    const fileName = path.posix.basename(source.relativePath);
    const targetPath = path.join(destination.absolutePath, fileName);
    if (source.absolutePath === targetPath) return null;

    const destinationKey = process.platform === 'win32' ? targetPath.toLowerCase() : targetPath;
    if (reservedPaths.has(destinationKey)) {
        throw new MediaMoveError(`More than one selected file would become ${fileName}.`, 409);
    }
    reservedPaths.add(destinationKey);

    if (await pathExists(targetPath)) {
        throw new MediaMoveError(`A file named ${fileName} already exists in the destination album.`, 409);
    }

    const targetRelativePath = `${destination.relativePath}/${fileName}`;
    return {
        sourcePath: source.absolutePath,
        realSourcePath: source.realPath,
        targetPath,
        destinationDirectory: destination.absolutePath,
        sourceRelativePath: `data/${source.relativePath}`,
        targetRelativePath: `data/${targetRelativePath}`,
        sourceDatabaseLocation: getPhotoDatabaseLocation(source.relativePath),
        targetDatabaseLocation: getPhotoDatabaseLocation(targetRelativePath)
    };
};

const getPhotoEditions = async (connection, photoId) => {
    if (!photoId) return [];
    try {
        return await queryConnection(
            connection,
            'SELECT id, filename, path FROM photo_editions WHERE photo_id = ? ORDER BY version_number FOR UPDATE',
            [photoId]
        );
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') return [];
        throw error;
    }
};

const getEditionMovePlan = async (edition, move, realDataPath, reservedPaths) => {
    const editionDirectory = path.isAbsolute(edition.path)
        ? path.resolve(edition.path)
        : path.resolve(serviceDirectory, '../../', edition.path);
    const sourcePath = path.resolve(editionDirectory, edition.filename);
    if (!isWithinDataDirectory(sourcePath)) {
        throw new MediaMoveError('An edited version is outside the data directory.', 409);
    }

    const stats = await fs.lstat(sourcePath).catch((error) => {
        if (error.code === 'ENOENT') {
            throw new MediaMoveError('A saved edited version is missing; repair edit history before moving this file.', 409);
        }
        throw error;
    });
    if (!stats.isFile() || stats.isSymbolicLink()) {
        throw new MediaMoveError('A saved edited version is not a regular file.', 409);
    }
    const realSourcePath = await fs.realpath(sourcePath);
    if (!isWithinRealDataDirectory(realDataPath, realSourcePath)) {
        throw new MediaMoveError('An edited version resolves outside the data directory.', 409);
    }

    const targetPath = path.join(move.destinationDirectory, edition.filename);
    const isOriginalFile = realSourcePath === move.realSourcePath;
    if (!isOriginalFile) {
        const destinationKey = process.platform === 'win32' ? targetPath.toLowerCase() : targetPath;
        if (reservedPaths.has(destinationKey)) {
            throw new MediaMoveError(`An edited version would conflict with ${edition.filename}.`, 409);
        }
        reservedPaths.add(destinationKey);
        if (await pathExists(targetPath)) {
            throw new MediaMoveError(`An edited version named ${edition.filename} already exists in the destination album.`, 409);
        }
    }

    return {
        id: edition.id,
        sourcePath: isOriginalFile ? null : sourcePath,
        targetPath,
        targetDirectory: move.destinationDirectory
    };
};

const planPhotoEditions = async (connection, move, realDataPath, reservedPaths) => {
    const editions = await getPhotoEditions(connection, move.photoId);
    const editionMoves = [];
    for (const edition of editions) {
        editionMoves.push(await getEditionMovePlan(edition, move, realDataPath, reservedPaths));
    }
    return editionMoves;
};

const prepareMovePlans = async (photoPaths, destinationAlbum) => {
    if (!Array.isArray(photoPaths) || photoPaths.length === 0) {
        throw new MediaMoveError('Select at least one media file.');
    }
    if (photoPaths.length > maxMoveItems) {
        throw new MediaMoveError(`Move no more than ${maxMoveItems} files at a time.`, 413);
    }

    const destination = await resolveDestinationAlbum(destinationAlbum);
    const uniquePaths = [...new Set(photoPaths)];
    const movePlans = [];
    const reservedPaths = new Set();
    for (const selectedPath of uniquePaths) {
        const plan = await createMovePlan(selectedPath, destination, reservedPaths);
        if (plan) movePlans.push(plan);
    }

    return { movePlans, unchanged: uniquePaths.length - movePlans.length, destination, reservedPaths };
};

const lockAndValidatePhotoRows = async (connection, movePlans, destination, reservedPaths) => {
    for (const move of movePlans) {
        const source = move.sourceDatabaseLocation;
        const sourceRows = await queryConnection(
            connection,
            'SELECT id FROM photos WHERE BINARY path = BINARY ? AND BINARY album = BINARY ? AND BINARY name = BINARY ? FOR UPDATE',
            [source.path, source.album, source.name]
        );
        if (sourceRows.length > 1) {
            throw new MediaMoveError('More than one database record matches a selected file path.', 409);
        }
        move.photoId = sourceRows[0]?.id;

        const target = move.targetDatabaseLocation;
        const targetRows = await queryConnection(
            connection,
            'SELECT id FROM photos WHERE BINARY path = BINARY ? AND BINARY album = BINARY ? AND BINARY name = BINARY ? FOR UPDATE',
            [target.path, target.album, target.name]
        );
        if (targetRows.length) {
            throw new MediaMoveError('The destination already has a database record for this filename.', 409);
        }

        move.editionMoves = await planPhotoEditions(connection, move, destination.realDataPath, reservedPaths);
    }
};

const updateDatabaseForMove = async (connection, move) => {
    const target = move.targetDatabaseLocation;
    if (move.photoId) {
        await queryConnection(
            connection,
            'UPDATE photos SET path = ?, album = ?, name = ? WHERE id = ?',
            [target.path, target.album, target.name, move.photoId]
        );
    }

    await queryConnection(
        connection,
        'UPDATE favorites SET photo_path = ?, photo_name = ?, album = ? WHERE BINARY photo_path = BINARY ?',
        [move.targetRelativePath, target.name, target.album, move.sourceRelativePath]
    );

    for (const edition of move.editionMoves || []) {
        await queryConnection(
            connection,
            'UPDATE photo_editions SET path = ? WHERE id = ?',
            [edition.targetDirectory, edition.id]
        );
    }
};

const restoreMovedFiles = async (moves) => {
    const movesToRestore = [...moves].reverse();
    for (const move of movesToRestore) {
        try {
            await moveWithoutOverwrite(move.targetPath, move.sourcePath);
        } catch (error) {
            console.error('Failed to restore moved media file:', move.sourcePath, error);
        }
    }
};

const beginTransaction = (connection) => new Promise((resolve, reject) => {
    connection.beginTransaction((error) => error ? reject(error) : resolve());
});

const finishTransaction = (connection) => new Promise((resolve, reject) => {
    connection.commit((error) => error ? reject(error) : resolve());
});

const rollbackTransaction = (connection) => new Promise((resolve) => {
    connection.rollback(() => resolve());
});

const applyMovePlans = async (connection, movePlans) => {
    const completedMoves = [];
    for (const move of movePlans) {
        await moveWithoutOverwrite(move.sourcePath, move.targetPath);
        completedMoves.push(move);

        for (const edition of move.editionMoves || []) {
            if (!edition.sourcePath) continue;
            await moveWithoutOverwrite(edition.sourcePath, edition.targetPath);
            completedMoves.push(edition);
        }

        await updateDatabaseForMove(connection, move);
    }
    return completedMoves;
};

export const moveMediaFiles = async (photoPaths, destinationAlbum) => {
    const { movePlans, unchanged, destination, reservedPaths } = await prepareMovePlans(photoPaths, destinationAlbum);
    if (movePlans.length === 0) {
        return { moved: 0, unchanged, movedPaths: [] };
    }

    const connection = await getConnection();
    let completedMoves = [];
    try {
        await beginTransaction(connection);
        await lockAndValidatePhotoRows(connection, movePlans, destination, reservedPaths);
        completedMoves = await applyMovePlans(connection, movePlans);
        await finishTransaction(connection);

        return {
            moved: completedMoves.length,
            unchanged,
            movedPaths: completedMoves.map((move) => move.sourceRelativePath)
        };
    } catch (error) {
        await rollbackTransaction(connection);
        await restoreMovedFiles(completedMoves);
        throw error;
    } finally {
        connection.release();
    }
};