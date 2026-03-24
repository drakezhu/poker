<template>
  <div
    :class="[
      'card',
      { 'card-hidden': !card && hidden },
      { 'card-red': isRed }
    ]"
  >
    <template v-if="card">
      <div class="card-corner top-left">
        <div class="card-rank">{{ card.rank }}</div>
        <div class="card-suit">{{ card.suit }}</div>
      </div>
      <div class="card-center">
        <span class="card-suit-large">{{ card.suit }}</span>
      </div>
      <div class="card-corner bottom-right">
        <div class="card-rank">{{ card.rank }}</div>
        <div class="card-suit">{{ card.suit }}</div>
      </div>
    </template>
    <template v-else-if="hidden">
      <div class="card-back">
        <div class="card-back-pattern"></div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Card as CardType } from '../types';

interface Props {
  card?: CardType | null;
  hidden?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  hidden: false
});

const isRed = computed(() => {
  if (!props.card) return false;
  return props.card.suit === '♥' || props.card.suit === '♦';
});
</script>

<style scoped>
.card {
  width: 70px;
  height: 100px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  position: relative;
  font-weight: bold;
  user-select: none;
}

.card-red {
  color: #d32f2f;
}

.card:not(.card-red):not(.card-hidden) {
  color: #212121;
}

.card-corner {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}

.top-left {
  top: 6px;
  left: 6px;
}

.bottom-right {
  bottom: 6px;
  right: 6px;
  transform: rotate(180deg);
}

.card-rank {
  font-size: 16px;
}

.card-suit {
  font-size: 18px;
}

.card-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.card-suit-large {
  font-size: 36px;
}

.card-hidden {
  background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
}

.card-back {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-back-pattern {
  width: 50px;
  height: 80px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 5px,
    rgba(255, 255, 255, 0.1) 5px,
    rgba(255, 255, 255, 0.1) 10px
  );
}
</style>
