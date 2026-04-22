import pool from '../config/database';
import scoringService from './scoring.service';
import { CheckinRequest, CheckinResponse } from '../types';

const CHECKIN_RADIUS = parseInt(process.env.CHECKIN_RADIUS_METERS || '100', 10);

export class CheckinService {
  /**
   * Process a check-in request with GPS validation via PostGIS
   */
  async processCheckin(userId: number, request: CheckinRequest): Promise<CheckinResponse> {
    const { stopId, latitude, longitude } = request;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Get the stop and its route
      const stopQuery = `
        SELECT s.*, r.bonus_points, r.id as r_id
        FROM stops s
        JOIN routes r ON r.id = s.route_id
        WHERE s.id = $1
      `;
      const stopResult = await client.query(stopQuery, [stopId]);

      if (stopResult.rows.length === 0) {
        throw new Error('Stop not found');
      }

      const stop = stopResult.rows[0];

      // 2. Check for duplicate check-in
      const dupCheck = await client.query(
        'SELECT id FROM checkins WHERE user_id = $1 AND stop_id = $2',
        [userId, stopId]
      );

      if (dupCheck.rows.length > 0) {
        throw new Error('You have already checked in at this stop');
      }

      // 3. Calculate distance using PostGIS (in meters, using geography cast for accuracy)
      const distanceQuery = `
        SELECT ST_Distance(
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          s.location::geography
        ) AS distance_meters
        FROM stops s
        WHERE s.id = $3
      `;
      const distResult = await client.query(distanceQuery, [longitude, latitude, stopId]);
      const distance = distResult.rows[0].distance_meters;

      // 4. Validate distance
      if (distance > CHECKIN_RADIUS) {
        throw new Error(
          `Too far from stop. You are ${Math.round(distance)}m away. ` +
          `Maximum distance is ${CHECKIN_RADIUS}m.`
        );
      }

      // 5. Use points from DB — keeps UI display consistent with what's actually awarded
      const pointsEarned = stop.points ?? scoringService.getStopPoints(stop.rarity);

      // 6. Create check-in record
      await client.query(
        `INSERT INTO checkins (user_id, stop_id, route_id, user_location, distance_m, points_earned)
         VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6, $7)`,
        [userId, stopId, stop.route_id, longitude, latitude, distance, pointsEarned]
      );

      // 7. Update user total points
      await client.query(
        'UPDATE users SET total_points = total_points + $1, updated_at = NOW() WHERE id = $2',
        [pointsEarned, userId]
      );

      // 8. Update or create route progress
      const totalStopsQuery = `
        SELECT COUNT(*)::int AS total FROM stops WHERE route_id = $1
      `;
      const totalStopsResult = await client.query(totalStopsQuery, [stop.route_id]);
      const totalStops = totalStopsResult.rows[0].total;

      const completedStopsQuery = `
        SELECT COUNT(*)::int AS completed
        FROM checkins
        WHERE user_id = $1 AND route_id = $2
      `;
      const completedResult = await client.query(completedStopsQuery, [userId, stop.route_id]);
      const stopsCompleted = completedResult.rows[0].completed;

      const isRouteCompleted = stopsCompleted >= totalStops;
      let bonusAwarded = false;

      // Check completion state BEFORE upserting so we know if this is a new completion
      const prevProgressResult = await client.query(
        'SELECT is_completed FROM user_route_progress WHERE user_id = $1 AND route_id = $2',
        [userId, stop.route_id]
      );
      const wasAlreadyCompleted = prevProgressResult.rows[0]?.is_completed ?? false;

      await client.query(
        `INSERT INTO user_route_progress (user_id, route_id, stops_completed, total_stops, is_completed, completed_at)
         VALUES ($1, $2, $3, $4, $5, CASE WHEN $5 THEN NOW() ELSE NULL END)
         ON CONFLICT (user_id, route_id)
         DO UPDATE SET
           stops_completed = $3,
           is_completed = $5,
           completed_at = CASE WHEN $5 AND NOT user_route_progress.is_completed THEN NOW() ELSE user_route_progress.completed_at END`,
        [userId, stop.route_id, stopsCompleted, totalStops, isRouteCompleted]
      );

      // 9. Award route completion bonus only on first completion
      if (isRouteCompleted && !wasAlreadyCompleted) {
        const bonusPoints = scoringService.getRouteBonusPoints(stop.bonus_points);
        await client.query(
          'UPDATE users SET total_points = total_points + $1 WHERE id = $2',
          [bonusPoints, userId]
        );
        bonusAwarded = true;
      }

      // 10. Get updated user total
      const userResult = await client.query('SELECT total_points FROM users WHERE id = $1', [userId]);
      const totalPoints = userResult.rows[0].total_points;

      await client.query('COMMIT');

      const totalPointsEarned = pointsEarned + (bonusAwarded ? stop.bonus_points : 0);

      return {
        success: true,
        pointsEarned: totalPointsEarned,
        totalPoints,
        distance: Math.round(distance * 10) / 10,
        routeCompleted: isRouteCompleted,
        message: isRouteCompleted
          ? `Check-in successful! +${pointsEarned} pts. Route completed! +${stop.bonus_points} bonus pts!`
          : `Check-in successful! +${pointsEarned} pts. (${stopsCompleted}/${totalStops} stops)`,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export default new CheckinService();
