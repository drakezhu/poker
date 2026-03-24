import { ref, onUnmounted } from 'vue';
import { useGameStore } from '../stores/gameStore';
import type { PlayerAction, WebSocketMessage } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || '/ws';

// 全局单例变量 - 确保所有组件共享同一个 WebSocket 实例
let wsInstance: WebSocket | null = null;
const reconnectAttempts = ref(0);
const maxReconnectAttempts = 5;
const pendingJoinInfo = ref<{ roomId: string; playerName: string } | null>(null);

export function useWebSocket() {
  const store = useGameStore();

  function connect() {
    if (wsInstance?.readyState === WebSocket.OPEN || wsInstance?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket 已经连接或正在连接中');
      return;
    }

    try {
      console.log('正在连接 WebSocket:', WS_URL);
      wsInstance = new WebSocket(WS_URL);
      
      wsInstance.onopen = () => {
        console.log('✅ WebSocket 连接成功');
        store.setConnected(true);
        reconnectAttempts.value = 0;
        
        if (pendingJoinInfo.value) {
          console.log('发送加入房间消息:', pendingJoinInfo.value);
          wsInstance?.send(JSON.stringify({
            type: 'join',
            roomId: pendingJoinInfo.value.roomId,
            playerName: pendingJoinInfo.value.playerName
          }));
          pendingJoinInfo.value = null;
        } else if (store.roomId && store.playerName) {
          // 如果已经加入过房间，重连后自动重新加入
          console.log('重连后自动重新加入房间:', { roomId: store.roomId, playerName: store.playerName });
          wsInstance?.send(JSON.stringify({
            type: 'join',
            roomId: store.roomId,
            playerName: store.playerName
          }));
        }
      };

      wsInstance.onmessage = (event) => {
        console.log('收到服务器消息:', event.data);
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('解析消息失败:', error);
        }
      };

      wsInstance.onclose = (event) => {
        console.log('WebSocket 连接关闭:', event.code, event.reason);
        store.setConnected(false);
        attemptReconnect();
      };

      wsInstance.onerror = (error) => {
        console.error('❌ WebSocket 错误:', error);
        store.setError('WebSocket 连接错误，请确认后端服务器已启动');
      };
    } catch (error) {
      console.error('连接失败:', error);
      store.setError('无法连接到服务器');
    }
  }

  function handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'state':
        if (message.state) {
          store.setRoomState(message.state);
          
          // 如果 playerId 还没设置，尝试通过 playerName 找到对应的 playerId
          if (!store.playerId && store.playerName) {
            const player = message.state.players.find(p => p.name === store.playerName);
            if (player) {
              console.log('🔍 找到我的 playerId:', player.id);
              store.setPlayerInfo(player.id, store.playerName, store.roomId);
            }
          }
        }
        break;
      case 'error':
        if (message.message) {
          store.setError(message.message);
        }
        break;
      case 'success':
        if (message.message) {
          store.setSuccess(message.message);
        }
        break;
    }
  }

  function attemptReconnect() {
    if (reconnectAttempts.value < maxReconnectAttempts) {
      reconnectAttempts.value++;
      console.log(`尝试重连 (${reconnectAttempts.value}/${maxReconnectAttempts})...`);
      setTimeout(connect, 3000);
    }
  }

  function send(message: any) {
    console.log('📤 发送消息:', message, 'wsInstance:', wsInstance);
    if (wsInstance?.readyState === WebSocket.OPEN) {
      wsInstance.send(JSON.stringify(message));
      console.log('✅ 消息发送成功');
    } else {
      console.warn('WebSocket 未连接，无法发送消息');
    }
  }

  function joinRoom(roomId: string, playerName: string) {
    console.log('🚀 useWebSocket: 准备加入房间:', { roomId, playerName });
    store.setPlayerInfo('', playerName, roomId);
    
    if (wsInstance?.readyState === WebSocket.OPEN) {
      console.log('WebSocket 已连接，直接发送加入房间消息:', { roomId, playerName });
      send({
        type: 'join',
        roomId,
        playerName
      });
    } else {
      console.log('WebSocket 未连接，将在连接后发送加入房间消息:', { roomId, playerName });
      pendingJoinInfo.value = { roomId, playerName };
      connect();
    }
  }

  function sendAction(action: PlayerAction, raiseAmount: number = 0) {
    send({
      type: 'action',
      action,
      raiseAmount
    });
  }

  function toggleReady() {
    send({
      type: 'toggle_ready'
    });
  }

  function disconnect() {
    if (wsInstance) {
      console.log('🔌 关闭 WebSocket 连接');
      wsInstance.close();
      wsInstance = null;
    }
    pendingJoinInfo.value = null;
  }

  // 暂时禁用自动断开连接，让连接保持活跃
  // onUnmounted(() => {
  //   disconnect();
  // });

  return {
    connect,
    disconnect,
    joinRoom,
    sendAction,
    toggleReady
  };
}
