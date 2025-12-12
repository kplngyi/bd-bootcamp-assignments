import React, { useEffect } from 'react'
import { Layout, Typography } from 'antd'
import ProductList from './components/ProductList'
import Recommendations from './components/Recommendations'
import { useDispatch, useSelector } from 'react-redux'
import { loadProducts } from './features/products/productsSlice'

const { Header, Content } = Layout

export default function App() {
  const dispatch = useDispatch()
  const { filters, sort, page, pageSize } = useSelector((s) => s.products)

  useEffect(() => {
    dispatch(loadProducts({ filters, sort, page, pageSize }))
  }, [dispatch, filters, sort, page, pageSize])

  return (
    <Layout>
      <Header style={{ color: 'white' }}>
        <Typography.Title level={3} style={{ color: '#fff', margin: 0 }}>
          电商商品列表 Demo
        </Typography.Title>
      </Header>
      <Content style={{ padding: 24 }}>
        <Recommendations />
        <ProductList />
      </Content>
    </Layout>
  )
}
