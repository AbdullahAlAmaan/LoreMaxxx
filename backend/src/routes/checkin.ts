import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import checkinService from '../services/checkin.service';

const router = Router();

/**
 * POST /checkin
 * Check in at a stop with GPS validation
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { stopId, latitude, longitude } = req.body;

    // Validation
    if (!stopId || latitude === undefined || longitude === undefined) {
      res.status(400).json({ error: 'stopId, latitude, and longitude are required' });
      return;
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      res.status(400).json({ error: 'latitude and longitude must be numbers' });
      return;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      res.status(400).json({ error: 'Invalid coordinates' });
      return;
    }

    const result = await checkinService.processCheckin(userId, {
      stopId,
      latitude,
      longitude,
    });

    res.json(result);
  } catch (err: any) {
    const message = err.message || 'Internal server error';

    // Known validation errors
    if (
      message.includes('Too far') ||
      message.includes('already checked in') ||
      message.includes('not found')
    ) {
      res.status(400).json({ error: message, success: false });
      return;
    }

    console.error('Check-in error:', err);
    res.status(500).json({ error: 'Internal server error', success: false });
  }
});

export default router;
