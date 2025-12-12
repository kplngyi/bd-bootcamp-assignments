import React from 'react'
import { Card, Rate, Tag } from 'antd'

export default function ProductCard({ product }) {
  return (
    <Card
      hoverable
      className="product-card"
      bodyStyle={{ padding: 12 }}
      cover={<img alt={product.title} src={product.image} />}
    >
      <div style={{ minHeight: 52 }}>
        <Card.Meta title={<div style={{ fontWeight: 600, fontSize: 14, lineHeight: '18px', height: 36, overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.title}</div>} description={<div style={{ marginTop: 6 }}><Tag color="blue">{product.category}</Tag></div>} />
      </div>
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#fa541c', fontWeight: 700, fontSize: 16 }}>¥{product.price}</div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>销量 {product.sales || 0}</div>
          <Rate disabled allowHalf defaultValue={product.rating || 0} style={{ fontSize: 12 }} />
        </div>
      </div>
    </Card>
  )
}
