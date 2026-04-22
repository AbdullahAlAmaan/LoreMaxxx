import pool from '../config/database';

export class RouteService {
  /**
   * Get all routes with stop count and optionally user progress
   */
  async getAllRoutes(userId?: number) {
    const query = `
      SELECT
        r.id,
        r.name,
        r.description,
        r.difficulty,
        r.total_points,
        r.bonus_points,
        r.image_url,
        r.created_at,
        ST_AsGeoJSON(r.polyline)::json AS polyline,
        COUNT(s.id)::int AS stop_count,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', s.id,
              'name', s.name,
              'latitude', s.latitude,
              'longitude', s.longitude,
              'rarity', s.rarity,
              'stop_order', s.stop_order
            ) ORDER BY s.stop_order
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'::json
        ) AS stops
        ${userId ? `,
        COALESCE(urp.stops_completed, 0)::int AS stops_completed,
        COALESCE(urp.is_completed, false) AS is_completed
        ` : ''}
      FROM routes r
      LEFT JOIN stops s ON s.route_id = r.id
      ${userId ? `
      LEFT JOIN user_route_progress urp ON urp.route_id = r.id AND urp.user_id = $1
      ` : ''}
      GROUP BY r.id${userId ? ', urp.stops_completed, urp.is_completed' : ''}
      ORDER BY r.id
    `;

    const params = userId ? [userId] : [];
    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get a single route with all stops and user check-in status
   */
  async getRouteById(routeId: number, userId?: number) {
    // Get route
    const routeQuery = `
      SELECT 
        r.id,
        r.name,
        r.description,
        r.difficulty,
        r.total_points,
        r.bonus_points,
        r.image_url,
        r.created_at,
        ST_AsGeoJSON(r.polyline)::json AS polyline
      FROM routes r
      WHERE r.id = $1
    `;
    const routeResult = await pool.query(routeQuery, [routeId]);

    if (routeResult.rows.length === 0) {
      return null;
    }

    const route = routeResult.rows[0];

    // Get stops with check-in status
    const stopsQuery = `
      SELECT 
        s.id,
        s.route_id,
        s.name,
        s.description,
        s.latitude,
        s.longitude,
        s.rarity,
        s.points,
        s.stop_order,
        s.image_url,
        s.created_at
        ${userId ? `,
        CASE WHEN c.id IS NOT NULL THEN true ELSE false END AS is_checked_in,
        c.checked_in_at
        ` : ''}
      FROM stops s
      ${userId ? `
      LEFT JOIN checkins c ON c.stop_id = s.id AND c.user_id = $2
      ` : ''}
      WHERE s.route_id = $1
      ORDER BY s.stop_order
    `;

    const stopsParams = userId ? [routeId, userId] : [routeId];
    const stopsResult = await pool.query(stopsQuery, stopsParams);

    // Get user progress
    let userProgress = null;
    if (userId) {
      const progressQuery = `
        SELECT * FROM user_route_progress
        WHERE user_id = $1 AND route_id = $2
      `;
      const progressResult = await pool.query(progressQuery, [userId, routeId]);
      userProgress = progressResult.rows[0] || null;
    }

    return {
      ...route,
      stops: stopsResult.rows,
      user_progress: userProgress,
    };
  }
}

export default new RouteService();
