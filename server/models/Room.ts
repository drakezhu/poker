import { Card, Deck } from '../game/Deck.js';
import { PokerHandEvaluator, HandResult } from '../game/PokerHandEvaluator.js';

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
  isReady: boolean;
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

export class Room {
  public state: RoomState;
  private deck: Deck | null = null;
  private timer: NodeJS.Timeout | null = null;
  public onStateChange: ((state: RoomState) => void) | null = null;
  public onPlayerTimeout: ((playerId: string) => void) | null = null;
  
  // 严格规则所需的变量
  private lastAggressorIndex: number | null = null;
  private potIsOpen: boolean = true; // 是否还有效（最后一次是 Raise 的话为 true）
  private actionsThisRound: number = 0; // 本轮主动操作次数
  private roundStartPlayerIndex: number | null = null; // 本轮开始的玩家索引
  private playersActedThisRound: Set<number> = new Set(); // 记录本轮已经行动过的玩家索引

  constructor(roomId: string, config: RoomConfig) {
    this.state = {
      roomId,
      config,
      players: [],
      communityCards: [],
      pot: 0,
      currentBet: 0,
      currentPlayerIndex: 0,
      stage: 'preflop',
      dealerIndex: 0,
      gameInProgress: false,
      lastAction: null,
      actionHistory: []
    };
  }

  addPlayer(playerId: string, name: string): boolean {
    if (this.state.players.length >= 2) return false;
    
    this.state.players.push({
      id: playerId,
      name,
      chips: this.state.config.totalChips,
      holeCards: [],
      status: 'waiting',
      bet: 0,
      isActive: false,
      handResult: null,
      isReady: false
    });

    this.notifyStateChange();
    
    if (this.state.players.length === 2) {
      this.startGame();
    }
    
    return true;
  }

  removePlayer(playerId: string) {
    this.state.players = this.state.players.filter(p => p.id !== playerId);
    this.state.gameInProgress = false;
    this.clearTimer();
    this.notifyStateChange();
  }

  private startGame() {
    console.log('🎮 开始新游戏！');
    this.deck = new Deck(this.state.config.isShortDeck);
    this.state.communityCards = [];
    this.state.pot = 0;
    this.state.currentBet = 0;
    this.state.stage = 'preflop';
    this.state.gameInProgress = true;
    this.state.lastAction = '游戏开始！';
    this.state.actionHistory = []; // 重置操作历史
    
    // 初始化新变量
    this.lastAggressorIndex = null;
    this.potIsOpen = true;
    this.actionsThisRound = 0;
    this.playersActedThisRound = new Set();

    for (const player of this.state.players) {
      player.holeCards = [this.deck.deal(), this.deck.deal()];
      player.status = 'active';
      player.bet = 0;
      player.isActive = false;
      player.handResult = null;
      player.isReady = false; // 重置准备状态
      console.log(`🎴 玩家 ${player.name} 底牌:`, player.holeCards);
    }

    this.postBlinds();
    this.state.currentPlayerIndex = (this.state.dealerIndex + 2) % 2;
    this.roundStartPlayerIndex = this.state.currentPlayerIndex; // 记录谁是本轮第一个行动的
    this.state.players[this.state.currentPlayerIndex].isActive = true;
    
    console.log(`⏰ 当前玩家: ${this.state.players[this.state.currentPlayerIndex].name}`);
    
    this.startTimer();
    this.notifyStateChange();
  }

  private postBlinds() {
    const sbIndex = (this.state.dealerIndex + 1) % 2;
    const bbIndex = (this.state.dealerIndex + 2) % 2;
    
    const sb = Math.min(this.state.config.smallBlind, this.state.players[sbIndex].chips);
    const bb = Math.min(this.state.config.bigBlind, this.state.players[bbIndex].chips);
    
    this.placeBet(sbIndex, sb);
    this.placeBet(bbIndex, bb);
    
    this.state.currentBet = bb;
    this.lastAggressorIndex = bbIndex;
    this.potIsOpen = true; // Pre-flop 从 BB 开始，所以 Pot 是打开的
    this.actionsThisRound = 2; // SB 和 BB 算两次主动操作
  }

  private placeBet(playerIndex: number, amount: number) {
    const player = this.state.players[playerIndex];
    const actualAmount = Math.min(amount, player.chips);
    
    player.chips -= actualAmount;
    player.bet += actualAmount;
    this.state.pot += actualAmount;
    
    if (player.chips === 0) {
      player.status = 'allin';
    }
  }

  playerAction(playerId: string, action: PlayerAction, raiseAmount: number = 0): boolean {
    const playerIndex = this.state.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1 || playerIndex !== this.state.currentPlayerIndex) return false;
    if (!this.state.gameInProgress) return false;

    this.clearTimer();
    const player = this.state.players[playerIndex];
    this.actionsThisRound++; // 记录本次是一个主动操作！
    this.playersActedThisRound.add(playerIndex); // 记录这个玩家已经行动过了！

    let actionAmount: number | undefined;
    switch (action) {
      case 'fold':
        player.status = 'folded';
        this.state.lastAction = `${player.name} 弃牌`;
        break;

      case 'call':
        const callAmount = this.state.currentBet - player.bet;
        if (callAmount > 0) {
          this.placeBet(playerIndex, callAmount);
        }
        // Call 不算 Raising
        this.potIsOpen = false;
        this.state.lastAction = `${player.name} 跟注 ${callAmount}`;
        actionAmount = callAmount;
        break;

      case 'raise':
        const totalBet = this.state.currentBet + raiseAmount;
        const raiseTotal = totalBet - player.bet;
        this.placeBet(playerIndex, raiseTotal);
        this.state.currentBet = totalBet;
        this.lastAggressorIndex = playerIndex;
        this.potIsOpen = true; // Raise —— Pot 现在打开！
        this.state.lastAction = `${player.name} 加注 ${raiseAmount}`;
        actionAmount = raiseAmount;
        break;

      case 'allin':
        const allInAmount = player.chips + player.bet;
        if (allInAmount > this.state.currentBet) {
          this.state.currentBet = allInAmount;
          this.lastAggressorIndex = playerIndex;
          this.potIsOpen = true; // All-in 超过当前下注，算 Raise
        } else {
          this.potIsOpen = false; // All-in 没有超过，不算
        }
        this.placeBet(playerIndex, player.chips);
        this.state.lastAction = `${player.name} All-in!`;
        actionAmount = player.chips;
        break;
    }

    // 记录操作历史
    this.state.actionHistory.push({
      playerId: player.id,
      playerName: player.name,
      action,
      amount: actionAmount,
      stage: this.state.stage,
      timestamp: Date.now()
    });

    this.nextTurn();
    return true;
  }

  private nextTurn() {
    const activePlayers = this.state.players.filter(p => p.status === 'active' || p.status === 'allin');
    const foldedPlayers = this.state.players.filter(p => p.status === 'folded');

    console.log('🔄 nextTurn:', {
      currentPlayerIndex: this.state.currentPlayerIndex,
      lastAggressorIndex: this.lastAggressorIndex,
      potIsOpen: this.potIsOpen,
      actionsThisRound: this.actionsThisRound,
      playersActedThisRound: Array.from(this.playersActedThisRound),
      currentBet: this.state.currentBet,
      players: this.state.players.map(p => ({ name: p.name, bet: p.bet, status: p.status }))
    });

    // 规则补充说明：若仅剩一名存活玩家，立即结束！
    if (foldedPlayers.length === 1) {
      console.log('   🏆 仅剩一名存活玩家，结束游戏！');
      this.endHand(activePlayers[0].id);
      return;
    }

    // 规则条件1：所有尚未弃牌的玩家在本轮中已投入相等的筹码金额
    const allBetSame = activePlayers.every(p => 
      p.bet === this.state.currentBet || p.status === 'allin'
    );

    // 规则条件2：本轮中最后一次有效行动不是“加注（Raise）”——即 potIsOpen 为 false！
    const lastActionNotRaise = !this.potIsOpen;

    // 规则条件3：至少有一名玩家在本轮中执行了主动操作
    const atLeastOneAction = this.actionsThisRound >= 1;

    // 关键新条件：如果 potIsOpen 是 false（最后一次不是 Raise），必须所有活跃玩家都行动过！
    // 获取活跃玩家的索引
    const activePlayerIndices: number[] = [];
    for (let i = 0; i < this.state.players.length; i++) {
      const p = this.state.players[i];
      if (p.status === 'active' || p.status === 'allin') {
        activePlayerIndices.push(i);
      }
    }
    const allActivePlayersActed = activePlayerIndices.every(index => 
      this.playersActedThisRound.has(index)
    );
    
    // 如果没有人加注（potIsOpen=false），必须所有活跃玩家都行动过！
    const allActivePlayersActedIfNoRaise = this.potIsOpen || allActivePlayersActed;

    const allAllIn = activePlayers.every(p => p.status === 'allin');

    console.log('   📋 严格规则判断:', {
      allBetSame,
      lastActionNotRaise,
      atLeastOneAction,
      allActivePlayersActed,
      allActivePlayersActedIfNoRaise,
      allAllIn
    });

    const shouldAdvanceToNextStage = (allBetSame && lastActionNotRaise && atLeastOneAction && allActivePlayersActedIfNoRaise) || allAllIn;

    if (shouldAdvanceToNextStage) {
      console.log('   ✅ 满足所有条件，进入下一阶段');
      this.nextStage();
    } else {
      console.log('   ⏭️  不满足条件，继续下一玩家');
      do {
        this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % 2;
      } while (this.state.players[this.state.currentPlayerIndex].status === 'folded');

      this.state.players.forEach(p => p.isActive = false);
      this.state.players[this.state.currentPlayerIndex].isActive = true;
      this.startTimer();
    }

    this.notifyStateChange();
  }

  private nextStage() {
    switch (this.state.stage) {
      case 'preflop':
        this.state.stage = 'flop';
        for (let i = 0; i < 3; i++) {
          this.state.communityCards.push(this.deck!.deal());
        }
        break;

      case 'flop':
        this.state.stage = 'turn';
        this.state.communityCards.push(this.deck!.deal());
        break;

      case 'turn':
        this.state.stage = 'river';
        this.state.communityCards.push(this.deck!.deal());
        break;

      case 'river':
        this.showdown();
        return;
    }

    console.log('📊 进入新阶段:', this.state.stage);
    
    // 重置新一轮的变量
    this.state.players.forEach(p => p.bet = 0);
    this.state.currentBet = 0;
    this.lastAggressorIndex = null;
    this.potIsOpen = false; // 新一轮开始时，Pot 是关闭的（Check 开始）
    this.actionsThisRound = 0; // 新一轮，重置操作计数
    this.playersActedThisRound = new Set(); // 重置已行动玩家记录
    
    this.state.currentPlayerIndex = (this.state.dealerIndex + 1) % 2;
    while (this.state.players[this.state.currentPlayerIndex].status === 'folded') {
      this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % 2;
    }
    
    this.roundStartPlayerIndex = this.state.currentPlayerIndex;
    this.lastAggressorIndex = this.state.currentPlayerIndex;

    this.state.players.forEach(p => p.isActive = false);
    this.state.players[this.state.currentPlayerIndex].isActive = true;
    this.startTimer();
  }

  private showdown() {
    this.state.stage = 'showdown';
    
    for (const player of this.state.players) {
      if (player.status !== 'folded') {
        player.handResult = PokerHandEvaluator.getBestHand(player.holeCards, this.state.communityCards, this.state.config.isShortDeck);
      }
    }

    const activePlayers = this.state.players.filter(p => p.status !== 'folded' && p.handResult);
    activePlayers.sort((a, b) => PokerHandEvaluator.compareHands(a.handResult!, b.handResult!, this.state.config.isShortDeck));

    this.endHand(activePlayers[0].id);
  }

  private endHand(winnerId: string) {
    console.log('🏆 一局结束！');
    this.clearTimer();
    const winner = this.state.players.find(p => p.id === winnerId)!;
    winner.chips += this.state.pot;
    this.state.gameInProgress = false;
    this.state.lastAction = `${winner.name} 赢得了 ${this.state.pot} 筹码! 点击准备按钮开始新游戏`;
    
    this.state.dealerIndex = (this.state.dealerIndex + 1) % 2;
    
    // 重置所有玩家的准备状态
    for (const player of this.state.players) {
      player.isReady = false;
    }
    
    console.log(`💰 ${winner.name} 赢得了 ${this.state.pot} 筹码！`);
    
    this.notifyStateChange();
  }

  private startTimer() {
    this.clearTimer();
    // TODO: 暂时禁用超时功能，让玩家可以慢慢测试
    console.log('⏱️  计时器已启动（暂时禁用自动超时）');
    // this.timer = setTimeout(() => {
    //   if (this.onPlayerTimeout) {
    //     this.onPlayerTimeout(this.state.players[this.state.currentPlayerIndex].id);
    //   }
    // }, 30000);
  }

  private clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  getPublicState(): RoomState {
    const state = JSON.parse(JSON.stringify(this.state));
    for (const player of state.players) {
      if (this.state.stage !== 'showdown') {
        player.holeCards = [];
      }
    }
    return state;
  }

  getPlayerState(playerId: string): RoomState {
    const state = JSON.parse(JSON.stringify(this.state));
    for (const player of state.players) {
      if (player.id !== playerId && this.state.stage !== 'showdown') {
        player.holeCards = [];
      }
    }
    return state;
  }

  togglePlayerReady(playerId: string): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (player) {
      player.isReady = !player.isReady;
      console.log(`🎮 玩家 ${player.name} 准备状态: ${player.isReady ? '就绪' : '未就绪'}`);
      
      // 检查是否所有玩家都已准备就绪
      const allReady = this.state.players.every(p => p.isReady);
      if (allReady && this.state.players.length === 2) {
        console.log('✅ 所有玩家都已准备就绪，开始新游戏！');
        this.startGame();
      } else {
        this.notifyStateChange();
      }
    }
  }
}
