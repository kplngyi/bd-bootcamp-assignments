const express = require("express");
const cors = require("cors");
const { WebSocketServer } = require("ws");
const http = require("http");

const app = express();
app.use(cors());
app.use(express.json());

// 单个投票主题
let poll = {
  id: "poll-1",
  question: "你最喜欢的语言？",
  options: [
    { id: "1", text: "JavaScript", votes: 0 },
    { id: "2", text: "Python", votes: 0 },
    { id: "3", text: "Go", votes: 0 },
  ],
};

// 令牌桶限流算法实现
class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity; // 桶容量
    this.refillRate = refillRate; // 每秒补充令牌数
    this.tokens = capacity; // 当前令牌数
    this.lastRefillTime = Date.now(); // 上次补充时间
  }

  // 尝试获取令牌
  tryAcquire(tokens = 1) {
    // 补充令牌
    this.refill();
    
    // 检查是否有足够的令牌
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }

  // 补充令牌
  refill() {
    const now = Date.now();
    const timeElapsed = now - this.lastRefillTime;
    
    // 计算应补充的令牌数
    const tokensToAdd = Math.floor((timeElapsed / 1000) * this.refillRate);
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefillTime = now;
    }
  }
}

// 创建限流实例 - 支持1000+并发
const voteLimiter = new TokenBucket(1000, 1000); // 桶容量1000，每秒补充1000个令牌

app.get("/poll", (req, res) => {
  res.json(poll);
});

const server = http.createServer(app);

server.listen(4000, () =>
  console.log("REST 服务已启动 http://localhost:4000")
);

// 异常投票检测系统
class AnomalyDetector {
  constructor() {
    // 客户端投票历史记录: { clientId: { votes: [], lastVoteTime: Date } }
    this.clientVotes = new Map();
    
    // 配置参数
    this.config = {
      // 时间窗口（毫秒）
      timeWindow: 60000, // 1分钟
      // 同一窗口内允许的最大投票次数
      maxVotesPerWindow: 5,
      // 每次投票的最小间隔（毫秒）
      minVoteInterval: 1000, // 1秒
      // 检测全选投票的阈值
      allOptionsThreshold: 0.8, // 80%以上选项都被选视为异常
      // 可疑客户端标记阈值
      suspiciousVoteThreshold: 3 // 超过3次异常投票标记为可疑客户端
    };
    
    // 可疑客户端列表
    this.suspiciousClients = new Set();
    // 异常投票记录
    this.anomalyRecords = [];
  }
  
  // 生成客户端唯一标识符
  generateClientId(ws) {
    // 安全获取客户端地址和端口
    let clientId = 'unknown';
    try {
      if (ws._socket) {
        clientId = (ws._socket.remoteAddress || 'unknown') + ':' + (ws._socket.remotePort || 'unknown');
      } else {
        // 如果_socket不可用，生成一个随机ID
        clientId = 'random-' + Math.random().toString(36).substring(2, 15);
      }
    } catch (error) {
      console.error('生成客户端ID时出错:', error);
      clientId = 'error-' + Math.random().toString(36).substring(2, 15);
    }
    return clientId;
  }
  
  // 检测异常投票
  detectAnomaly(clientId, optionIds, timestamp = Date.now()) {
    const anomalies = [];
    const clientHistory = this.clientVotes.get(clientId) || { votes: [], lastVoteTime: null, anomalyCount: 0 };
    
    // 1. 检查投票频率（最小间隔）
    if (clientHistory.lastVoteTime && (timestamp - clientHistory.lastVoteTime) < this.config.minVoteInterval) {
      anomalies.push('vote_too_frequent');
    }
    
    // 2. 检查时间窗口内的投票次数
    const windowStart = timestamp - this.config.timeWindow;
    const recentVotes = clientHistory.votes.filter(vote => vote.timestamp >= windowStart);
    
    if (recentVotes.length >= this.config.maxVotesPerWindow) {
      anomalies.push('excessive_votes_in_window');
    }
    
    // 3. 检查投票模式（是否全选或接近全选）
    const allOptionsCount = poll.options.length;
    const selectedCount = optionIds.length;
    const selectionRatio = selectedCount / allOptionsCount;
    
    if (selectionRatio >= this.config.allOptionsThreshold) {
      anomalies.push('suspicious_selection_pattern');
    }
    
    // 4. 检查是否为重复投票（与上次投票完全相同）
    if (recentVotes.length > 0) {
      const lastVote = recentVotes[recentVotes.length - 1];
      const isDuplicate = JSON.stringify(lastVote.optionIds.sort()) === JSON.stringify(optionIds.sort());
      
      if (isDuplicate) {
        anomalies.push('duplicate_vote');
      }
    }
    
    // 更新客户端历史
    clientHistory.votes.push({ timestamp, optionIds });
    clientHistory.lastVoteTime = timestamp;
    
    // 清理过期的投票记录
    clientHistory.votes = clientHistory.votes.filter(vote => vote.timestamp >= windowStart);
    
    // 更新异常计数
    if (anomalies.length > 0) {
      clientHistory.anomalyCount = (clientHistory.anomalyCount || 0) + 1;
      
      // 记录详细的异常信息
      this.anomalyRecords.push({
        clientId,
        timestamp,
        optionIds,
        anomalies,
        clientHistory: {
          voteCount: clientHistory.votes.length,
          anomalyCount: clientHistory.anomalyCount
        }
      });
      
      // 如果超过阈值，标记为可疑客户端
      if (clientHistory.anomalyCount >= this.config.suspiciousVoteThreshold) {
        this.suspiciousClients.add(clientId);
      }
    }
    
    this.clientVotes.set(clientId, clientHistory);
    
    return {
      isAnomaly: anomalies.length > 0,
      anomalies,
      isSuspicious: this.suspiciousClients.has(clientId),
      clientHistory
    };
  }
  
  // 获取异常检测统计信息
  getStats() {
    return {
      totalClients: this.clientVotes.size,
      suspiciousClients: this.suspiciousClients.size,
      totalAnomalies: this.anomalyRecords.length,
      recentAnomalies: this.anomalyRecords.slice(-10), // 最近10条异常记录
      config: this.config
    };
  }
  
  // 获取详细的异常投票记录
  getAnomalyRecords(limit = 20) {
    return this.anomalyRecords.slice(-limit).reverse(); // 返回最近的记录，按时间倒序
  }
}

// 创建异常检测器实例
const anomalyDetector = new AnomalyDetector();

// --- WebSocket ---
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  const clientId = anomalyDetector.generateClientId(ws);
  console.log(`客户端已连接: ${clientId}`);
  
  // 初始数据发送给客户端
  ws.send(JSON.stringify({ type: "init", poll }));

  // 接收客户端投票
  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    if (data.type === "vote") {
      // 1. 异常投票检测
      const detectionResult = anomalyDetector.detectAnomaly(clientId, data.optionIds);
      
      // 如果是异常投票或可疑客户端，拒绝投票
      if (detectionResult.isAnomaly || detectionResult.isSuspicious) {
        let errorMessage = "投票异常";
        
        if (detectionResult.isSuspicious) {
          errorMessage = "您的投票行为异常，已被限制投票";
        } else if (detectionResult.anomalies.includes('vote_too_frequent')) {
          errorMessage = "投票过于频繁，请稍后再试";
        } else if (detectionResult.anomalies.includes('excessive_votes_in_window')) {
          errorMessage = "短时间内投票次数过多，请稍后再试";
        } else if (detectionResult.anomalies.includes('suspicious_selection_pattern')) {
          errorMessage = "投票模式异常，请检查您的选择";
        } else if (detectionResult.anomalies.includes('duplicate_vote')) {
          errorMessage = "请勿重复提交相同的投票";
        }
        
        ws.send(JSON.stringify({ 
          type: "error", 
          message: errorMessage,
          anomalyDetails: detectionResult.anomalies
        }));
        
        console.log(`异常投票被拒绝 - 客户端: ${clientId}, 异常类型: ${detectionResult.anomalies.join(', ')}`);
        return;
      }
      
      // 2. 使用限流算法
      if (voteLimiter.tryAcquire()) {
        data.optionIds.forEach((id) => {
          const opt = poll.options.find((o) => o.id === id);
          if (opt) opt.votes++;
        });

        // 广播新的投票数据
        wss.clients.forEach((client) =>
          client.send(JSON.stringify({ type: "update", poll }))
        );
      } else {
        // 限流提示
        ws.send(JSON.stringify({ type: "error", message: "请求过于频繁，请稍后再试" }));
      }
    }
  });

  ws.on("close", () => {
    console.log(`客户端已断开连接: ${clientId}`);
  });
});

// 增加限流状态监控接口
app.get("/rate-limit/status", (req, res) => {
  res.json({
    capacity: voteLimiter.capacity,
    tokens: voteLimiter.tokens,
    refillRate: voteLimiter.refillRate
  });
});

// 增加异常检测统计接口
app.get("/anomaly-detection/stats", (req, res) => {
  res.json(anomalyDetector.getStats());
});

// 增加异常投票记录接口
app.get("/anomaly-detection/records", (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  res.json(anomalyDetector.getAnomalyRecords(limit));
});

// 增加投票历史查询接口（仅用于调试）
app.get("/debug/vote-history", (req, res) => {
  res.json(Array.from(anomalyDetector.clientVotes.entries()).map(([clientId, history]) => ({
    clientId,
    voteCount: history.votes.length,
    lastVoteTime: history.lastVoteTime,
    anomalyCount: history.anomalyCount || 0
  })));
});