import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import pool from '../config/database';

const router = Router();

/**
 * GET /profile/:userId?
 * Get user profile with stats, completed routes, and recent check-ins
 */
router.get('/:userId?', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId || req.user!.userId;

    // Get user info
    const userQuery = `
      SELECT id, username, email, total_points, created_at
      FROM users WHERE id = $1
    `;
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = userResult.rows[0];

    // Get completed routes count
    const completedQuery = `
      SELECT COUNT(*)::int AS completed
      FROM user_route_progress
      WHERE user_id = $1 AND is_completed = true
    `;
    const completedResult = await pool.query(completedQuery, [userId]);
    const completedRoutes = completedResult.rows[0].completed;

    // Get total available routes
    const totalRoutesResult = await pool.query('SELECT COUNT(*)::int AS total FROM routes');
    const totalRoutesAvailable = totalRoutesResult.rows[0].total;

    // Get total stops visited
    const stopsVisitedQuery = `
      SELECT COUNT(*)::int AS total
      FROM checkins WHERE user_id = $1
    `;
    const stopsVisitedResult = await pool.query(stopsVisitedQuery, [userId]);
    const totalStopsVisited = stopsVisitedResult.rows[0].total;

    // Get recent check-ins
    const recentQuery = `
      SELECT 
        c.id,
        c.stop_id,
        c.route_id,
        c.distance_m,
        c.points_earned,
        c.checked_in_at,
        s.name AS stop_name,
        s.rarity,
        r.name AS route_name
      FROM checkins c
      JOIN stops s ON s.id = c.stop_id
      JOIN routes r ON r.id = c.route_id
      WHERE c.user_id = $1
      ORDER BY c.checked_in_at DESC
      LIMIT 10
    `;
    const recentResult = await pool.query(recentQuery, [userId]);

    // Get route progress
    const progressQuery = `
      SELECT 
        urp.*,
        r.name AS route_name,
        r.difficulty
      FROM user_route_progress urp
      JOIN routes r ON r.id = urp.route_id
      WHERE urp.user_id = $1
      ORDER BY urp.is_completed ASC, urp.stops_completed DESC
    `;
    const progressResult = await pool.query(progressQuery, [userId]);

    res.json({
      user,
      totalPoints: user.total_points,
      completedRoutes,
      totalRoutesAvailable,
      totalStopsVisited,
      recentCheckins: recentResult.rows,
      routeProgress: progressResult.rows,
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
