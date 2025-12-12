// API wrapper: prefer DummyJSON (https://dummyjson.com), fallback to local mock data
const categories = ['手机', '电脑', '数码', '家电', '家具', '服饰']

function createProducts(count = 1000) {
  const items = []
  for (let i = 1; i <= count; i++) {
    const category = categories[i % categories.length]
    items.push({
      id: i,
      title: `${category} 产品 ${i}`,
      category,
      price: Number((Math.random() * 1000 + 50).toFixed(2)),
      rating: Number((Math.random() * 5).toFixed(1)),
      sales: Math.floor(Math.random() * 5000),
      image: `https://picsum.photos/seed/product-${i}/300/200`
    })
  }
  return items
}

const ALL_PRODUCTS = createProducts(1500)

function wait(ms = 400) {
  return new Promise((res) => setTimeout(res, ms))
}

async function fetchAllFromDummyJSON() {
  const url = 'https://dummyjson.com/products?limit=1000'
  const resp = await fetch(url)
  if (!resp.ok) throw new Error('DummyJSON fetch failed')
  const json = await resp.json()
  return json.products.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category || '其它',
    price: Number(p.price || 0),
    rating: Number(p.rating || 0),
    sales: p.stock != null ? Number(p.stock) : Math.floor(Math.random() * 5000),
    image: p.thumbnail || (p.images && p.images[0]) || `https://picsum.photos/seed/product-${p.id}/300/200`
  }))
}

export async function fetchProducts({ filters = {}, sort = null, page = 1, pageSize = 20 } = {}) {
  // Use local mock data only (no external requests)
  await wait(200 + Math.random() * 200)

  let data = ALL_PRODUCTS.slice()

  if (filters.keyword) {
    const kw = String(filters.keyword).toLowerCase()
    data = data.filter((p) => p.title.toLowerCase().includes(kw))
  }
  if (filters.category && filters.category !== 'all') {
    data = data.filter((p) => p.category === filters.category)
  }
  if (filters.minPrice != null) {
    data = data.filter((p) => p.price >= Number(filters.minPrice))
  }
  if (filters.maxPrice != null) {
    data = data.filter((p) => p.price <= Number(filters.maxPrice))
  }

  if (sort === 'price_asc') data.sort((a, b) => a.price - b.price)
  else if (sort === 'price_desc') data.sort((a, b) => b.price - a.price)
  else if (sort === 'sales_desc') data.sort((a, b) => b.sales - a.sales)

  const total = data.length
  const start = (page - 1) * pageSize
  const items = data.slice(start, start + pageSize)

  return { items, total }
}

export async function fetchRecommendations(count = 5) {
  await wait(120)
  const picks = []
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * ALL_PRODUCTS.length)
    picks.push(ALL_PRODUCTS[idx])
  }
  return picks
}
