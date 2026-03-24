# 🎴 德州扑克 - 两人实时对战

一个完整的德州扑克网页应用，支持两人实时对战，使用现代 Web 技术栈构建。

## 🚀 功能特性

- ✅ 两名玩家通过房间号加入游戏
- ✅ 完整的德州扑克游戏流程
- ✅ 支持跟注、加注、弃牌、All-in 操作
- ✅ WebSocket 实时通信
- ✅ 服务端游戏逻辑和胜负判定
- ✅ 操作倒计时（30秒）
- ✅ 底牌仅对对应玩家可见

## 🛠️ 技术栈

### 前端
- Vue 3 + TypeScript
- Vite
- Naive UI
- Pinia
- 原生 WebSocket

### 后端
- Node.js + Express
- TypeScript
- ws (WebSocket 库)
- 游戏逻辑全在服务端执行

## 📦 安装和运行

### 前置要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
# 安装根目录、前端和后端的所有依赖
npm run install:all
```

或者分别安装：

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

### 本地开发

需要打开两个终端窗口：

**终端 1 - 启动后端服务器：**
```bash
npm run dev:server
```

后端将在 `http://localhost:3000` 启动。

**终端 2 - 启动前端开发服务器：**
```bash
npm run dev:client
```

前端将在 `http://localhost:5173` 启动。

### 游戏流程

1. 打开两个浏览器窗口或标签页访问 `http://localhost:5173`
2. 第一个玩家：输入昵称，点击"创建新房间"
3. 复制生成的房间号
4. 第二个玩家：输入昵称，粘贴房间号，点击"加入房间"
5. 游戏自动开始！

## 📁 项目结构

```
poker-app/
├── client/                 # Vue 3 前端
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── composables/    # 组合式函数
│   │   ├── stores/         # Pinia 状态管理
│   │   ├── views/          # 页面视图
│   │   ├── router/         # 路由配置
│   │   └── main.ts         # 入口文件
│   └── package.json
│
└── server/                 # Node.js 后端
    ├── game/               # 游戏逻辑
    ├── models/             # 数据模型
    ├── websocket/          # WebSocket 处理
    ├── app.ts              # 服务器入口
    └── package.json
```

## 🎮 游戏规则

### 牌型大小（从大到小）

1. 皇家同花顺 (Royal Flush)
2. 同花顺 (Straight Flush)
3. 四条 (Four of a Kind)
4. 葫芦 (Full House)
5. 同花 (Flush)
6. 顺子 (Straight)
7. 三条 (Three of a Kind)
8. 两对 (Two Pair)
9. 一对 (One Pair)
10. 高牌 (High Card)

### 游戏流程

1. **Pre-flop（翻牌前）**：每人发2张底牌，小盲注和大盲注下注
2. **Flop（翻牌）**：发3张公共牌
3. **Turn（转牌）**：发第4张公共牌
4. **River（河牌）**：发第5张公共牌
5. **Showdown（摊牌）**：比较牌型，判定胜负

## 🚀 部署

### 前端部署 (Vercel)

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 设置环境变量 `VITE_WS_URL` 为你的后端 WebSocket 地址
4. 部署！

### 后端部署 (Render/Railway)

1. 将代码推送到 GitHub
2. 在 Render 或 Railway 中导入项目
3. 设置启动命令为 `npm start`（需要先 build）
4. 部署！

## 📝 许可证

MIT License
