import { motion } from "framer-motion";
import { Checkbox, Tag } from "@arco-design/web-react";

export default function VoteItem({ opt, index, selected, toggleOption, isEditable = true, totalVotes = 0 }) {
  // 计算投票百分比
  const percentage = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;
  
  // 根据排名设置不同的样式
  const getRankStyle = () => {
    switch (index) {
      case 0: // 第一名
        return {
          background: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
          border: "2px solid #ffd700",
          boxShadow: "0 4px 15px rgba(255, 215, 0, 0.3)"
        };
      case 1: // 第二名
        return {
          background: "linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)",
          border: "2px solid #c0c0c0",
          boxShadow: "0 4px 15px rgba(192, 192, 192, 0.3)"
        };
      case 2: // 第三名
        return {
          background: "linear-gradient(135deg, #cd7f32 0%, #e6b886 100%)",
          border: "2px solid #cd7f32",
          boxShadow: "0 4px 15px rgba(205, 127, 50, 0.3)"
        };
      default: // 其他名次
        return {
          background: "linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)",
          border: "1px solid #e5e6eb",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)"
        };
    }
  };

  // 根据排名设置不同的颜色
  const getRankTextColor = () => {
    switch (index) {
      case 0: return "#b8860b"; // 金色
      case 1: return "#666666"; // 银色
      case 2: return "#8b4513"; // 铜色
      default: return "#333333";
    }
  };

  // 排名图标
  const getRankIcon = () => {
    switch (index) {
      case 0: return "🏆"; // 皇冠
      case 1: return "🥈"; // 银牌
      case 2: return "🥉"; // 铜牌
      default: return `${index + 1}️⃣`;
    }
  };

  return (
    <motion.div
      layout                // ⭐ 自动执行位置动画
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      onClick={() => isEditable && toggleOption(opt.id)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "15px 20px",
        borderRadius: 12,
        marginBottom: 15,
        cursor: isEditable ? "pointer" : "default",
        ...getRankStyle(),
        transition: "all 0.3s ease"
      }}
      whileHover={isEditable ? { scale: 1.02 } : {}}
    >
      {/* 复选框 - 仅在可编辑状态显示 */}
      {isEditable && <Checkbox checked={selected.includes(opt.id)} style={{ fontSize: 16 }} />}

      {/* 左侧内容 */}
      <div style={{ flex: 1, marginLeft: isEditable ? 15 : 0, display: "flex", alignItems: "center" }}>
        {/* 排名 */}
        <motion.span
          style={{ fontSize: 20, fontWeight: "bold", marginRight: 10, color: getRankTextColor() }}
          animate={index < 3 ? { scale: [1, 1.1, 1] } : {}}
          transition={index < 3 ? { duration: 1, repeat: Infinity, repeatDelay: 2 } : {}}
        >
          {getRankIcon()}
        </motion.span>

        {/* 文本 */}
        <motion.span
          style={{ flex: 1, fontSize: 16, fontWeight: index < 3 ? "bold" : "normal", color: getRankTextColor() }}
        >
          {opt.text}
        </motion.span>
      </div>

      {/* 右侧内容 */}
      <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
        {/* 票数 Tag */}
        <Tag
          color={index < 3 ? "gold" : "arcoblue"}
          style={{ 
            fontSize: 14, 
            fontWeight: "bold",
            padding: "5px 12px",
            borderRadius: 20,
            backgroundColor: index < 3 ? "rgba(255, 255, 255, 0.9)" : undefined
          }}
        >
          {opt.votes} 票
        </Tag>

        {/* 投票比例进度条 */}
        {!isEditable && percentage > 0 && (
          <div style={{ width: 100, height: 12, backgroundColor: "rgba(255, 255, 255, 0.3)", borderRadius: 6, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.6 }}
              style={{
                height: "100%",
                backgroundColor: index < 3 ? "rgba(255, 255, 255, 0.8)" : "#165dff",
                borderRadius: 6
              }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}