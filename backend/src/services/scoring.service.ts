import { RARITY_POINTS } from '../types';

export class ScoringService {
  /**
   * Get points for a stop based on its rarity
   */
  getStopPoints(rarity: string): number {
    return RARITY_POINTS[rarity] || 10;
  }

  /**
   * Calculate bonus points for completing a route
   */
  getRouteBonusPoints(routeBonusPoints: number): number {
    return routeBonusPoints || 100;
  }
}

export default new ScoringService();
