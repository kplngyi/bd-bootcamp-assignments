// 异常投票检测测试脚本
const WebSocket = require('ws');

// 配置参数
const TEST_CONFIG = {
  SERVER_URL: 'ws://localhost:4000',
  TEST_CLIENTS: [
    {
      name: '正常用户',
      votes: [
        { optionIds: ['1'], delay: 2000 },
        { optionIds: ['2'], delay: 3000 },
        { optionIds: ['3'], delay: 4000 }
      ]
    },
    {
      name: '频繁投票用户',
      votes: [
        { optionIds: ['1'], delay: 0 },
        { optionIds: ['1'], delay: 500 },  // 间隔小于1秒
        { optionIds: ['1'], delay: 500 },  // 间隔小于1秒
        { optionIds: ['1'], delay: 500 }   // 间隔小于1秒
      ]
    },
    {
      name: '重复投票用户',
      votes: [
        { optionIds: ['1', '2'], delay: 1000 },
        { optionIds: ['1', '2'], delay: 2000 },  // 相同选项
        { optionIds: ['1', '2'], delay: 3000 },  // 相同选项
        { optionIds: ['1', '2'], delay: 4000 }   // 相同选项
      ]
    },
    {
      name: '全选投票用户',
      votes: [
        { optionIds: ['1', '2', '3'], delay: 1000 },  // 全选
        { optionIds: ['1', '2', '3'], delay: 2000 },  // 全选
        { optionIds: ['1', '2', '3'], delay: 3000 }   // 全选
      ]
    },
    {
      name: '短时间内多次投票用户',
      votes: [
        { optionIds: ['1'], delay: 1000 },
        { optionIds: ['2'], delay: 1000 },
        { optionIds: ['3'], delay: 1000 },
        { optionIds: ['1'], delay: 1000 },
        { optionIds: ['2'], delay: 1000 },
        { optionIds: ['3'], delay: 1000 },
        { optionIds: ['1'], delay: 1000 }  // 超过5次/分钟
      ]
    }
  ]
};

// 测试结果记录
const testResults = [];

// 运行单个客户端测试
async function runClientTest(clientConfig) {
  const results = {
    name: clientConfig.name,
    totalVotes: clientConfig.votes.length,
    successfulVotes: 0,
    failedVotes: 0,
    errors: []
  };
  
  return new Promise((resolve) => {
    const ws = new WebSocket(TEST_CONFIG.SERVER_URL);
    
    ws.on('open', () => {
      console.log(`[${clientConfig.name}] 连接已建立`);
      
      // 执行投票序列
      let voteIndex = 0;
      
      const executeNextVote = () => {
        if (voteIndex >= clientConfig.votes.length) {
          // 所有投票完成
          setTimeout(() => {
            ws.close();
            testResults.push(results);
            resolve();
          }, 1000);
          return;
        }
        
        const vote = clientConfig.votes[voteIndex];
        
        // 发送投票
        ws.send(JSON.stringify({
          type: 'vote',
          optionIds: vote.optionIds
        }));
        
        console.log(`[${clientConfig.name}] 发送投票: ${vote.optionIds}`);
        
        voteIndex++;
        
        // 延迟执行下一次投票
        setTimeout(executeNextVote, vote.delay);
      };
      
      // 开始执行投票序列
      executeNextVote();
    });
    
    // 处理服务器响应
    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      
      if (msg.type === 'error') {
        results.failedVotes++;
        results.errors.push({
          voteIndex: results.successfulVotes + results.failedVotes,
          error: msg.message,
          anomalyDetails: msg.anomalyDetails
        });
        console.log(`[${clientConfig.name}] 投票失败: ${msg.message}`);
        if (msg.anomalyDetails) {
          console.log(`[${clientConfig.name}] 异常详情: ${msg.anomalyDetails.join(', ')}`);
        }
      } else if (msg.type === 'update') {
        results.successfulVotes++;
        console.log(`[${clientConfig.name}] 投票成功`);
      }
    });
    
    ws.on('close', () => {
      console.log(`[${clientConfig.name}] 连接已关闭`);
    });
    
    ws.on('error', (error) => {
      console.error(`[${clientConfig.name}] 连接错误:`, error);
    });
  });
}

// 运行所有测试
async function runAllTests() {
  console.log('开始异常投票检测测试...');
  console.log('=' .repeat(50));
  
  // 依次运行每个客户端测试
  for (const clientConfig of TEST_CONFIG.TEST_CLIENTS) {
    console.log(`\n运行测试: ${clientConfig.name}`);
    console.log('-'.repeat(30));
    await runClientTest(clientConfig);
  }
  
  // 输出测试结果
  console.log('\n' + '=' .repeat(50));
  console.log('测试完成，结果汇总:');
  console.log('-' .repeat(50));
  
  testResults.forEach(result => {
    console.log(`\n用户类型: ${result.name}`);
    console.log(`总投票数: ${result.totalVotes}`);
    console.log(`成功投票: ${result.successfulVotes}`);
    console.log(`失败投票: ${result.failedVotes}`);
    console.log(`成功率: ${((result.successfulVotes / result.totalVotes) * 100).toFixed(2)}%`);
    
    if (result.errors.length > 0) {
      console.log('失败详情:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. 投票#${error.voteIndex}: ${error.error}`);
        if (error.anomalyDetails) {
          console.log(`     异常类型: ${error.anomalyDetails.join(', ')}`);
        }
      });
    }
  });
  
  // 获取异常检测统计信息
  console.log('\n' + '-' .repeat(50));
  console.log('服务器异常检测统计:');
  
  const http = require('http');
  http.get('http://localhost:4000/anomaly-detection/stats', (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const stats = JSON.parse(data);
        console.log(`总客户端数: ${stats.totalClients}`);
        console.log(`可疑客户端数: ${stats.suspiciousClients}`);
        console.log('检测配置:');
        console.log(`  时间窗口: ${stats.config.timeWindow / 1000}秒`);
        console.log(`  窗口内最大投票数: ${stats.config.maxVotesPerWindow}`);
        console.log(`  最小投票间隔: ${stats.config.minVoteInterval}毫秒`);
        console.log(`  全选检测阈值: ${(stats.config.allOptionsThreshold * 100)}%`);
        console.log(`  可疑客户端阈值: ${stats.config.suspiciousVoteThreshold}次异常`);
      } catch (error) {
        console.error('解析统计信息失败:', error);
      }
    });
  }).on('error', (error) => {
    console.error('获取统计信息失败:', error);
  });
}

// 启动测试
runAllTests();
