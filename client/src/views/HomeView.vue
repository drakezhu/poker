<template>
  <div class="home-container">
    <n-card title="德州扑克" class="home-card">
      <template #header-extra>
        <n-tag type="info">双人对战</n-tag>
      </template>
      
      <div class="home-content">
        <div class="action-section">
          <n-space vertical :size="24">
            <n-button
              type="success"
              size="huge"
              block
              @click="showCreateDialog = true"
            >
              <template #icon>
                <n-icon><Add /></n-icon>
              </template>
              创建房间
            </n-button>

            <n-divider>或者</n-divider>

            <div class="join-section">
              <n-input-group>
                <n-input
                  v-model:value="roomId"
                  placeholder="输入房间号"
                  size="huge"
                  clearable
                >
                  <template #prefix>
                    <n-icon><Key /></n-icon>
                  </template>
                </n-input>
                <n-button type="primary" size="huge" @click="showJoinDialog = true">
                  加入房间
                </n-button>
              </n-input-group>
            </div>
          </n-space>
        </div>
      </div>
    </n-card>

    <n-modal v-model:show="showCreateDialog" preset="card" title="创建新房间" :style="{ width: '500px' }">
      <div class="create-room-form">
        <n-form ref="createFormRef" :model="roomConfig" :rules="rules" label-placement="left" label-width="120">
          <n-form-item label="游戏模式" path="isShortDeck">
            <n-radio-group v-model:value="roomConfig.isShortDeck">
              <n-space>
                <n-radio :value="false">标准德州</n-radio>
                <n-radio :value="true">短牌模式</n-radio>
              </n-space>
            </n-radio-group>
            <div class="help-text">
              <n-text depth="3" :size="14">
                短牌模式使用 36 张牌（移除 2-5），同花 > 葫芦
              </n-text>
            </div>
          </n-form-item>

          <n-form-item label="小盲注" path="smallBlind">
            <n-select v-model:value="roomConfig.smallBlind" :options="smallBlindOptions" />
          </n-form-item>

          <n-form-item label="大盲注" path="bigBlind">
            <n-select v-model:value="roomConfig.bigBlind" :options="bigBlindOptions" />
            <div class="help-text">
              <n-text depth="3" :size="14">
                大盲注必须至少是小盲注的 2 倍
              </n-text>
            </div>
          </n-form-item>

          <n-form-item label="总筹码" path="totalChips">
            <n-select v-model:value="roomConfig.totalChips" :options="chipOptions" />
          </n-form-item>
        </n-form>
      </div>
      <template #footer>
        <n-space>
          <n-button @click="showCreateDialog = false">取消</n-button>
          <n-button type="primary" :loading="creating" @click="createRoom">
            创建
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showJoinDialog" preset="card" title="加入房间" :style="{ width: '400px' }">
      <div class="join-room-form">
        <n-form ref="joinFormRef" :model="joinForm" :rules="joinRules" label-placement="left" label-width="100">
          <n-form-item label="昵称" path="playerName">
            <n-input
              v-model:value="joinForm.playerName"
              placeholder="请输入你的昵称"
              size="large"
              clearable
            >
              <template #prefix>
                <n-icon><PersonOutline /></n-icon>
              </template>
            </n-input>
          </n-form-item>
        </n-form>
      </div>
      <template #footer>
        <n-space>
          <n-button @click="showJoinDialog = false">取消</n-button>
          <n-button type="primary" @click="joinRoom">
            加入
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore';
import { PersonOutline, Key, Add } from '@vicons/ionicons5';
import type { FormInst, FormRules, SelectOption } from 'naive-ui';
import type { CreateRoomRequest, RoomConfig } from '../types';

const router = useRouter();
const store = useGameStore();

const createFormRef = ref<FormInst | null>(null);
const joinFormRef = ref<FormInst | null>(null);

const showCreateDialog = ref(false);
const showJoinDialog = ref(false);
const creating = ref(false);

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

const smallBlindOptions: SelectOption[] = [
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

const chipOptions: SelectOption[] = [
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

const rules: FormRules = {
  isShortDeck: {
    type: 'boolean',
    required: true,
    trigger: 'change'
  },
  smallBlind: {
    type: 'number',
    required: true,
    trigger: 'change',
    validator: (rule, value) => {
      if (!value || value <= 0) return new Error('请选择小盲注');
      return true;
    }
  },
  bigBlind: {
    type: 'number',
    required: true,
    trigger: 'change',
    validator: (rule, value) => {
      if (!value || value < roomConfig.smallBlind * 2) {
        return new Error(`大盲注必须至少是小盲注的 ${roomConfig.smallBlind * 2} 倍`);
      }
      return true;
    }
  },
  totalChips: {
    type: 'number',
    required: true,
    trigger: 'change',
    validator: (rule, value) => {
      if (!value || value <= 0) return new Error('请选择总筹码量');
      if (value < roomConfig.bigBlind * 2) {
        return new Error(`总筹码量必须至少是大盲注的 ${roomConfig.bigBlind * 2} 倍`);
      }
      return true;
    }
  }
};

const joinRules: FormRules = {
  playerName: {
    required: true,
    message: '请输入昵称',
    trigger: 'blur'
  }
};

async function createRoom() {
  await createFormRef.value?.validate(async (errors) => {
    if (!errors) {
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
  });
}

function joinRoom() {
  joinFormRef.value?.validate((errors) => {
    if (!errors) {
      if (!roomId.value.trim()) {
        window.alert('请输入房间号');
        return;
      }
      if (!joinForm.playerName.trim()) {
        window.alert('请输入昵称');
        return;
      }

      console.log('🏠 加入房间', { roomId: roomId.value, playerName: joinForm.playerName.value });
      store.setPlayerInfo('', joinForm.playerName.value, roomId.value);
      router.push('/game');
    }
  });
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a237e 0%, #0d47a1 50%, #01579b 100%);
  padding: 20px;
}

.home-card {
  width: 100%;
  max-width: 500px;
}

.home-content {
  padding: 20px 0;
}

.action-section {
  margin-top: 20px;
}

.join-section {
  width: 100%;
}

.create-room-form,
.join-room-form {
  padding: 10px 0;
}

.help-text {
  margin-top: 8px;
}
</style>
