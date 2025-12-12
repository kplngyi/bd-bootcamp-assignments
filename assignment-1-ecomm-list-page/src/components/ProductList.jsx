import React, { useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Select, Pagination, Skeleton } from 'antd'
import ProductCard from './ProductCard'
import Filters from './Filters'
import { setFilters, setSort, setPage, setPageSize, loadProducts } from '../features/products/productsSlice'
import { AutoSizer, Grid } from 'react-virtualized'

const { Option } = Select

export default function ProductList() {
  const dispatch = useDispatch()
  const { items, total, loading, filters, sort, page, pageSize } = useSelector((s) => s.products)
  const gridRef = useRef(null)

  function onFiltersChange(next) {
    dispatch(setFilters(next))
    dispatch(loadProducts({ filters: { ...filters, ...next }, sort, page: 1, pageSize }))
  }

  function onSortChange(v) {
    dispatch(setSort(v))
    dispatch(loadProducts({ filters, sort: v, page: 1, pageSize }))
  }

  function onPageChange(p, ps) {
    dispatch(setPage(p))
    dispatch(setPageSize(ps))
    dispatch(loadProducts({ filters, sort, page: p, pageSize: ps }))
    if (gridRef.current) gridRef.current.recomputeGridSize()
  }

  const CARD_WIDTH = 320
  const CARD_HEIGHT = 320

    const cellRenderer = ({ columnIndex, rowIndex, key, style }) => {
    const index = rowIndex * Math.max(1, Math.floor(10000)) + columnIndex
    const cols = style && style.width ? Math.max(1, Math.floor(style.width / CARD_WIDTH)) : 3
    const idx = rowIndex * cols + columnIndex
    const p = items[idx]
    if (!p) return <div key={key} style={style} />
    return (
      <div key={key} style={{ ...style, padding: 'var(--card-gap)' }}>
        <ProductCard product={p} />
      </div>
    )
  }

  return (
    <div>
      <Filters value={filters} onChange={onFiltersChange} />

      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
        <div>共 {total} 条商品</div>
        <div>
          <Select value={sort} onChange={onSortChange} style={{ width: 180 }}>
            <Option value={null}>默认排序</Option>
            <Option value={'price_asc'}>价格升序</Option>
            <Option value={'price_desc'}>价格降序</Option>
            <Option value={'sales_desc'}>销量优先</Option>
          </Select>
        </div>
      </div>

      {loading ? (
        <div>
          <Skeleton.Image style={{ width: 300, height: 200 }} />
          <Skeleton active paragraph={{ rows: 2 }} />
        </div>
      ) : (
        <div style={{ height: 720 }}>
          <AutoSizer>
            {({ width, height }) => {
              const columnCount = Math.max(1, Math.floor(width / CARD_WIDTH))
              const rowCount = Math.ceil(items.length / columnCount)
              return (
                <Grid
                  ref={gridRef}
                  columnCount={columnCount}
                  columnWidth={Math.floor(width / columnCount)}
                  height={height}
                  rowCount={rowCount}
                  rowHeight={CARD_HEIGHT}
                  width={width}
                  cellRenderer={({ columnIndex, rowIndex, key, style }) => {
                    const idx = rowIndex * columnCount + columnIndex
                    const p = items[idx]
                    if (!p) return <div key={key} style={style} />
                    return (
                      <div key={key} style={{ ...style, padding: 8 }}>
                        <ProductCard product={p} />
                      </div>
                    )
                  }}
                />
              )
            }}
          </AutoSizer>
        </div>
      )}

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Pagination current={page} pageSize={pageSize} total={total} onChange={onPageChange} showSizeChanger />
      </div>
    </div>
  )
}
