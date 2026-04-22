import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import pool from '../config/database';

const router = Router();

/**
 * GET /leaderboard
 * Top 50 users ranked by total points, with route/stop stats
 */
router.get('/', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.username,
        u.total_points,
        COALESCE(completed.count, 0)::int  AS completed_routes,
        COALESCE(visited.count, 0)::int    AS stops_visited,
        RANK() OVER (ORDER BY u.total_points DESC)::int AS rank
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*)::int AS count
        FROM user_route_progress
        WHERE is_completed = true
        GROUP BY user_id
      ) completed ON completed.user_id = u.id
      LEFT JOIN (
        SELECT user_id, COUNT(*)::int AS count
        FROM checkins
        GROUP BY user_id
      ) visited ON visited.user_id = u.id
      ORDER BY u.total_points DESC
      LIMIT 50
    `);

    res.json({ leaderboard: result.rows });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
