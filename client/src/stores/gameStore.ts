import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { RoomState, Player } from '../types';

export const useGameStore = defineStore('game', () => {
  const roomState = ref<RoomState | null>(null);
  const playerId = ref<string>('');
  const playerName = ref<string>('');
  const roomId = ref<string>('');
  const isConnected = ref(false);
  const errorMessage = ref<string>('');
  const successMessage = ref<string>('');

  const currentPlayer = computed<Player | null>(() => {
    if (!roomState.value) return null;
    return roomState.value.players.find(p => p.id === playerId.value) || null;
  });

  const opponentPlayer = computed<Player | null>(() => {
    if (!roomState.value) return null;
    return roomState.value.players.find(p => p.id !== playerId.value) || null;
  });

  const isMyTurn = computed(() => {
    if (!roomState.value || !currentPlayer.value) return false;
    return currentPlayer.value.isActive;
  });

  const callAmount = computed(() => {
    if (!roomState.value || !currentPlayer.value) return 0;
    return roomState.value.currentBet - currentPlayer.value.bet;
  });

  const minRaise = computed(() => {
    if (!roomState.value) return 20;
    return Math.max(20, roomState.value.currentBet);
  });

  const canRaise = computed(() => {
    if (!currentPlayer.value) return false;
    return currentPlayer.value.chips > callAmount.value;
  });

  function setRoomState(state: RoomState) {
    roomState.value = state;
  }

  function setPlayerInfo(id: string, name: string, room: string) {
    playerId.value = id;
    playerName.value = name;
    roomId.value = room;
  }

  function setConnected(connected: boolean) {
    isConnected.value = connected;
  }

  function setError(message: string) {
    errorMessage.value = message;
    successMessage.value = '';
  }

  function setSuccess(message: string) {
    successMessage.value = message;
    errorMessage.value = '';
  }

  function clearMessages() {
    errorMessage.value = '';
    successMessage.value = '';
  }

  function reset() {
    roomState.value = null;
    playerId.value = '';
    playerName.value = '';
    roomId.value = '';
    isConnected.value = false;
    clearMessages();
  }

  return {
    roomState,
    playerId,
    playerName,
    roomId,
    isConnected,
    errorMessage,
    successMessage,
    currentPlayer,
    opponentPlayer,
    isMyTurn,
    callAmount,
    minRaise,
    canRaise,
    setRoomState,
    setPlayerInfo,
    setConnected,
    setError,
    setSuccess,
    clearMessages,
    reset
  };
});
