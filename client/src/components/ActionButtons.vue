<template>
  <div class="action-buttons">
    <div v-if="!gameInProgress" class="waiting-message">
      {{ waitingMessage }}
    </div>
    <div v-else-if="isMyTurn" class="buttons-container">
      <button
        class="btn btn-error"
        @click="handleFold"
        :disabled="disabled"
      >
        弃牌 (Fold)
      </button>
      <button
        class="btn btn-warning"
        @click="handleCall"
        :disabled="disabled"
      >
        {{ callAmount === 0 ? '过牌 (Check)' : `跟注 ${callAmount} (Call)` }}
      </button>
      <button
        class="btn btn-info"
        @click="handleAllIn"
        :disabled="disabled"
      >
        All-in
      </button>
      <div class="raise-container">
        <input
          type="number"
          v-model.number="raiseAmount"
          :min="minRaise"
          :max="maxRaise"
          class="input input-large"
          style="width: 150px"
        />
        <button
          class="btn btn-primary"
          @click="handleRaise"
          :disabled="disabled || !canRaise"
        >
          加注 (Raise)
        </button>
      </div>
    </div>
    <div v-else class="waiting-message">
      等待对手行动...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGameStore } from '../stores/gameStore';
import { useWebSocket } from '../composables/useWebSocket';

interface Props {
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
});

const store = useGameStore();
const { sendAction } = useWebSocket();

const raiseAmount = ref(0);

const gameInProgress = computed(() => store.roomState?.gameInProgress || false);
const isMyTurn = computed(() => store.isMyTurn);
const callAmount = computed(() => store.callAmount);
const minRaise = computed(() => store.minRaise);
const currentPlayer = computed(() => store.currentPlayer);
const lastAction = computed(() => store.roomState?.lastAction);

const waitingMessage = computed(() => {
  if (!store.roomState) return '等待游戏开始...';
  if (store.roomState.players.length < 2) return '等待另一位玩家加入...';
  if (lastAction.value) return lastAction.value;
  return '等待游戏开始...';
});

const maxRaise = computed(() => {
  if (!currentPlayer.value) return 0;
  return currentPlayer.value.chips + currentPlayer.value.bet;
});

const canRaise = computed(() => store.canRaise);

function handleFold() {
  sendAction('fold');
}

function handleCall() {
  sendAction('call');
}

function handleRaise() {
  if (raiseAmount.value >= minRaise.value) {
    sendAction('raise', raiseAmount.value);
  }
}

function handleAllIn() {
  sendAction('allin');
}
</script>

<style scoped>
.action-buttons {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.buttons-container {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
}

.raise-container {
  display: flex;
  gap: 8px;
  align-items: center;
}

.waiting-message {
  font-size: 18px;
  color: #909399;
  padding: 20px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-error {
  background: #f44336;
  color: white;
}

.btn-error:hover {
  background: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
}

.btn-warning {
  background: #ff9800;
  color: white;
}

.btn-warning:hover {
  background: #f57c00;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
}

.btn-info {
  background: #2196f3;
  color: white;
}

.btn-info:hover {
  background: #1976d2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.btn-primary {
  background: #4caf50;
  color: white;
}

.btn-primary:hover {
  background: #43a047;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.btn:disabled {
  background: #9e9e9e;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.input {
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.input:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.input-large {
  padding: 16px;
  font-size: 16px;
}
</style>
