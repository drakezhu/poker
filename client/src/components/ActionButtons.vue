<template>
  <div class="action-buttons">
    <div v-if="!gameInProgress" class="waiting-message">
      {{ waitingMessage }}
    </div>
    <div v-else-if="isMyTurn" class="buttons-container">
      <n-button
        type="error"
        size="large"
        @click="handleFold"
        :disabled="disabled"
      >
        弃牌 (Fold)
      </n-button>
      <n-button
        type="warning"
        size="large"
        @click="handleCall"
        :disabled="disabled"
      >
        跟注 {{ callAmount }} (Call)
      </n-button>
      <n-button
        type="info"
        size="large"
        @click="handleAllIn"
        :disabled="disabled"
      >
        All-in
      </n-button>
      <div class="raise-container">
        <n-input-number
          v-model:value="raiseAmount"
          :min="minRaise"
          :max="maxRaise"
          size="large"
          style="width: 150px"
        />
        <n-button
          type="primary"
          size="large"
          @click="handleRaise"
          :disabled="disabled || !canRaise"
        >
          加注 (Raise)
        </n-button>
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
</style>
