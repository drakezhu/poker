export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
}

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const STANDARD_RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SHORT_DECK_RANKS: Rank[] = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export class Deck {
  private cards: Card[] = [];
  private isShortDeck: boolean;

  constructor(isShortDeck: boolean = false) {
    this.isShortDeck = isShortDeck;
    this.initializeDeck();
    this.shuffle();
  }

  private initializeDeck() {
    this.cards = [];
    const ranks = this.isShortDeck ? SHORT_DECK_RANKS : STANDARD_RANKS;
    
    for (const suit of SUITS) {
      for (let i = 0; i < ranks.length; i++) {
        let value: number;
        if (this.isShortDeck) {
          value = i + 6;
        } else {
          value = i + 2;
        }
        this.cards.push({
          suit,
          rank: ranks[i],
          value
        });
      }
    }
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal(): Card {
    const card = this.cards.pop();
    if (!card) throw new Error('Deck is empty');
    return card;
  }
}
