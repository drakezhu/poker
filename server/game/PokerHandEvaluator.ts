import { Card } from './Deck.js';

export enum HandRank {
  HIGH_CARD = 0,
  ONE_PAIR = 1,
  TWO_PAIR = 2,
  THREE_OF_A_KIND = 3,
  STRAIGHT = 4,
  FLUSH = 5,
  FULL_HOUSE = 6,
  FOUR_OF_A_KIND = 7,
  STRAIGHT_FLUSH = 8,
  ROYAL_FLUSH = 9
}

export interface HandResult {
  rank: HandRank;
  cards: Card[];
  highCards: number[];
}

export class PokerHandEvaluator {
  static evaluateHand(cards: Card[]): HandResult {
    const sortedCards = [...cards].sort((a, b) => b.value - a.value);
    
    const isFlush = this.isFlush(sortedCards);
    const isStraight = this.isStraight(sortedCards);
    const rankCounts = this.getRankCounts(sortedCards);
    const counts = Object.values(rankCounts).sort((a, b) => b - a);

    if (isFlush && isStraight && sortedCards[0].value === 14) {
      return { rank: HandRank.ROYAL_FLUSH, cards: sortedCards, highCards: [14] };
    }

    if (isFlush && isStraight) {
      const highCard = this.getStraightHighCard(sortedCards);
      return { rank: HandRank.STRAIGHT_FLUSH, cards: sortedCards, highCards: [highCard] };
    }

    if (counts[0] === 4) {
      const fourRank = Object.keys(rankCounts).find(r => rankCounts[parseInt(r)] === 4)!;
      const kicker = sortedCards.find(c => c.value !== parseInt(fourRank))!;
      return { rank: HandRank.FOUR_OF_A_KIND, cards: sortedCards, highCards: [parseInt(fourRank), kicker.value] };
    }

    if (counts[0] === 3 && counts[1] === 2) {
      const threeRank = Object.keys(rankCounts).find(r => rankCounts[parseInt(r)] === 3)!;
      const twoRank = Object.keys(rankCounts).find(r => rankCounts[parseInt(r)] === 2)!;
      return { rank: HandRank.FULL_HOUSE, cards: sortedCards, highCards: [parseInt(threeRank), parseInt(twoRank)] };
    }

    if (isFlush) {
      return { rank: HandRank.FLUSH, cards: sortedCards, highCards: sortedCards.slice(0, 5).map(c => c.value) };
    }

    if (isStraight) {
      const highCard = this.getStraightHighCard(sortedCards);
      return { rank: HandRank.STRAIGHT, cards: sortedCards, highCards: [highCard] };
    }

    if (counts[0] === 3) {
      const threeRank = Object.keys(rankCounts).find(r => rankCounts[parseInt(r)] === 3)!;
      const kickers = sortedCards.filter(c => c.value !== parseInt(threeRank)).slice(0, 2);
      return { rank: HandRank.THREE_OF_A_KIND, cards: sortedCards, highCards: [parseInt(threeRank), ...kickers.map(c => c.value)] };
    }

    if (counts[0] === 2 && counts[1] === 2) {
      const pairs = Object.keys(rankCounts)
        .filter(r => rankCounts[parseInt(r)] === 2)
        .map(r => parseInt(r))
        .sort((a, b) => b - a);
      const kicker = sortedCards.find(c => !pairs.includes(c.value))!;
      return { rank: HandRank.TWO_PAIR, cards: sortedCards, highCards: [...pairs, kicker.value] };
    }

    if (counts[0] === 2) {
      const pairRank = Object.keys(rankCounts).find(r => rankCounts[parseInt(r)] === 2)!;
      const kickers = sortedCards.filter(c => c.value !== parseInt(pairRank)).slice(0, 3);
      return { rank: HandRank.ONE_PAIR, cards: sortedCards, highCards: [parseInt(pairRank), ...kickers.map(c => c.value)] };
    }

    return { rank: HandRank.HIGH_CARD, cards: sortedCards, highCards: sortedCards.slice(0, 5).map(c => c.value) };
  }

  static compareHands(result1: HandResult, result2: HandResult, isShortDeck: boolean = false): number {
    if (result1.rank !== result2.rank) {
      if (isShortDeck) {
        const rank1 = this.getAdjustedRankForShortDeck(result1.rank);
        const rank2 = this.getAdjustedRankForShortDeck(result2.rank);
        return rank2 - rank1;
      }
      return result2.rank - result1.rank;
    }

    for (let i = 0; i < Math.max(result1.highCards.length, result2.highCards.length); i++) {
      const h1 = result1.highCards[i] || 0;
      const h2 = result2.highCards[i] || 0;
      if (h1 !== h2) {
        return h2 - h1;
      }
    }

    return 0;
  }

  private static getAdjustedRankForShortDeck(rank: HandRank): number {
    const adjusted: Record<HandRank, number> = {
      [HandRank.HIGH_CARD]: 0,
      [HandRank.ONE_PAIR]: 1,
      [HandRank.TWO_PAIR]: 2,
      [HandRank.THREE_OF_A_KIND]: 3,
      [HandRank.STRAIGHT]: 4,
      [HandRank.FULL_HOUSE]: 5,
      [HandRank.FLUSH]: 6,
      [HandRank.FOUR_OF_A_KIND]: 7,
      [HandRank.STRAIGHT_FLUSH]: 8,
      [HandRank.ROYAL_FLUSH]: 9
    };
    return adjusted[rank];
  }

  private static isFlush(cards: Card[]): boolean {
    if (cards.length < 5) return false;
    const suit = cards[0].suit;
    return cards.every(c => c.suit === suit);
  }

  private static getStraightHighCard(sortedCards: Card[]): number {
    const values = [...new Set(sortedCards.map(c => c.value))].sort((a, b) => b - a);
    
    for (let i = 0; i <= values.length - 5; i++) {
      let isConsecutive = true;
      for (let j = 0; j < 4; j++) {
        if (values[i + j] - values[i + j + 1] !== 1) {
          isConsecutive = false;
          break;
        }
      }
      if (isConsecutive) return values[i];
    }

    if (values.includes(14) && values.includes(2) && values.includes(3) && values.includes(4) && values.includes(5)) {
      return 5;
    }

    if (values.includes(14) && values.includes(6) && values.includes(7) && values.includes(8) && values.includes(9)) {
      return 9;
    }

    return sortedCards[0].value;
  }

  private static isStraight(cards: Card[]): boolean {
    if (cards.length < 5) return false;
    const values = [...new Set(cards.map(c => c.value))].sort((a, b) => b - a);
    
    for (let i = 0; i <= values.length - 5; i++) {
      let isConsecutive = true;
      for (let j = 0; j < 4; j++) {
        if (values[i + j] - values[i + j + 1] !== 1) {
          isConsecutive = false;
          break;
        }
      }
      if (isConsecutive) return true;
    }

    if (values.includes(14) && values.includes(2) && values.includes(3) && values.includes(4) && values.includes(5)) {
      return true;
    }

    if (values.includes(14) && values.includes(6) && values.includes(7) && values.includes(8) && values.includes(9)) {
      return true;
    }

    return false;
  }

  private static getRankCounts(cards: Card[]): Record<number, number> {
    const counts: Record<number, number> = {};
    for (const card of cards) {
      counts[card.value] = (counts[card.value] || 0) + 1;
    }
    return counts;
  }

  static getBestHand(holeCards: Card[], communityCards: Card[], isShortDeck: boolean = false): HandResult {
    const allCards = [...holeCards, ...communityCards];
    let bestResult: HandResult | null = null;

    const combinations = this.getCombinations(allCards, 5);
    for (const combo of combinations) {
      const result = this.evaluateHand(combo);
      if (!bestResult || this.compareHands(result, bestResult, isShortDeck) < 0) {
        bestResult = result;
      }
    }

    return bestResult!;
  }

  private static getCombinations<T>(arr: T[], size: number): T[][] {
    const result: T[][] = [];
    
    const combine = (start: number, combo: T[]) => {
      if (combo.length === size) {
        result.push([...combo]);
        return;
      }
      
      for (let i = start; i < arr.length; i++) {
        combo.push(arr[i]);
        combine(i + 1, combo);
        combo.pop();
      }
    };
    
    combine(0, []);
    return result;
  }
}
