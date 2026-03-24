import { ref, computed, watch, onUnmounted } from 'vue';
import { useGameStore } from '../stores/gameStore';

export function useGameTimer() {
  const store = useGameStore();
  const timer = ref<NodeJS.Timeout | null>(null);
  const timeLeft = ref(30);

  const isUrgent = computed(() => timeLeft.value <= 10);
  const isCritical = computed(() => timeLeft.value <= 5);

  function startTimer() {
    clearTimer();
    timeLeft.value = 30;
    
    timer.value = setInterval(() => {
      timeLeft.value--;
      if (timeLeft.value <= 0) {
        clearTimer();
      }
    }, 1000);
  }

  function clearTimer() {
    if (timer.value) {
      clearInterval(timer.value);
      timer.value = null;
    }
  }

  function resetTimer() {
    timeLeft.value = 30;
  }

  watch(() => store.roomState?.players, (players) => {
    if (!players) return;
    
    const currentPlayer = players.find(p => p.isActive);
    if (currentPlayer) {
      startTimer();
    } else {
      clearTimer();
      resetTimer();
    }
  }, { deep: true });

  onUnmounted(() => {
    clearTimer();
  });

  return {
    timeLeft,
    isUrgent,
    isCritical,
    startTimer,
    clearTimer,
    resetTimer
  };
}
