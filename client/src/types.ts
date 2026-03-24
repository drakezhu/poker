export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
}

export type GameStage = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
export type PlayerAction = 'fold' | 'call' | 'raise' | 'allin';
export type PlayerStatus = 'waiting' | 'active' | 'folded' | 'allin';

export interface ActionHistoryItem {
  playerId: string;
  playerName: string;
  action: PlayerAction;
  amount?: number;
  stage: GameStage;
  timestamp: number;
}

export interface Player {
  id: string;
  name: string;
  chips: number;
  holeCards: Card[];
  status: PlayerStatus;
  bet: number;
  isActive: boolean;
  handResult: any;
}

export interface RoomConfig {
  isShortDeck: boolean;
  smallBlind: number;
  bigBlind: number;
  totalChips: number;
}

export interface RoomState {
  roomId: string;
  config: RoomConfig;
  players: Player[];
  communityCards: Card[];
  pot: number;
  currentBet: number;
  currentPlayerIndex: number;
  stage: GameStage;
  dealerIndex: number;
  gameInProgress: boolean;
  lastAction: string | null;
  actionHistory: ActionHistoryItem[];
}

export interface WebSocketMessage {
  type: 'state' | 'error' | 'success';
  state?: RoomState;
  message?: string;
}

export interface CreateRoomRequest {
  isShortDeck: boolean;
  smallBlind: number;
  bigBlind: number;
  totalChips: number;
}

export interface CreateRoomResponse {
  roomId: string;
  config: RoomConfig;
}
