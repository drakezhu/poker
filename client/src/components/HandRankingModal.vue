<template>
  <div v-if="showModal" class="modal-overlay" @click="showModal = false">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>牌型规则</h2>
        <div class="header-extra">
          <span :class="['tag', isShortDeck ? 'tag-error' : 'tag-info']">
            {{ isShortDeck ? '短牌模式' : '标准德州' }}
          </span>
        </div>
        <button class="modal-close" @click="showModal = false">×</button>
      </div>
      <div class="modal-body">
        <div class="divider">
          <span class="divider-text">牌型从高到低排序</span>
        </div>
        <div class="hand-rankings">
          <div v-for="(hand, index) in handRankings" :key="index" class="hand-ranking-item">
            <div class="rank-number">{{ index + 1 }}</div>
            <div class="hand-info">
              <div class="hand-name">{{ hand.name }}</div>
              <div class="hand-description">{{ hand.description }}</div>
            </div>
            <div class="hand-image-placeholder">
              <span class="card-icon">♦</span>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" @click="showModal = false">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  show: boolean;
  isShortDeck: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:show': [value: boolean];
}>();

const showModal = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
});

const standardHandRankings = [
  { name: '皇家同花顺', description: 'A-K-Q-J-T 同花色' },
  { name: '同花顺', description: '五张连续同花色的牌' },
  { name: '四条', description: '四张相同点数的牌' },
  { name: '葫芦', description: '三条 + 一对' },
  { name: '同花', description: '五张同花色的牌' },
  { name: '顺子', description: '五张连续点数的牌' },
  { name: '三条', description: '三张相同点数的牌' },
  { name: '两对', description: '两个不同的对子' },
  { name: '一对', description: '两张相同点数的牌' },
  { name: '高牌', description: '单张最大的牌' }
];

const shortDeckHandRankings = [
  { name: '皇家同花顺', description: 'A-K-Q-J-T 同花色' },
  { name: '同花顺', description: '五张连续同花色的牌' },
  { name: '四条', description: '四张相同点数的牌' },
  { name: '葫芦', description: '三条 + 一对' },
  { name: '同花', description: '五张同花色的牌（同花 > 葫芦）' },
  { name: '顺子', description: '五张连续点数的牌（最小 A-6-7-8-9）' },
  { name: '三条', description: '三张相同点数的牌' },
  { name: '两对', description: '两个不同的对子' },
  { name: '一对', description: '两张相同点数的牌' },
  { name: '高牌', description: '单张最大的牌' }
];

const handRankings = computed(() => {
  if (props.isShortDeck) {
    return [...shortDeckHandRankings];
  }
  return [...standardHandRankings];
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
}

.header-extra {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.tag {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  display: inline-block;
}

.tag-info {
  background: #e3f2fd;
  color: #1976d2;
}

.tag-error {
  background: #ffebee;
  color: #d32f2f;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #757575;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.modal-close:hover {
  background: #f5f5f5;
}

.modal-body {
  padding: 20px;
  max-height: 500px;
  overflow-y: auto;
}

.divider {
  text-align: center;
  position: relative;
  margin: 20px 0;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: #e0e0e0;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.divider-text {
  background: white;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 500;
  color: #757575;
}

.hand-rankings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hand-ranking-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
}

.rank-number {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
}

.hand-info {
  flex: 1;
}

.hand-name {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 4px;
}

.hand-description {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.6);
}

.hand-image-placeholder {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  color: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.card-icon {
  font-size: 48px;
  font-weight: bold;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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
  background: #1976d2;
  color: white;
}

.btn:hover {
  background: #1565c0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
}
</style>
