const WebSocket = require('ws');
const fs = require('fs');

// 测试配置
const TOTAL_CLIENTS = 2000; // 总客户端数（超过限流阈值）
const CLIENTS_PER_BATCH = 200; // 每批连接数
const BATCH_INTERVAL = 50; // 批处理间隔（毫秒）

// 测试结果
const results = {
  success: 0,
  failed: 0,
  errors: [],
  startTime: Date.now()
};

// 连接客户端
function connectClient(clientId) {
  return new Promise((resolve) => {
    const ws = new WebSocket('ws://localhost:4000');
    let receivedMessage = false;
    let voteSent = false;
    
    ws.on('open', () => {
      // console.log(`Client ${clientId} connected`);
    });
    
    ws.on('message', (data) => {
      // console.log(`Client ${clientId} received: ${data}`);
      const msg = JSON.parse(data);
      
      // 如果是初始化消息，发送投票请求
      if (msg.type === 'init') {
        // 发送投票请求
        ws.send(JSON.stringify({
          type: 'vote',
          optionIds: ['1'] // 随机选择一个选项
        }));
        voteSent = true;
        return;
      }
      
      // 处理后续消息（update或error）
      if (receivedMessage) return;
      receivedMessage = true;
      
      if (msg.type === 'update') {
        results.success++;
      } else if (msg.type === 'error') {
        results.failed++;
        results.errors.push(msg.message);
      } else {
        results.failed++;
        results.errors.push(`Unexpected message type: ${msg.type}`);
      }
      
      setTimeout(() => {
        ws.close();
        resolve();
      }, 10);
    });
    
    ws.on('close', () => {
      // 如果没有收到消息或发送投票就关闭了
      if (!receivedMessage && voteSent) {
        results.failed++;
        results.errors.push('Connection closed without response');
      }
      resolve();
    });
    
    ws.on('error', (error) => {
      // console.error(`Client ${clientId} error:`, error.message);
      if (!receivedMessage) {
        results.failed++;
        results.errors.push(error.message);
      }
      resolve();
    });
  });
}

// 批量连接客户端
async function runTest() {
  console.log(`开始测试：模拟 ${TOTAL_CLIENTS} 个并发投票请求...`);
  
  for (let i = 0; i < TOTAL_CLIENTS; i += CLIENTS_PER_BATCH) {
    const batchSize = Math.min(CLIENTS_PER_BATCH, TOTAL_CLIENTS - i);
    const promises = [];
    
    for (let j = 0; j < batchSize; j++) {
      promises.push(connectClient(i + j));
    }
    
    await Promise.all(promises);
    console.log(`已处理 ${Math.min(i + batchSize, TOTAL_CLIENTS)} / ${TOTAL_CLIENTS} 个请求`);
    
    if (i + batchSize < TOTAL_CLIENTS) {
      await new Promise(resolve => setTimeout(resolve, BATCH_INTERVAL));
    }
  }
  
  // 输出测试结果
  results.endTime = Date.now();
  results.duration = results.endTime - results.startTime;
  
  console.log('\n=== 测试结果 ===');
  console.log(`总请求数：${TOTAL_CLIENTS}`);
  console.log(`成功请求数：${results.success}`);
  console.log(`失败请求数：${results.failed}`);
  console.log(`成功率：${((results.success / TOTAL_CLIENTS) * 100).toFixed(2)}%`);
  console.log(`总耗时：${results.duration} 毫秒`);
  console.log(`平均处理时间：${(results.duration / TOTAL_CLIENTS).toFixed(2)} 毫秒/请求`);
  
  // 统计错误信息
  const errorStats = {};
  results.errors.forEach(err => {
    errorStats[err] = (errorStats[err] || 0) + 1;
  });
  
  console.log('\n错误分布：');
  for (const [err, count] of Object.entries(errorStats)) {
    console.log(`- ${err}：${count} 次`);
  }
  
  // 保存测试结果到文件
  const resultFile = 'load-test-results.json';
  fs.writeFileSync(resultFile, JSON.stringify(results, null, 2));
  console.log(`\n测试结果已保存到 ${resultFile}`);
}

// 运行测试
runTest().catch(console.error);