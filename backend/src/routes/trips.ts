import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import tripService from '../services/trip.service';

const router = Router();

/**
 * POST /trips/start
 * Start a trip — validates user is within 5 km of the first stop
 */
router.post('/start', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { routeId, latitude, longitude } = req.body;

    // Validation
    if (!routeId || latitude === undefined || longitude === undefined) {
      res.status(400).json({ error: 'routeId, latitude, and longitude are required' });
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

    const result = await tripService.startTrip(userId, routeId, latitude, longitude);
    res.json(result);
  } catch (err: any) {
    const message = err.message || 'Internal server error';

    if (
      message.includes('Too far') ||
      message.includes('no stops') ||
      message.includes('not found')
    ) {
      res.status(400).json({ error: message, success: false });
      return;
    }

    console.error('Trip start error:', err);
    res.status(500).json({ error: 'Internal server error', success: false });
  }
});

/**
 * POST /trips/finish
 * Finish a trip — validates GPS proximity to last stop, awards bonus points
 */
router.post('/finish', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { routeId, latitude, longitude } = req.body;

    // Validation
    if (!routeId || latitude === undefined || longitude === undefined) {
      res.status(400).json({ error: 'routeId, latitude, and longitude are required' });
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

    const result = await tripService.finishTrip(userId, routeId, latitude, longitude);
    res.json(result);
  } catch (err: any) {
    const message = err.message || 'Internal server error';

    if (
      message.includes('Too far') ||
      message.includes('must start') ||
      message.includes('already been completed') ||
      message.includes('Not all stops')
    ) {
      res.status(400).json({ error: message, success: false });
      return;
    }

    console.error('Trip finish error:', err);
    res.status(500).json({ error: 'Internal server error', success: false });
  }
});

export default router;
