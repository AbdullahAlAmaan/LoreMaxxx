class ScoringService {
  getStopPoints(rarity: string): number {
    switch (rarity?.toLowerCase()) {
      case 'legendary': return 100;
      case 'rare':      return 50;
      case 'uncommon':  return 25;
      case 'common':
      default:          return 10;
    }
  }

  getRouteBonusPoints(baseBonus: number): number {
    return baseBonus || 100;
  }
}

export default new ScoringService();
