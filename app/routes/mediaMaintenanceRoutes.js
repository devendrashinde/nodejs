import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import maintenance from '../services/mediaMaintenanceService.js';

export default function mediaMaintenanceRoutes(onCleanup = () => {}) {
    const router = Router();
    router.use(rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }));
    router.use((req, res, next) => {
        res.set('Cache-Control', 'no-store');
        if (!req.is('application/json')) return res.status(415).json({ error: 'JSON requests are required.' });
        next();
    });
    router.post('/scan', async (req, res) => {
        try {
            res.json(await maintenance.scan());
        } catch (error) {
            console.error('Missing media scan failed:', error);
            res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Unable to scan media. Check database access and the data directory.' });
        }
    });
    router.post('/clear', async (req, res) => {
        try {
            const result = await maintenance.clear(req.body);
            if (result.deleted) onCleanup();
            res.json(result);
        } catch (error) {
            console.error('Missing media cleanup failed:', error);
            res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Cleanup failed. No changes in this batch were committed.' });
        }
    });
    return router;
}