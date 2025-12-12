import React, { useState, useEffect, useMemo } from 'react'
import { Input, Select, Row, Col, Button, Space } from 'antd'
import debounce from 'lodash.debounce'

const { Option } = Select

export default function Filters({ value = {}, onChange }) {
  const [local, setLocal] = useState(value)

  useEffect(() => setLocal(value), [value])

  const debouncedChange = useMemo(() => debounce(onChange, 450), [onChange])

  function handleChange(ch) {
    const next = { ...local, ...ch }
    setLocal(next)
    debouncedChange(next)
  }

  function handleReset() {
    const reset = { keyword: '', category: 'all', minPrice: null, maxPrice: null }
    setLocal(reset)
    onChange(reset)
  }

  return (
    <div className="controls-row">
      <Row gutter={12} align="middle">
        <Col xs={24} sm={10} md={8} lg={7} xl={6}>
          <Input
            placeholder="搜索商品，例如：手机"
            value={local.keyword}
            onChange={(e) => handleChange({ keyword: e.target.value })}
          />
        </Col>
        <Col xs={12} sm={6} md={4} lg={3} xl={2}>
          <Select value={local.category} onChange={(v) => handleChange({ category: v })} style={{ width: '100%' }}>
            <Option value="all">全部</Option>
            <Option value="手机">手机</Option>
            <Option value="电脑">电脑</Option>
            <Option value="数码">数码</Option>
            <Option value="家电">家电</Option>
            <Option value="家具">家具</Option>
            <Option value="服饰">服饰</Option>
          </Select>
        </Col>
        <Col xs={12} sm={6} md={4} lg={3} xl={2}>
          <Space>
            <Input
              placeholder="最低"
              value={local.minPrice || ''}
              onChange={(e) => handleChange({ minPrice: e.target.value ? Number(e.target.value) : null })}
              style={{ width: 90 }}
            />
            <Input
              placeholder="最高"
              value={local.maxPrice || ''}
              onChange={(e) => handleChange({ maxPrice: e.target.value ? Number(e.target.value) : null })}
              style={{ width: 90 }}
            />
          </Space>
        </Col>
        <Col xs={24} sm={6} md={8} lg={11} xl={12} style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Col>
      </Row>
    </div>
  )
}
