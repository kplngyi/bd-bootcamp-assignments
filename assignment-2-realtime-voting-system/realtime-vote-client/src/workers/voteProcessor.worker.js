// Web Worker for processing vote data
self.onmessage = function(e) {
  const { poll } = e.data;
  
  if (!poll || !poll.options) {
    self.postMessage(null);
    return;
  }
  
  // 计算总票数
  const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
  
  // 计算每个选项的百分比
  const processedOptions = poll.options.map(opt => ({
    ...opt,
    percentage: totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0
  }));
  
  // 排序（按票数降序）
  processedOptions.sort((a, b) => b.votes - a.votes);
  
  // 添加排名
  const rankedOptions = processedOptions.map((opt, index) => ({
    ...opt,
    rank: index + 1
  }));
  
  // 返回处理后的数据
  self.postMessage({
    ...poll,
    options: rankedOptions,
    totalVotes,
    updatedAt: Date.now()
  });
};
