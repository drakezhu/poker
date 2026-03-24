import { WebSocket } from 'ws';
import { Room, PlayerAction } from '../models/Room.js';

interface Client {
  ws: WebSocket;
  roomId: string;
  playerId: string;
}

export const rooms = new Map<string, Room>();
const clients = new Map<string, Client>();

type MessageType = 'join' | 'action' | 'ping';

interface IncomingMessage {
  type: MessageType;
  roomId?: string;
  playerName?: string;
  action?: PlayerAction;
  raiseAmount?: number;
}

interface OutgoingMessage {
  type: 'state' | 'error' | 'success';
  state?: any;
  message?: string;
}

export function handleConnection(ws: WebSocket) {
  const clientId = generateId();
  console.log('✅ 新的 WebSocket 连接已建立:', clientId);

  ws.on('message', (data) => {
    console.log('📨 收到消息:', clientId, data.toString());
    try {
      const message: IncomingMessage = JSON.parse(data.toString());
      handleMessage(ws, clientId, message);
    } catch (error) {
      console.error('❌ 解析消息失败:', error);
      sendError(ws, '无效的消息格式');
    }
  });

  ws.on('close', (code, reason) => {
    console.log('🔌 WebSocket 连接关闭:', clientId, code, reason.toString());
    handleDisconnect(clientId);
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket 错误:', clientId, error);
    handleDisconnect(clientId);
  });
}

function handleMessage(ws: WebSocket, clientId: string, message: IncomingMessage) {
  switch (message.type) {
    case 'join':
      handleJoin(ws, clientId, message);
      break;
    case 'action':
      handleAction(clientId, message);
      break;
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;
    default:
      sendError(ws, '未知的消息类型');
  }
}

function handleJoin(ws: WebSocket, clientId: string, message: IncomingMessage) {
  console.log('🎯 handleJoin 被调用:', { clientId, message });
  const { roomId, playerName } = message;

  if (!roomId || !playerName) {
    console.log('❌ 房间号或玩家名为空');
    sendError(ws, '房间号和玩家名不能为空');
    return;
  }

  const room = rooms.get(roomId);
  if (!room) {
    console.log('❌ 房间不存在:', roomId);
    sendError(ws, '房间不存在');
    return;
  }

  if (room.state.players.length >= 2) {
    console.log('❌ 房间已满:', roomId);
    sendError(ws, '房间已满');
    return;
  }

  console.log('👥 加入房间:', roomId, '当前玩家数:', room.state.players.length);

  const success = room.addPlayer(clientId, playerName);
  if (!success) {
    console.log('❌ 加入房间失败');
    sendError(ws, '加入房间失败');
    return;
  }

  console.log('✅ 玩家加入成功:', { clientId, playerName, roomId });
  clients.set(clientId, { ws, roomId, playerId: clientId });
  sendSuccess(ws, '成功加入房间');
  broadcastState(room);
}

function handleAction(clientId: string, message: IncomingMessage) {
  console.log('🎮 handleAction 被调用:', { clientId, message });
  const client = clients.get(clientId);
  if (!client) {
    console.log('❌ 找不到 client:', clientId);
    return;
  }

  const room = rooms.get(client.roomId);
  if (!room) {
    console.log('❌ 找不到 room:', client.roomId);
    return;
  }

  if (message.action) {
    console.log('👤 玩家', client.playerId, '执行动作:', message.action);
    room.playerAction(client.playerId, message.action, message.raiseAmount || 0);
  } else {
    console.log('❌ 消息中没有 action 字段');
  }
}

function handleDisconnect(clientId: string) {
  const client = clients.get(clientId);
  if (!client) return;

  const room = rooms.get(client.roomId);
  if (room) {
    room.removePlayer(client.playerId);
    
    if (room.state.players.length === 0) {
      rooms.delete(client.roomId);
    } else {
      broadcastState(room);
    }
  }

  clients.delete(clientId);
}

export function setupRoomCallbacks(room: Room) {
  room.onStateChange = () => {
    broadcastState(room);
  };

  room.onPlayerTimeout = (playerId: string) => {
    room.playerAction(playerId, 'fold');
  };
}

function broadcastState(room: Room) {
  for (const [clientId, client] of clients) {
    if (client.roomId === room.state.roomId) {
      const playerState = room.getPlayerState(clientId);
      sendState(client.ws, playerState);
    }
  }
}

function sendState(ws: WebSocket, state: any) {
  const message: OutgoingMessage = { type: 'state', state };
  ws.send(JSON.stringify(message));
}

function sendError(ws: WebSocket, message: string) {
  const msg: OutgoingMessage = { type: 'error', message };
  ws.send(JSON.stringify(msg));
}

function sendSuccess(ws: WebSocket, message: string) {
  const msg: OutgoingMessage = { type: 'success', message };
  ws.send(JSON.stringify(msg));
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
