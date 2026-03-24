<template>
  <div class="game-container">
    <div class="game-header">
      <n-card class="header-card">
        <div class="header-content">
          <div class="room-info">
            <div class="room-id-section">
              <n-tag type="info" size="large">房间: {{ roomId }}</n-tag>
              <n-button
                quaternary
                circle
                size="small"
                @click="copyRoomId"
                :title="'复制房间号'"
              >
                <template #icon>
                  <n-icon><CopyOutline /></n-icon>
                </template>
              </n-button>
            </div>
            <n-tag v-if="roomState?.config.isShortDeck" type="error" size="small">短牌模式</n-tag>
            <n-tag v-else type="info" size="small">标准德州</n-tag>
            <n-tag v-if="gameInProgress" type="success">游戏进行中</n-tag>
            <n-tag v-else type="warning">等待玩家...</n-tag>
          </div>
          <div class="header-actions">
            <n-button quaternary circle @click="showRulesModal = true">
              <template #icon>
                <n-icon><HelpCircleOutline /></n-icon>
              </template>
            </n-button>
            <n-button type="error" quaternary @click="leaveRoom">离开房间</n-button>
          </div>
        </div>
      </n-card>
    </div>

    <div class="game-main">
      <div class="game-table">
        <div class="opponent-area">
          <n-card class="player-card" :class="{ active: opponentPlayer?.isActive }">
            <div class="player-info">
              <div class="player-name">{{ opponentPlayer?.name || '等待玩家...' }}</div>
              <div class="player-chips">
                <n-icon><CashOutline /></n-icon>
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
          </n-card>
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

          <div v-if="lastAction" class="last-action">
            <n-alert :type="lastActionType" :bordered="false">
              {{ lastAction }}
            </n-alert>
          </div>
        </div>

        <div class="timer-area" v-if="isMyTurn">
          <n-circle
            :progress="true"
            :percentage="timerPercentage"
            :color="timerColor"
            :stroke-width="8"
            :show-indicator="false"
          >
            <div class="timer-text" :class="{ urgent: isTimerUrgent, critical: isTimerCritical }">
              {{ timeLeft }}
            </div>
          </n-circle>
        </div>

        <div class="my-area">
          <n-card class="player-card" :class="{ active: currentPlayer?.isActive }">
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
            <div class="player-info">
              <div class="player-name">{{ currentPlayer?.name || '我' }}</div>
              <div class="player-chips">
                <n-icon><CashOutline /></n-icon>
                {{ currentPlayer?.chips || 0 }}
              </div>
            </div>
          </n-card>
        </div>
      </div>

      <div class="sidebar">
        <ActionHistory />
      </div>
    </div>

    <div class="action-area">
      <ActionButtons :disabled="!gameInProgress" />
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
import { useGameTimer } from '../composables/useGameTimer';
import Card from '../components/Card.vue';
import ActionButtons from '../components/ActionButtons.vue';
import ChipStack from '../components/ChipStack.vue';
import ActionHistory from '../components/ActionHistory.vue';
import HandRankingModal from '../components/HandRankingModal.vue';
import { CashOutline, CopyOutline, HelpCircleOutline } from '@vicons/ionicons5';
import { useMessage, useNotification } from 'naive-ui';

const router = useRouter();
const store = useGameStore();
const { joinRoom } = useWebSocket();
const { timeLeft, isUrgent: isTimerUrgent, isCritical: isTimerCritical } = useGameTimer();

const message = useMessage();
const notification = useNotification();

const showRulesModal = ref(false);

onMounted(() => {
  if (!store.roomId || !store.playerName) {
    router.push('/');
    return;
  }
  
  console.log('🎮 GameView 已挂载，房间信息:', { roomId: store.roomId, playerName: store.playerName });
  joinRoom(store.roomId, store.playerName);
});

watch(() => store.errorMessage, (msg) => {
  if (msg) {
    message.error(msg);
    store.clearMessages();
  }
});

watch(() => store.successMessage, (msg) => {
  if (msg) {
    message.success(msg);
    store.clearMessages();
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

const timerPercentage = computed(() => (timeLeft.value / 30) * 100);
const timerColor = computed(() => {
  if (isTimerCritical.value) return '#ff4d4f';
  if (isTimerUrgent.value) return '#faad14';
  return '#52c41a';
});

async function copyRoomId() {
  try {
    await navigator.clipboard.writeText(roomId.value);
    message.success('已复制房间号');
  } catch (error) {
    console.error('❌ 复制失败:', error);
    message.error('复制失败');
  }
}

function leaveRoom() {
  store.reset();
  router.push('/');
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
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
}

.opponent-area,
.my-area {
  flex-shrink: 0;
}

.player-card {
  background: rgba(255, 255, 255, 0.95);
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
}

.timer-area {
  position: absolute;
  top: 50%;
  right: 40px;
  transform: translateY(-50%);
}

.timer-text {
  font-size: 24px;
  font-weight: bold;
  color: #52c41a;
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
}

.game-table {
  position: relative;
}
</style>
