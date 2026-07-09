'use strict';

import dotenv from 'dotenv';
import { createPool } from 'mysql';

// Load environment variables from .env file
dotenv.config();

const DB_CONNECTION_LIMIT = Number.parseInt(process.env.DB_CONNECTION_LIMIT || '', 10) || 10;
const DB_CONNECT_TIMEOUT_MS = Number.parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '', 10) || 5000;
const DB_ACQUIRE_TIMEOUT_MS = Number.parseInt(process.env.DB_ACQUIRE_TIMEOUT_MS || '', 10) || 10000;

const dbStatus = {
    connected: false,
    lastSuccessAt: null,
    lastError: null,
    lastErrorCode: null,
    lastErrorAt: null,
    config: {
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'mydb',
        connectionLimit: DB_CONNECTION_LIMIT,
        connectTimeoutMs: DB_CONNECT_TIMEOUT_MS,
        acquireTimeoutMs: DB_ACQUIRE_TIMEOUT_MS
    }
};

const markDbSuccess = () => {
    dbStatus.connected = true;
    dbStatus.lastSuccessAt = new Date().toISOString();
    dbStatus.lastError = null;
    dbStatus.lastErrorCode = null;
};

const markDbError = (err) => {
    dbStatus.connected = false;
    dbStatus.lastError = err?.message || 'Unknown database error';
    dbStatus.lastErrorCode = err?.code || null;
    dbStatus.lastErrorAt = new Date().toISOString();
};

// MySQL connection pool configuration
const pool = createPool({
    connectionLimit: DB_CONNECTION_LIMIT,
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'photos',
    database: process.env.DB_NAME || 'mydb',
    multipleStatements: true,
    waitForConnections: true,
    queueLimit: 0,
    connectTimeout: DB_CONNECT_TIMEOUT_MS,
    acquireTimeout: DB_ACQUIRE_TIMEOUT_MS,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test connection on startup
pool.getConnection((err, connection) => {
    if (err) {
        markDbError(err);
        console.error('❌ Database connection failed:', err.message);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.');
        }
    } else {
        markDbSuccess();
        console.log('✓ Database connected successfully');
        connection.release();
    }
});

// Handle pool errors
pool.on('error', (err) => {
    markDbError(err);
    console.error('Unexpected database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        // Connection lost, pool will automatically reconnect
        console.log('Database connection lost, reconnecting...');
    } else {
        throw err;
    }
});

// Promisified query function for async/await
export const query = (sql, params) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, results) => {
            if (err) {
                markDbError(err);
                reject(err);
            } else {
                markDbSuccess();
                resolve(results);
            }
        });
    });
};

export const getDbStatus = () => ({
    ...dbStatus,
    config: { ...dbStatus.config }
});

// Graceful shutdown
export const closePool = () => {
    return new Promise((resolve, reject) => {
        pool.end((err) => {
            if (err) {
                console.error('Error closing database pool:', err);
                reject(err);
            } else {
                console.log('✓ Database pool closed');
                resolve();
            }
        });
    });
};

export default pool;
