<template>
  <div class="home-container">
    <div class="home-card">
      <div class="card-header">
        <h1>德州扑克</h1>
        <span class="tag tag-info">双人对战</span>
      </div>
      
      <div class="home-content">
        <div class="action-section">
          <div class="button-container">
            <button
              class="btn btn-success btn-huge btn-hover btn-active"
              @click="showCreateDialog = true"
            >
              <span class="btn-icon">+</span>
              创建房间
            </button>

            <div class="divider">或者</div>

            <div class="join-section">
              <div class="input-group">
                <input
                  v-model="roomId"
                  type="text"
                  placeholder="输入房间号"
                  class="input input-huge"
                />
                <button class="btn btn-primary btn-huge btn-hover btn-active" @click="showJoinDialog = true">
                  加入房间
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建房间对话框 -->
    <div v-if="showCreateDialog" class="modal-overlay" @click="showCreateDialog = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>创建新房间</h2>
          <button class="modal-close" @click="showCreateDialog = false">×</button>
        </div>
        <div class="modal-body">
          <form class="create-room-form" @submit.prevent="createRoom">
            <div class="form-item">
              <label class="form-label">游戏模式</label>
              <div class="radio-group">
                <label class="radio-option">
                  <input type="radio" v-model="roomConfig.isShortDeck" :value="false" />
                  <span>标准德州</span>
                </label>
                <label class="radio-option">
                  <input type="radio" v-model="roomConfig.isShortDeck" :value="true" />
                  <span>短牌模式</span>
                </label>
              </div>
              <div class="help-text">
                短牌模式使用 36 张牌（移除 2-5），同花 > 葫芦
              </div>
            </div>

            <div class="form-item">
              <label class="form-label">小盲注</label>
              <select v-model="roomConfig.smallBlind" class="select">
                <option v-for="option in smallBlindOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>

            <div class="form-item">
              <label class="form-label">大盲注</label>
              <select v-model="roomConfig.bigBlind" class="select">
                <option v-for="option in bigBlindOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <div class="help-text">
                大盲注必须至少是小盲注的 2 倍
              </div>
            </div>

            <div class="form-item">
              <label class="form-label">总筹码</label>
              <select v-model="roomConfig.totalChips" class="select">
                <option v-for="option in chipOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>

            <div class="form-errors" v-if="createErrors.length">
              <div v-for="(error, index) in createErrors" :key="index" class="error-message">
                {{ error }}
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-hover btn-active" @click="showCreateDialog = false">取消</button>
          <button class="btn btn-primary btn-hover btn-active" :disabled="creating" @click="createRoom">
            {{ creating ? '创建中...' : '创建' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 加入房间对话框 -->
    <div v-if="showJoinDialog" class="modal-overlay" @click="showJoinDialog = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>加入房间</h2>
          <button class="modal-close" @click="showJoinDialog = false">×</button>
        </div>
        <div class="modal-body">
          <form class="join-room-form" @submit.prevent="joinRoom">
            <div class="form-item">
              <label class="form-label">昵称</label>
              <input
                v-model="joinForm.playerName"
                type="text"
                placeholder="请输入你的昵称"
                class="input input-large"
              />
            </div>

            <div class="form-errors" v-if="joinErrors.length">
              <div v-for="(error, index) in joinErrors" :key="index" class="error-message">
                {{ error }}
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-hover btn-active" @click="showJoinDialog = false">取消</button>
          <button class="btn btn-primary btn-hover btn-active" @click="joinRoom">
            加入
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore';
import type { CreateRoomRequest } from '../types';

const router = useRouter();
const store = useGameStore();

const showCreateDialog = ref(false);
const showJoinDialog = ref(false);
const creating = ref(false);
const createErrors = ref<string[]>([]);
const joinErrors = ref<string[]>([]);

const roomId = ref('');
const joinForm = reactive({
  playerName: ''
});

const roomConfig = reactive<CreateRoomRequest>({
  isShortDeck: false,
  smallBlind: 10,
  bigBlind: 20,
  totalChips: 2000
});

const smallBlindOptions = [
  { label: '5', value: 5 },
  { label: '10', value: 10 },
  { label: '25', value: 25 },
  { label: '50', value: 50 },
  { label: '100', value: 100 }
];

const bigBlindOptions = computed(() => {
  const minBB = roomConfig.smallBlind * 2;
  return [
    { label: String(minBB), value: minBB },
    { label: String(minBB * 2), value: minBB * 2 },
    { label: String(minBB * 5), value: minBB * 5 }
  ];
});

const chipOptions = [
  { label: '1000', value: 1000 },
  { label: '2000', value: 2000 },
  { label: '5000', value: 5000 },
  { label: '10000', value: 10000 }
];

watch(() => roomConfig.smallBlind, (newSB) => {
  const minBB = newSB * 2;
  if (roomConfig.bigBlind < minBB) {
    roomConfig.bigBlind = minBB;
  }
});

function validateCreateForm() {
  const errors: string[] = [];
  
  if (!roomConfig.smallBlind || roomConfig.smallBlind <= 0) {
    errors.push('请选择小盲注');
  }
  
  if (!roomConfig.bigBlind || roomConfig.bigBlind < roomConfig.smallBlind * 2) {
    errors.push(`大盲注必须至少是小盲注的 ${roomConfig.smallBlind * 2} 倍`);
  }
  
  if (!roomConfig.totalChips || roomConfig.totalChips <= 0) {
    errors.push('请选择总筹码量');
  }
  
  if (roomConfig.totalChips < roomConfig.bigBlind * 2) {
    errors.push(`总筹码量必须至少是大盲注的 ${roomConfig.bigBlind * 2} 倍`);
  }
  
  createErrors.value = errors;
  return errors.length === 0;
}

function validateJoinForm() {
  const errors: string[] = [];
  
  if (!roomId.value.trim()) {
    errors.push('请输入房间号');
  }
  
  if (!joinForm.playerName.trim()) {
    errors.push('请输入昵称');
  }
  
  joinErrors.value = errors;
  return errors.length === 0;
}

async function createRoom() {
  if (!validateCreateForm()) {
    return;
  }
  
  creating.value = true;
  try {
    const response = await fetch('/api/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(roomConfig)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '创建房间失败');
    }

    const data = await response.json();
    console.log('🏠 房间创建成功:', data);
    
    roomId.value = data.roomId;
    joinForm.playerName = '';
    showCreateDialog.value = false;
    showJoinDialog.value = true;
  } catch (error) {
    console.error('❌ 创建房间失败:', error);
    window.alert(error instanceof Error ? error.message : '创建房间失败');
  } finally {
    creating.value = false;
  }
}

function joinRoom() {
  if (!validateJoinForm()) {
    return;
  }

  console.log('🏠 加入房间', { roomId: roomId.value, playerName: joinForm.playerName });
  store.setPlayerInfo('', joinForm.playerName, roomId.value);
  router.push('/game');
}
</script>

<style scoped>
/* 引入字体 */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=JetBrains+Mono&family=Noto+Sans+SC:wght@400;700&display=swap');

/* 自定义工具类 */
.glass {
  backdrop-filter: blur(12px);
  background-color: rgba(255, 255, 255, 0.05);
}

.glass-light {
  backdrop-filter: blur(12px);
  background-color: rgba(255, 255, 255, 0.08);
}

/* 标题渐变 */
.gradient-text {
  background: linear-gradient(90deg, #8B5CF6, #06B6D4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 按钮渐变 */
.gradient-primary {
  background: linear-gradient(90deg, #8B5CF6, #06B6D4);
}

.gradient-success {
  background: linear-gradient(90deg, #10B981, #059669);
}

.gradient-warning {
  background: linear-gradient(90deg, #F59E0B, #D97706);
}

.gradient-error {
  background: linear-gradient(90deg, #EF4444, #DC2626);
}

/* 边框渐变 */
.border-gradient {
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.text-shadow {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.btn-hover {
  transition: all 0.3s ease;
}

.btn-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(106, 17, 203, 0.3);
}

.btn-active {
  transition: all 0.1s ease;
}

.btn-active:active {
  transform: scale(0.98);
  box-shadow: 0 4px 12px rgba(106, 17, 203, 0.4);
}

/* 主容器 */
.home-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #121212;
  color: white;
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.home-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.home-card {
  width: 100%;
  max-width: 500px;
  backdrop-filter: blur(12px);
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;
}

.card-header {
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.card-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: bold;
  background: linear-gradient(90deg, #8B5CF6, #06B6D4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-family: 'Inter', 'Noto Sans SC', sans-serif;
}

.tag {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.tag-info {
  background: rgba(139, 92, 246, 0.2);
  color: #8B5CF6;
  border-color: rgba(139, 92, 246, 0.3);
}

.home-content {
  padding: 32px 24px;
}

.action-section {
  margin-top: 20px;
}

.button-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
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
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.btn:hover::before {
  left: 100%;
}

.btn-huge {
  padding: 20px;
  font-size: 18px;
}

.btn-success {
  background: linear-gradient(90deg, #10B981, #059669);
  color: white;
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
}

.btn-primary {
  background: linear-gradient(90deg, #8B5CF6, #06B6D4);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(106, 17, 203, 0.3);
}

.btn-primary:disabled {
  background: rgba(139, 92, 246, 0.5);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.divider {
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.join-section {
  width: 100%;
}

.input-group {
  display: flex;
  gap: 10px;
}

.input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-family: 'JetBrains Mono', monospace;
}

.input:focus {
  outline: none;
  border-color: #8B5CF6;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
}

.input-huge {
  padding: 20px;
  font-size: 18px;
}

.input-large {
  padding: 16px;
  font-size: 16px;
}

.select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.select:focus {
  outline: none;
  border-color: #8B5CF6;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
}

.select option {
  background: #121212;
  color: white;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  backdrop-filter: blur(12px);
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
  background: linear-gradient(90deg, #8B5CF6, #06B6D4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
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
  background: rgba(255, 255, 255, 0.1);
}

.modal-body {
  padding: 20px;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.radio-group {
  display: flex;
  gap: 20px;
  margin-bottom: 8px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
}

.radio-option input[type="radio"] {
  width: 16px;
  height: 16px;
  accent-color: #8B5CF6;
}

.help-text {
  margin-top: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.form-errors {
  margin-top: 16px;
}

.error-message {
  color: #EF4444;
  font-size: 13px;
  margin-bottom: 8px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.create-room-form,
.join-room-form {
  padding: 10px 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .home-card {
    margin: 0 20px;
  }
  
  .input-group {
    flex-direction: column;
  }
  
  .btn-huge {
    padding: 16px;
    font-size: 16px;
  }
}
</style>
