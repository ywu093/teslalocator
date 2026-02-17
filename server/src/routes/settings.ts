import { Router } from 'express';
import { getStatus, updateFleetConfig, getAuthUrl, handleCallback } from '../controllers/settingsController';

const router = Router();

router.get('/status', getStatus);
router.post('/fleet-config', updateFleetConfig);
router.get('/auth-url', getAuthUrl);

export default router;
