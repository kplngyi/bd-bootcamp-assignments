import React, { useEffect, useState } from 'react'
import { Card, Row, Col } from 'antd'
import { fetchRecommendations } from '../api/mockApi'

export default function Recommendations() {
  const [items, setItems] = useState([])

  useEffect(() => {
    let mounted = true
    fetchRecommendations(6).then((res) => {
      if (mounted) setItems(res)
    })
    return () => (mounted = false)
  }, [])

  return (
    <div className="recommendations">
      <h3 style={{ marginBottom: 12 }}>猜你喜欢</h3>
      <Row gutter={[0, 0]}>
        {items.map((p) => (
          <Col key={p.id}>
            <Card size="small" className="recommend-card" cover={<img alt={p.title} src={p.image} style={{ height: 'var(--recommend-img-height)', objectFit: 'cover' }} />}>
              <Card.Meta title={<div style={{ fontSize: 13, fontWeight: 600 }}>{p.title}</div>} description={<div style={{ color: '#fa541c', fontWeight: 700 }}>¥{p.price}</div>} />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
