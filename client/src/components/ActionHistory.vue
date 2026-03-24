<template>
  <div class="action-history">
    <h3 class="history-title">操作历史</h3>
    <div class="history-list">
      <div v-if="sortedHistory.length === 0" class="history-empty">
        暂无操作记录
      </div>
      <div
        v-for="(item, index) in sortedHistory"
        :key="index"
        class="history-item"
        :class="getItemClass(item)"
      >
        <div class="history-stage">{{ getStageLabel(item.stage) }}</div>
        <div class="history-player">{{ item.playerName }}</div>
        <div class="history-action">{{ getActionLabel(item) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../stores/gameStore';
import type { ActionHistoryItem } from '../types';

const store = useGameStore();

const sortedHistory = computed(() => {
  if (!store.roomState?.actionHistory) return [];
  return [...store.roomState.actionHistory].reverse();
});

function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    preflop: 'Pre-flop',
    flop: 'Flop',
    turn: 'Turn',
    river: 'River',
    showdown: '摊牌'
  };
  return labels[stage] || stage;
}

function getActionLabel(item: ActionHistoryItem): string {
  const actionLabels: Record<string, string> = {
    fold: '弃牌',
    call: '跟注',
    raise: '加注',
    allin: 'All-in'
  };
  
  const label = actionLabels[item.action] || item.action;
  if (item.amount !== undefined && item.amount > 0) {
    return `${label} ${item.amount}`;
  }
  return label;
}

function getItemClass(item: ActionHistoryItem) {
  return {
    'is-me': item.playerId === store.playerId,
    'is-opponent': item.playerId !== store.playerId,
    [`action-${item.action}`]: true
  };
}
</script>

<style scoped>
.action-history {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-height: 300px;
  display: flex;
  flex-direction: column;
}

.history-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #e94560;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-list::-webkit-scrollbar {
  width: 6px;
}

.history-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.history-list::-webkit-scrollbar-thumb {
  background: #e94560;
  border-radius: 3px;
}

.history-empty {
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  padding: 20px;
  font-size: 14px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
}

.history-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.history-item.is-me {
  border-left: 3px solid #00d9ff;
}

.history-item.is-opponent {
  border-left: 3px solid #ff9f43;
}

.history-stage {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  min-width: 55px;
  text-align: center;
}

.history-player {
  font-size: 13px;
  color: #fff;
  font-weight: 500;
  min-width: 40px;
}

.history-action {
  font-size: 13px;
  font-weight: 600;
}

.history-item.action-fold .history-action {
  color: #ff6b6b;
}

.history-item.action-call .history-action {
  color: #4ecdc4;
}

.history-item.action-raise .history-action {
  color: #ffe66d;
}

.history-item.action-allin .history-action {
  color: #e94560;
}
</style>
