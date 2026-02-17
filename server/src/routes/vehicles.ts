import { Router } from 'express';
import { getVehicles, getVehicleLocation, wakeVehicle } from '../controllers/vehicleController';

const router = Router();

router.get('/', getVehicles);
router.get('/:id/location', getVehicleLocation);
router.post('/:id/wake', wakeVehicle);

export default router;
