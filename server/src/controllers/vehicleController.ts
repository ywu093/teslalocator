import { Request, Response } from 'express';
import teslaService from '../services/teslaService';

export const getVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await teslaService.getVehicles();
    res.json({ vehicles });
  } catch (error: any) {
    console.error('Error in getVehicles:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch vehicles' });
  }
};

export const getVehicleLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const location = await teslaService.getVehicleLocation(id);
    res.json(location);
  } catch (error: any) {
    console.error('Error in getVehicleLocation:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch vehicle location' });
  }
};

export const wakeVehicle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await teslaService.wakeVehicle(id);
    res.json({ message: 'Wake up command sent successfully' });
  } catch (error: any) {
    console.error('Error in wakeVehicle:', error);
    res.status(500).json({ error: error.message || 'Failed to wake vehicle' });
  }
};
