import pool from '../config/database';

const TRIP_PROXIMITY_RADIUS = 5000; // 5 km in meters

export class TripService {
  /**
   * Start a trip — validates user is within 5 km of the first stop
   */
  async startTrip(
    userId: number,
    routeId: number,
    latitude: number,
    longitude: number
  ): Promise<{ success: boolean; message: string }> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Get the first stop of the route
      const firstStopResult = await client.query(
        `SELECT id, name, latitude, longitude, location
         FROM stops
         WHERE route_id = $1
         ORDER BY stop_order ASC
         LIMIT 1`,
        [routeId]
      );

      if (firstStopResult.rows.length === 0) {
        throw new Error('Route has no stops');
      }

      const firstStop = firstStopResult.rows[0];

      // 2. Calculate distance using PostGIS
      const distResult = await client.query(
        `SELECT ST_Distance(
           ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
           s.location::geography
         ) AS distance_meters
         FROM stops s
         WHERE s.id = $3`,
        [longitude, latitude, firstStop.id]
      );

      const distance = distResult.rows[0].distance_meters;

      // 3. Validate distance (5 km)
      if (distance > TRIP_PROXIMITY_RADIUS) {
        throw new Error(
          `Too far from the starting point "${firstStop.name}". ` +
          `You are ${(distance / 1000).toFixed(1)} km away. ` +
          `You must be within ${TRIP_PROXIMITY_RADIUS / 1000} km to start the trip.`
        );
      }

      // 4. Get total stops count
      const totalStopsResult = await client.query(
        `SELECT COUNT(*)::int AS total FROM stops WHERE route_id = $1`,
        [routeId]
      );
      const totalStops = totalStopsResult.rows[0].total;

      // 5. Upsert user_route_progress with started_at
      await client.query(
        `INSERT INTO user_route_progress (user_id, route_id, stops_completed, total_stops, started_at, start_location)
         VALUES ($1, $2, 0, $3, NOW(), ST_SetSRID(ST_MakePoint($4, $5), 4326))
         ON CONFLICT (user_id, route_id)
         DO UPDATE SET
           started_at = CASE
             WHEN user_route_progress.started_at IS NULL THEN NOW()
             ELSE user_route_progress.started_at
           END,
           start_location = CASE
             WHEN user_route_progress.start_location IS NULL THEN ST_SetSRID(ST_MakePoint($4, $5), 4326)
             ELSE user_route_progress.start_location
           END`,
        [userId, routeId, totalStops, longitude, latitude]
      );

      await client.query('COMMIT');

      return {
        success: true,
        message: `Trip started! You are ${(distance / 1000).toFixed(1)} km from "${firstStop.name}". Go explore!`,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Finish a trip — validates:
   *   1. Trip was started
   *   2. All stops are checked in
   *   3. User is within 5 km of the last stop
   * Awards route completion bonus points.
   */
  async finishTrip(
    userId: number,
    routeId: number,
    latitude: number,
    longitude: number
  ): Promise<{
    success: boolean;
    pointsAwarded: number;
    totalPoints: number;
    message: string;
    stopPoints: number;
    bonusPoints: number;
  }> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Check trip was started
      const progressResult = await client.query(
        `SELECT * FROM user_route_progress WHERE user_id = $1 AND route_id = $2`,
        [userId, routeId]
      );

      if (progressResult.rows.length === 0 || !progressResult.rows[0].started_at) {
        throw new Error('You must start the trip before finishing it.');
      }

      const progress = progressResult.rows[0];

      if (progress.is_completed) {
        throw new Error('This trip has already been completed.');
      }

      // 2. Verify all stops are checked in
      const stopsCompletedResult = await client.query(
        `SELECT COUNT(*)::int AS completed
         FROM checkins
         WHERE user_id = $1 AND route_id = $2`,
        [userId, routeId]
      );
      const stopsCompleted = stopsCompletedResult.rows[0].completed;

      const totalStopsResult = await client.query(
        `SELECT COUNT(*)::int AS total FROM stops WHERE route_id = $1`,
        [routeId]
      );
      const totalStops = totalStopsResult.rows[0].total;

      if (stopsCompleted < totalStops) {
        throw new Error(
          `Not all stops visited. You've checked in at ${stopsCompleted}/${totalStops} stops.`
        );
      }

      // 3. Get the last stop
      const lastStopResult = await client.query(
        `SELECT id, name, latitude, longitude, location
         FROM stops
         WHERE route_id = $1
         ORDER BY stop_order DESC
         LIMIT 1`,
        [routeId]
      );

      const lastStop = lastStopResult.rows[0];

      // 4. Calculate distance to last stop
      const distResult = await client.query(
        `SELECT ST_Distance(
           ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
           s.location::geography
         ) AS distance_meters
         FROM stops s
         WHERE s.id = $3`,
        [longitude, latitude, lastStop.id]
      );

      const distance = distResult.rows[0].distance_meters;

      // 5. Validate distance (5 km)
      if (distance > TRIP_PROXIMITY_RADIUS) {
        throw new Error(
          `Too far from the end point "${lastStop.name}". ` +
          `You are ${(distance / 1000).toFixed(1)} km away. ` +
          `You must be within ${TRIP_PROXIMITY_RADIUS / 1000} km to finish the trip.`
        );
      }

      // 6. Get route bonus points
      const routeResult = await client.query(
        `SELECT bonus_points FROM routes WHERE id = $1`,
        [routeId]
      );
      const bonusPoints = routeResult.rows[0].bonus_points;

      // 7. Get total stop points earned for this route
      const stopPointsResult = await client.query(
        `SELECT COALESCE(SUM(points_earned), 0)::int AS total_stop_points
         FROM checkins
         WHERE user_id = $1 AND route_id = $2`,
        [userId, routeId]
      );
      const stopPoints = stopPointsResult.rows[0].total_stop_points;

      // 8. Award bonus points to user
      await client.query(
        `UPDATE users SET total_points = total_points + $1, updated_at = NOW() WHERE id = $2`,
        [bonusPoints, userId]
      );

      // 9. Mark route as completed
      await client.query(
        `UPDATE user_route_progress
         SET is_completed = true,
             completed_at = NOW(),
             stops_completed = $3,
             end_location = ST_SetSRID(ST_MakePoint($4, $5), 4326)
         WHERE user_id = $1 AND route_id = $2`,
        [userId, routeId, totalStops, longitude, latitude]
      );

      // 10. Get updated user total
      const userResult = await client.query(
        `SELECT total_points FROM users WHERE id = $1`,
        [userId]
      );
      const totalPoints = userResult.rows[0].total_points;

      await client.query('COMMIT');

      return {
        success: true,
        pointsAwarded: stopPoints + bonusPoints,
        stopPoints,
        bonusPoints,
        totalPoints,
        message: `🏆 Trip complete! You earned ${stopPoints} stop pts + ${bonusPoints} bonus pts = ${stopPoints + bonusPoints} total!`,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export default new TripService();
