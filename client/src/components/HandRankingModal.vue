<template>
  <n-modal
    v-model:show="showModal"
    preset="card"
    title="牌型规则"
    :style="{ width: '600px' }"
    class="hand-ranking-modal"
  >
    <template #header-extra>
      <n-tag :type="isShortDeck ? 'error' : 'info'">
        {{ isShortDeck ? '短牌模式' : '标准德州' }}
      </n-tag>
    </template>

    <div class="modal-content">
      <n-divider>
        <n-text depth="2" :size="14">牌型从高到低排序</n-text>
      </n-divider>

      <div class="hand-rankings">
        <div v-for="(hand, index) in handRankings" :key="index" class="hand-ranking-item">
          <div class="rank-number">{{ index + 1 }}</div>
          <div class="hand-info">
            <div class="hand-name">{{ hand.name }}</div>
            <div class="hand-description">{{ hand.description }}</div>
          </div>
          <div class="hand-image-placeholder">
            <n-icon size="48">
              <DiamondOutline />
            </n-icon>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <n-button @click="showModal = false">关闭</n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DiamondOutline } from '@vicons/ionicons5';

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
.modal-content {
  max-height: 500px;
  overflow-y: auto;
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
</style>
