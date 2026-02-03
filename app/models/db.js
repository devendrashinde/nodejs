'use strict';

import dotenv from 'dotenv';
import { createPool } from 'mysql';

// Load environment variables from .env file
dotenv.config();

// MySQL connection pool configuration
const pool = createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'photos',
    database: process.env.DB_NAME || 'mydb',
    multipleStatements: true,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test connection on startup
pool.getConnection((err, connection) => {
    if (err) {
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
        console.log('✓ Database connected successfully');
        connection.release();
    }
});

// Handle pool errors
pool.on('error', (err) => {
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
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

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
