import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleConnection, rooms, setupRoomCallbacks } from './websocket/gameHandler.js';
import { Room, RoomConfig } from './models/Room.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 9000;

app.use(cors());
app.use(express.json());

interface CreateRoomRequest {
  isShortDeck: boolean;
  smallBlind: number;
  bigBlind: number;
  totalChips: number;
}

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function validateRoomConfig(config: CreateRoomRequest): { valid: boolean; error?: string } {
  if (config.smallBlind <= 0 || !Number.isInteger(config.smallBlind)) {
    return { valid: false, error: '小盲注必须是正整数' };
  }
  if (config.bigBlind <= 0 || !Number.isInteger(config.bigBlind)) {
    return { valid: false, error: '大盲注必须是正整数' };
  }
  if (config.bigBlind < config.smallBlind * 2) {
    return { valid: false, error: '大盲注必须至少是小盲注的2倍' };
  }
  if (config.totalChips <= 0 || !Number.isInteger(config.totalChips)) {
    return { valid: false, error: '总筹码量必须是正整数' };
  }
  if (config.totalChips < config.bigBlind * 2) {
    return { valid: false, error: '总筹码量必须至少是大盲注的2倍' };
  }
  return { valid: true };
}

app.post('/api/rooms', (req, res) => {
  try {
    const config: CreateRoomRequest = req.body;
    
    const validation = validateRoomConfig(config);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const roomId = generateRoomId();
    const roomConfig: RoomConfig = {
      isShortDeck: config.isShortDeck,
      smallBlind: config.smallBlind,
      bigBlind: config.bigBlind,
      totalChips: config.totalChips
    };

    const room = new Room(roomId, roomConfig);
    rooms.set(roomId, room);
    setupRoomCallbacks(room);

    console.log('🏠 新房间创建成功:', { roomId, config: roomConfig });

    res.json({
      roomId,
      config: roomConfig
    });
  } catch (error) {
    console.error('❌ 创建房间失败:', error);
    res.status(500).json({ error: '创建房间失败' });
  }
});

app.get('/api/rooms/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }
  res.json({
    roomId: room.state.roomId,
    config: room.state.config,
    playerCount: room.state.players.length
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '德州扑克服务器运行中' });
});

const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws) => {
  handleConnection(ws);
});

// 处理 HTTP 服务器的升级事件
server.on('upgrade', (request, socket, head) => {
  // 只在 /ws 路径上处理 WebSocket 连接
  if (request.url === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws);
    });
  } else {
    socket.destroy();
  }
});

wss.on('error', (error) => {
  console.error('WebSocket 服务器错误:', error);
});

server.listen(PORT, () => {
  console.log(`🚀 德州扑克服务器启动成功！`);
  console.log(`📡 HTTP 服务器: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`💊 健康检查: http://localhost:${PORT}/health`);
});
