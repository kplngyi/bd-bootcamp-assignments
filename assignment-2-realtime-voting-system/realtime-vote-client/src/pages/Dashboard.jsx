import { Card, Statistic, Grid, Divider, Button } from "@arco-design/web-react";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";

const Row = Grid.Row;
const Col = Grid.Col;

export default function Dashboard({ poll, onBack }) {
  if (!poll) return null;

  const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);

  // 转换成图表格式
  const barData = poll.options.map((o) => ({
    name: o.text,
    votes: o.votes
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: 20 }}
    >
      {/* 顶部 KPi */}
      <Row gutter={20} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总票数" value={totalVotes} />
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <Statistic
              title="选项数量"
              value={poll.options.length}
            />
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <Statistic
              title="领先选项"
              value={poll.options.sort((a, b) => b.votes - a.votes)[0].text}
            />
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <Statistic title="更新时间" value={new Date().toLocaleTimeString()} />
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* 柱状图 - 当前票数 */}
      <Card title="当前投票分布（柱状图）" style={{ marginBottom: 20 }}>
        <BarChart width={900} height={350} data={barData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="votes" fill="#4c8fff" />
        </BarChart>
      </Card>

      <Divider />

      {/* 返回按钮 */}
      <div style={{ textAlign: "center", marginTop: 20 }}>
        <Button type="primary" size="large" onClick={onBack}>
          返回投票页面
        </Button>
      </div>
    </motion.div>
  );
}