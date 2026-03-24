<template>
  <div class="game-container">
    <!-- Toast 提示 -->
    <div v-if="showToast" class="toast" :class="toastType">
      {{ toastMessage }}
    </div>
    <div class="game-header">
      <div class="header-card">
        <div class="header-content">
          <div class="room-info">
            <div class="room-id-section">
              <span class="tag tag-info tag-large">房间: {{ roomId }}</span>
              <button
                class="btn btn-quaternary btn-circle btn-small"
                @click="copyRoomId"
                title="复制房间号"
              >
                <span class="btn-icon">📋</span>
              </button>
            </div>
            <span v-if="roomState?.config.isShortDeck" class="tag tag-error tag-small">短牌模式</span>
            <span v-else class="tag tag-info tag-small">标准德州</span>
            <span v-if="gameInProgress" class="tag tag-success">游戏进行中</span>
            <span v-else class="tag tag-warning">等待玩家...</span>
          </div>
          <div class="header-actions">
            <button class="btn btn-quaternary btn-circle" @click="showRulesModal = true">
              <span class="btn-icon">❓</span>
            </button>
            <button class="btn btn-error btn-quaternary" @click="leaveRoom">离开房间</button>
          </div>
        </div>
      </div>
    </div>

    <div class="game-main">
      <div class="game-table">
        <div class="opponent-area">
          <div class="player-card" :class="{ active: opponentPlayer?.isActive }">
            <div class="player-info">
              <div class="player-name">{{ opponentPlayer?.name || '等待玩家...' }}</div>
              <div class="player-chips">
                <span class="chip-icon">💰</span>
                {{ opponentPlayer?.chips || 0 }}
              </div>
            </div>
            <div class="player-cards">
              <Card
                v-for="(card, index) in opponentCards"
                :key="index"
                :card="card"
                :hidden="!showOpponentCards"
              />
            </div>
            <div v-if="opponentPlayer?.bet > 0" class="player-bet">
              <ChipStack :amount="opponentPlayer.bet" />
            </div>
            <div v-if="showOpponentCards && opponentPlayer?.handResult" class="player-hand">
              {{ getHandName(opponentPlayer.handResult) }}
            </div>
          </div>
        </div>

        <div class="table-center">
          <div class="pot-area">
            <div class="pot-label">底池</div>
            <ChipStack :amount="roomState?.pot || 0" />
          </div>

          <div class="community-cards">
            <Card
              v-for="(card, index) in communityCards"
              :key="index"
              :card="card"
            />
          </div>

          <div v-if="lastAction" class="last-action" :class="lastActionType">
            {{ lastAction }}
          </div>
        </div>



        <div class="my-area">
          <div class="player-card" :class="{ active: currentPlayer?.isActive }">
            <div class="player-cards">
              <Card
                v-for="(card, index) in myCards"
                :key="index"
                :card="card"
              />
            </div>
            <div v-if="currentPlayer?.bet > 0" class="player-bet">
              <ChipStack :amount="currentPlayer.bet" />
            </div>
            <div v-if="showOpponentCards && currentPlayer?.handResult" class="player-hand">
              {{ getHandName(currentPlayer.handResult) }}
            </div>
            <div class="player-info">
              <div class="player-name">{{ currentPlayer?.name || '我' }}</div>
              <div class="player-chips">
                <span class="chip-icon">💰</span>
                {{ currentPlayer?.chips || 0 }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="sidebar">
        <ActionHistory />
      </div>
    </div>

    <div class="action-area">
          <ActionButtons :disabled="!gameInProgress" />
          <div v-if="!gameInProgress && roomState?.players.length === 2" class="ready-container">
            <button class="btn btn-primary btn-large" @click="toggleReady">
              {{ isPlayerReady ? '取消准备' : '准备开始新游戏' }}
            </button>
          </div>
        </div>

    <HandRankingModal
      v-model:show="showRulesModal"
      :is-short-deck="roomState?.config.isShortDeck || false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore';
import { useWebSocket } from '../composables/useWebSocket';

import Card from '../components/Card.vue';
import ActionButtons from '../components/ActionButtons.vue';
import ChipStack from '../components/ChipStack.vue';
import ActionHistory from '../components/ActionHistory.vue';
import HandRankingModal from '../components/HandRankingModal.vue';

const router = useRouter();
const store = useGameStore();
const { joinRoom, toggleReady } = useWebSocket();

const showRulesModal = ref(false);
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success'); // success, error

function showToastMessage(message: string, type: 'success' | 'error' = 'success') {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
}

onMounted(() => {
  if (!store.roomId || !store.playerName) {
    router.push('/');
    return;
  }
  
  console.log('🎮 GameView 已挂载，房间信息:', { roomId: store.roomId, playerName: store.playerName });
  joinRoom(store.roomId, store.playerName);
});

// 移除 alert 对话框，改为在界面上显示消息
watch(() => store.errorMessage, (msg) => {
  if (msg) {
    // 消息会在界面上显示，不需要弹出对话框
    setTimeout(() => {
      store.clearMessages();
    }, 3000);
  }
});

watch(() => store.successMessage, (msg) => {
  if (msg) {
    // 消息会在界面上显示，不需要弹出对话框
    setTimeout(() => {
      store.clearMessages();
    }, 3000);
  }
});

const roomId = computed(() => store.roomId);
const roomState = computed(() => store.roomState);
const currentPlayer = computed(() => store.currentPlayer);
const opponentPlayer = computed(() => store.opponentPlayer);
const isMyTurn = computed(() => store.isMyTurn);
const gameInProgress = computed(() => store.roomState?.gameInProgress || false);
const communityCards = computed(() => store.roomState?.communityCards || []);
const myCards = computed(() => currentPlayer.value?.holeCards || []);
const opponentCards = computed(() => {
  if (store.roomState?.stage === 'showdown') {
    return opponentPlayer.value?.holeCards || [];
  }
  return [null, null];
});
const showOpponentCards = computed(() => store.roomState?.stage === 'showdown');
const lastAction = computed(() => store.roomState?.lastAction);
const lastActionType = computed(() => {
  if (!lastAction.value?.includes('赢得')) return 'success';
  if (lastAction.value?.includes('弃牌')) return 'warning';
  return 'info';
});

const isPlayerReady = computed(() => {
  if (!currentPlayer.value) return false;
  return currentPlayer.value.isReady || false;
});

async function copyRoomId() {
  try {
    await navigator.clipboard.writeText(roomId.value);
    showToastMessage('已复制房间号', 'success');
  } catch (error) {
    console.error('❌ 复制失败:', error);
    showToastMessage('复制失败', 'error');
  }
}

function leaveRoom() {
  store.reset();
  router.push('/');
}

function getHandName(handResult: any): string {
  if (!handResult) return '';
  const handNames: Record<number, string> = {
    9: '皇家同花顺',
    8: '同花顺',
    7: '四条',
    6: '葫芦',
    5: '同花',
    4: '顺子',
    3: '三条',
    2: '两对',
    1: '一对',
    0: '高牌'
  };
  return handNames[handResult.rank] || '高牌';
}
</script>

<style scoped>
.game-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0d4f21 0%, #1b5e20 50%, #2e7d32 100%);
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 20px;
}

.game-header {
  flex-shrink: 0;
}

.header-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-info {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.room-id-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.tag {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  display: inline-block;
}

.tag-large {
  font-size: 16px;
  padding: 6px 16px;
}

.tag-small {
  font-size: 12px;
  padding: 2px 8px;
}

.tag-info {
  background: #e3f2fd;
  color: #1976d2;
}

.tag-error {
  background: #ffebee;
  color: #d32f2f;
}

.tag-success {
  background: #e8f5e8;
  color: #388e3c;
}

.tag-warning {
  background: #fff3e0;
  color: #f57c00;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-circle {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 50%;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-quaternary {
  background: transparent;
  color: #757575;
  border: 1px solid #e0e0e0;
}

.btn-quaternary:hover {
  background: #f5f5f5;
}

.btn-error {
  background: #f44336;
  color: white;
}

.btn-error:hover {
  background: #d32f2f;
}

.btn-icon {
  font-size: 16px;
}

.game-main {
  flex: 1;
  display: flex;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.game-table {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 900px;
  width: 100%;
  position: relative;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.opponent-area,
.my-area {
  flex-shrink: 0;
}

.player-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.player-card.active {
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
  border: 2px solid #ffd700;
}

.player-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.player-name {
  font-size: 18px;
  font-weight: bold;
}

.player-chips {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  color: #ff9800;
  font-weight: bold;
}

.chip-icon {
  font-size: 18px;
}

.player-cards {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin: 16px 0;
}

.player-bet {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}

.player-hand {
  display: flex;
  justify-content: center;
  margin-top: 8px;
  font-size: 14px;
  font-weight: bold;
  color: #1976d2;
  background: #e3f2fd;
  padding: 4px 12px;
  border-radius: 16px;
  display: inline-block;
  margin: 8px auto 0;
  text-align: center;
}

.table-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 30px;
}

.pot-area {
  text-align: center;
}

.pot-label {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.community-cards {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.last-action {
  max-width: 400px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.last-action.success {
  background: #e8f5e8;
  color: #388e3c;
}

.last-action.warning {
  background: #fff3e0;
  color: #f57c00;
}

.last-action.info {
  background: #e3f2fd;
  color: #1976d2;
}

.timer-area {
  position: absolute;
  top: 50%;
  right: 40px;
  transform: translateY(-50%);
}

.circle-progress {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: conic-gradient(var(--color) calc(var(--percentage) * 1%), #e0e0e0 calc(var(--percentage) * 1%));
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.circle-progress::before {
  content: '';
  position: absolute;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: white;
}

.timer-text {
  font-size: 24px;
  font-weight: bold;
  color: #52c41a;
  z-index: 1;
}

.timer-text.urgent {
  color: #faad14;
}

.timer-text.critical {
  color: #ff4d4f;
  animation: pulse 0.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.action-area {
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.3);
  padding: 20px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.ready-container {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.btn-large {
  padding: 16px 32px;
  font-size: 18px;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.btn-large:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

/* Toast 提示样式 */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 24px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideInRight 0.3s ease-out, fadeOut 0.3s ease-in 2.7s;
}

.toast.success {
  background: #52c41a;
}

.toast.error {
  background: #f44336;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
