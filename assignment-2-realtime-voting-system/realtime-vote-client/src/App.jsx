import { useEffect, useState, useRef, useCallback } from "react";
import {
  Card,
  Checkbox,
  Button,
  Tag,
  Divider,
  Message,
  Spin,
  Space,
  Typography,
  Statistic,
} from "@arco-design/web-react";

import '@arco-design/web-react/dist/css/arco.css';
import { motion, AnimatePresence } from "framer-motion";
import RankingCard from "./components/RankingCard";
import Dashboard from "./pages/Dashboard";

const { Title, Text } = Typography;

export default function App() {
  const [poll, setPoll] = useState(null);
  const [processedPoll, setProcessedPoll] = useState(null);
  const [selected, setSelected] = useState([]);
  const [viewMode, setViewMode] = useState('vote'); // 'vote' 或 'dashboard'
  const wsRef = useRef(null);
  const workerRef = useRef(null);
  const messageQueueRef = useRef([]);
  const batchTimerRef = useRef(null);
  const batchInterval = 100; // 批处理间隔（毫秒）

  // 获取初始 poll 数据
  useEffect(() => {
    fetch("http://localhost:4000/poll")
      .then((r) => r.json())
      .then(setPoll);
  }, []);

  // 初始化 Web Worker
  useEffect(() => {
    // 创建 Web Worker
    workerRef.current = new Worker(new URL('./workers/voteProcessor.worker.js', import.meta.url));
    
    // 处理 Worker 返回的结果
    workerRef.current.onmessage = (e) => {
      if (e.data) {
        setProcessedPoll(e.data);
      }
    };
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // 建立 WebSocket 连接
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:4000");
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "init" || msg.type === "update") {
        // 将消息加入队列
        messageQueueRef.current.push(msg.poll);
        
        // 如果没有定时器，创建一个
        if (!batchTimerRef.current) {
          batchTimerRef.current = setTimeout(() => {
            // 处理批量消息
            processBatchMessages();
          }, batchInterval);
        }
      } else if (msg.type === "error") {
        Message.error(msg.message);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
      
      // 清除定时器
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
        batchTimerRef.current = null;
      }
    };
  }, []);

  // 处理批量消息
  const processBatchMessages = useCallback(() => {
    // 获取队列中的所有消息
    const messages = [...messageQueueRef.current];
    
    // 清空队列
    messageQueueRef.current = [];
    
    // 清除定时器
    clearTimeout(batchTimerRef.current);
    batchTimerRef.current = null;
    
    // 如果没有消息，直接返回
    if (messages.length === 0) {
      return;
    }
    
    // 获取最新的消息（最后一条）
    const latestPoll = messages[messages.length - 1];
    
    // 更新原始 poll 状态
    setPoll(latestPoll);
    
    // 发送到 Web Worker 处理
    if (workerRef.current) {
      workerRef.current.postMessage({ poll: latestPoll });
    }
  }, []);

  if (!poll || !processedPoll) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",   // 水平居中
          alignItems: "center",       // 垂直居中
          height: "100vh",            // 占满整个屏幕高度
        }}
      >
        <Spin tip="加载中..." size="large" />
      </div>
    );
  }

  const toggleOption = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  };



  const sendVote = () => {
    if (selected.length === 0) {
      Message.warning("请至少选择一个选项！");
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "vote", optionIds: selected }));
      setSelected([]);
      Message.success("投票成功！");
    } else {
      Message.error("连接已断开，请刷新页面重试！");
    }
  };

  // 计算总票数
  const totalVotes = poll?.options.reduce((sum, opt) => sum + opt.votes, 0) || 0;
  
  // 计算已选择的选项数
  const selectedCount = selected.length;

  return (
    <div style={{ 
      maxWidth: 1400, 
      margin: "50px auto", 
      padding: "0 20px",
      fontSize: 18 
    }}>
      {/* 主卡片 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card 
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <motion.span
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
              >
                📋
              </motion.span>
              <span>实时投票系统</span>
            </div>
          } 
            extra={
            <Button type="outline" onClick={() => setViewMode("dashboard")}>
              📊 查看数据大屏
            </Button>
          }
          bordered 
          hoverable 
          style={{ 
            marginBottom: 30, 
            padding: "20px 30px",
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.06)",
            backgroundColor: "#f8f9ff"
          }}
        >

          {/* 投票主题 */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 30 }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
            >
              <Title heading={2} style={{ margin: 0, color: "#607096ff", textAlign: "center" }}>{poll.question}</Title>
            </motion.div>
          </div>
          
          <Divider style={{ margin: "30px 0", borderColor: "#e0e7ff" }} />
          
          {/* 投票区域 */}
          <div style={{ 
            display: "flex", 
            gap: "25px", 
            flexWrap: "wrap",
            justifyContent: "center"
          }}>
            {/* 左侧投票区域 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ 
                flex: 1, 
                minWidth: 350,
                maxWidth: 600
              }}
            >
              <Card 
                title={
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>投票区</span>

                  </div>
                } 
                style={{
                  borderRadius: 12,
                  // boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
                  backgroundColor: "white"
                }}
              >
                <Divider style={{ margin: "15px 0", borderColor: "#f5f5f5" }} />
                
                {/* 投票选项 */}
                <AnimatePresence>
                  {poll.options.map((opt) => (
                    <motion.div
                      key={opt.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "15px 20px",
                        marginBottom: 15,
                        borderRadius: 8,
                        background: selected.includes(opt.id) ? "#e6f7ff" : "#fafafa",
                        cursor: "pointer",
                        border: selected.includes(opt.id) ? "1px solid #91d5ff" : "1px solid #e8e8e8",
                        transition: "all 0.2s ease"
                      }}
                      onClick={() => toggleOption(opt.id)}
                      whileHover={{ backgroundColor: selected.includes(opt.id) ? "#e6f7ff" : "#f0f0f0" }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <Checkbox 
                          checked={selected.includes(opt.id)} 
                          style={{ fontSize: 16 }}
                        />
                        <span style={{ flex: 1, marginLeft: 12, fontSize: 15 }}>{opt.text}</span>
                      </div>
                      <Tag color={opt.votes > 0 ? "arcoblue" : "gray"} style={{ fontSize: 13, fontWeight: "bold" }}>
                        {opt.votes} 票
                      </Tag>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* 提交按钮 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    type="primary"
                    size="large"
                    style={{ 
                      width: "100%", 
                      marginTop: 15,
                      height: 45,
                      fontSize: 16,
                      borderRadius: 8
                    }}
                    onClick={sendVote}
                    loading={false}
                  >
                    <Space>
                      {selectedCount > 0 ? "🚀" : "📤"}
                      提交投票 ({selectedCount}/{poll.options.length})
                    </Space>
                  </Button>
                </motion.div>
              </Card>
            </motion.div>
            
            {/* 右侧排名区域 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{ 
                flex: 1, 
                minWidth: 350,
                maxWidth: 600
              }}
            >
              {/* 实时排名卡片 - 不可编辑 */}
              <RankingCard poll={processedPoll || poll} isEditable={false} />
            </motion.div>
          </div>
        </Card>
      </motion.div>
      
      {/* 页脚 */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{
          textAlign: "center",
          marginTop: 40,
          padding: "20px",
          color: "#666",
          fontSize: 14
        }}
      >
        <Text type="secondary">
          实时投票系统 © {new Date().getFullYear()} | 数据实时更新 | WebSocket 技术支持
        </Text>
      </motion.footer>
    </div>
  );
}