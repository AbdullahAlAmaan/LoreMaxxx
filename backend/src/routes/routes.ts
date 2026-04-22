import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import routeService from '../services/route.service';

const router = Router();

/**
 * GET /routes
 * List all routes with stop counts and user progress
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const routes = await routeService.getAllRoutes(userId);

    res.json({
      routes,
      total: routes.length,
    });
  } catch (err) {
    console.error('Get routes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /routes/:id
 * Get a single route with all stops and user check-in status
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const routeId = parseInt(req.params.id as string, 10);

    if (isNaN(routeId)) {
      res.status(400).json({ error: 'Invalid route ID' });
      return;
    }

    const userId = req.user?.userId;
    const route = await routeService.getRouteById(routeId, userId);

    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    res.json({ route });
  } catch (err) {
    console.error('Get route error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
