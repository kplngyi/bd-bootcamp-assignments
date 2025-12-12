// src/components/RankingCard.jsx
import React from "react";
import { Card, Statistic } from "@arco-design/web-react";
import { motion, AnimatePresence } from "framer-motion";
import VoteItem from "./VoteItem";

export default function RankingCard({ poll, isEditable = true, selected = [], toggleOption = () => {} }) {
  const sorted = poll.options.slice().sort((a, b) => b.votes - a.votes);
  
  // 计算总票数
  const totalVotes = sorted.reduce((sum, opt) => sum + opt.votes, 0);

  return (
    <Card
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>实时排名</span>
          {/* <Statistic title="总票数" value={totalVotes} valueStyle={{ color: "#165dff", fontSize: 16 }} titleStyle={{ fontSize: 14 }} prefix="📊" /> */}
        </div>
      }
      style={{
        maxWidth: "100%",
        margin: 0,
        borderRadius: 12,
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
        backgroundColor: "white"
      }}
      extra={totalVotes > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ fontSize: 12, color: "#666" }}
        >
          数据实时更新中...
        </motion.div>
      ) : null}
    >
      <AnimatePresence>
        {sorted.map((opt, index) => (
          <motion.div key={opt.id} layout>
            <VoteItem
              opt={opt}
              index={index}
              selected={selected}
              toggleOption={toggleOption}
              isEditable={isEditable}
              totalVotes={totalVotes}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      
      {totalVotes === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#999",
            fontSize: 16
          }}
        >
          📝 暂无投票数据，等待用户参与...
        </motion.div>
      )}
    </Card>
  );
}