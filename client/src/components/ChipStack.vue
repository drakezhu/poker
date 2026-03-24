<template>
  <div class="chip-stack">
    <div class="chips">
      <div
        v-for="(_, index) in chipCount"
        :key="index"
        class="chip"
        :style="{ transform: `translateY(${index * 2}px)`, zIndex: chipCount - index }"
      >
        <div class="chip-inner"></div>
      </div>
    </div>
    <div class="chip-value">{{ amount }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  amount: number;
}

const props = defineProps<Props>();

const chipCount = computed(() => {
  return Math.min(Math.ceil(props.amount / 50), 10);
});
</script>

<style scoped>
.chip-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.chips {
  position: relative;
  height: 40px;
  width: 40px;
}

.chip {
  position: absolute;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(145deg, #ffd700, #ffaa00);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.chip-inner {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(145deg, #ffaa00, #ff8800);
  border: 2px dashed rgba(255, 255, 255, 0.6);
}

.chip-value {
  font-size: 14px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}
</style>
