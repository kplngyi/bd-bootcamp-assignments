# 实时投票系统

一个基于 WebSocket 的实时投票应用，支持高并发、异常投票检测和实时数据可视化。

## 项目概述

该项目是一个完整的实时投票系统，包含前端投票页面、实时数据展示和后端 WebSocket 服务。系统具有以下特点：

- **实时性**：使用 WebSocket 实现双向通信，投票结果实时更新
- **高并发支持**：实现了令牌桶限流算法，支持 1000+ 并发连接
- **异常投票检测**：内置异常检测系统，识别异常投票行为
- **数据可视化**：提供投票结果排名
- **性能优化**：使用 Web Worker 处理数据计算，减少主线程阻塞
- **批量处理**：实现消息批处理机制，提高系统吞吐量

## 技术栈

### 前端
- React 18
- Vite
- Arco Design 组件库
- WebSocket API
- Web Worker
- Framer Motion 动画

### 后端
- Node.js
- WebSocket
- 令牌桶限流算法
- 异常投票检测

## 项目结构

```
realtime-vote/
├── realtime-vote-client/    # 前端应用
│   ├── src/
│   │   ├── components/      # 组件
│   │   │   ├── RankingCard.jsx
│   │   │   └── VoteItem.jsx
│   │   ├── pages/           # 页面
│   │   │   └── Dashboard.jsx
│   │   ├── workers/         # Web Worker
│   │   │   └── voteProcessor.worker.js
│   │   └── App.jsx          # 主应用
│   ├── package.json
│   └── vite.config.js
├── realtime-vote-server/    # 后端服务
│   ├── server.js            # 主服务器文件
│   └── package.json
├── load-test.js             # 负载测试脚本
├── test-anomaly-detection.js # 异常检测测试脚本
└── readme.md                # 项目文档
```

## 核心功能

### 1. 实时投票
- 支持多选投票
- 实时更新投票结果
- 投票成功反馈

### 2. 异常投票检测
- 投票频率检测
- 时间窗口内投票次数限制
- 可疑投票模式识别（如全选）
- 重复投票检测
- 可疑客户端标记

### 3. 限流保护
- 令牌桶限流算法
- 支持 1000+ 并发连接
- 限流状态监控

### 4. 数据可视化
- 实时排名展示
- 投票比例可视化
- 数据大屏展示
- 动态图表动画

### 5. 性能优化
- Web Worker 数据处理
- 消息批处理机制
- 组件懒加载
- 虚拟滚动支持

## 安装步骤

### 1. 克隆项目
```bash
git clone <repository-url>
cd realtime-vote
```

### 2. 安装后端依赖
```bash
cd realtime-vote-server
npm install
```

### 3. 安装前端依赖
```bash
cd ../realtime-vote-client
npm install
```

## 运行步骤

### 1. 启动后端服务
```bash
cd realtime-vote-server
node server.js
```

后端服务将在以下地址运行：
- REST API: http://localhost:4000
- WebSocket: ws://localhost:4000

### 2. 启动前端开发服务器
```bash
cd realtime-vote-client
npm run dev
```

前端应用将在 http://localhost:5173 启动

## API 接口

### REST API
- `GET /poll` - 获取当前投票数据
- `GET /rate-limit/status` - 获取限流状态
- `GET /anomaly-detection/stats` - 获取异常检测统计
- `GET /anomaly-detection/records` - 获取异常投票记录
- `GET /debug/vote-history` - 获取投票历史（仅用于调试）

### WebSocket 事件
- `init` - 初始化数据
- `update` - 投票数据更新
- `vote` - 发送投票
- `error` - 错误消息

## 负载测试

运行负载测试脚本：
```bash
node load-test.js
```

测试结果将保存在 `load-test-results.json` 文件中

## 异常检测测试

运行异常检测测试脚本：
```bash
node test-anomaly-detection.js
```

## 项目功能说明

### 投票流程
1. 客户端连接到 WebSocket 服务器
2. 服务器发送初始投票数据
3. 用户选择投票选项并提交
4. 客户端发送投票请求
5. 服务器进行异常检测和限流检查
6. 服务器更新投票数据并广播给所有客户端
7. 客户端实时更新投票结果

### 异常检测机制
- **投票频率检测**：检测同一客户端的投票间隔
- **时间窗口限制**：限制同一窗口内的投票次数
- **投票模式识别**：识别全选的异常投票
- **重复投票检测**：检测重复的投票选择
- **可疑客户端标记**：标记异常投票行为频繁的客户端

### 限流机制
- 使用令牌桶算法实现限流
- 桶容量：1000
- 令牌生成速率：1000 个/秒
- 超过限制的请求将被拒绝

## 开发说明

### 前端开发

主要组件：
- `VoteItem` - 投票选项组件
- `RankingCard` - 排名卡片组件
- `Dashboard` - 数据大屏页面

### 后端开发

主要模块：
- `AnomalyDetector` - 异常投票检测系统
- `TokenBucket` - 令牌桶限流实现
- `WebSocketServer` - WebSocket 服务器

## 下一步

1. **增加水平扩展**：使用负载均衡器扩展多个 WebSocket 服务器
2. **添加数据持久化**：将投票数据存储到数据库中
3. **优化异常检测算法**：使用机器学习模型提高异常检测准确率
4. **实现客户端重连机制**：增强客户端容错能力
5. **添加监控系统**：实时监控服务器性能和异常情况

## 浏览器兼容性

- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 作者

该项目由 React 学习过程中开发，用于演示 WebSocket 实时应用开发。

---

**实时投票系统** - 数据实时更新，技术驱动未来！