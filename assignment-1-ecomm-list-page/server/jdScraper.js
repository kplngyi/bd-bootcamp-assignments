const puppeteer = require('puppeteer')
const cache = require('./cache')

async function scrapeJD(keyword = '', page = 1) {
  const cacheKey = `jd:${keyword}:p${page}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const searchUrl = `https://search.jd.com/Search?keyword=${encodeURIComponent(keyword)}&enc=utf-8&page=${page * 2 - 1}`
  // JD uses odd page numbers for real pages (pagination quirk)

  let browser
  try {
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  } catch (launchErr) {
    console.warn('Puppeteer launch failed, falling back to DummyJSON:', launchErr && launchErr.message)
    // fallback: use DummyJSON to provide some results
    try {
      const resp = await fetch('https://dummyjson.com/products?limit=40')
      const json = await resp.json()
      const items = (json.products || []).map((p) => ({ id: p.id, title: p.title, price: Number(p.price || 0), image: p.thumbnail || (p.images && p.images[0]) || '', link: p.images && p.images[0] ? p.images[0] : '' }))
      cache.set(cacheKey, items, 60 * 1000)
      return items
    } catch (e) {
      console.error('DummyJSON fallback failed', e)
      throw launchErr
    }
  }

  try {
    const pageObj = await browser.newPage()
    await pageObj.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36')
    await pageObj.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // Wait for product list
    await pageObj.waitForSelector('#J_goodsList', { timeout: 10000 })

    // Extract items. JD list items often have data-sku attribute and structured inner nodes.
    const items = await pageObj.$$eval('#J_goodsList .gl-item', (nodes) => {
      return nodes.slice(0, 60).map((node) => {
        const sku = node.getAttribute('data-sku') || ''
        const titleNode = node.querySelector('.p-name em') || node.querySelector('.p-name a')
        const title = titleNode ? titleNode.innerText.trim() : ''
        const priceNode = node.querySelector('.p-price strong i')
        const price = priceNode ? priceNode.innerText.trim().replace(/[￥,]/g, '') : ''
        const imgNode = node.querySelector('.p-img img')
        let img = ''
        if (imgNode) img = imgNode.getAttribute('data-lazy-img') || imgNode.getAttribute('src') || ''
        if (img && img.indexOf('http') !== 0) img = 'https:' + img
        const linkNode = node.querySelector('.p-img a')
        const link = linkNode ? (linkNode.href || '') : ''
        const commitNode = node.querySelector('.p-commit strong') || node.querySelector('.p-commit a')
        const salesText = commitNode ? commitNode.innerText.trim().replace(/[^\\d]/g, '') : ''
        const sales = salesText ? Number(salesText) : 0
        return { id: sku || link || title, title, price: Number(price || 0), image: img, link, sales }
      })
    })

    await pageObj.close()
    cache.set(cacheKey, items, 60 * 1000) // cache 60s
    return items
  } finally {
    await browser.close()
  }
}

module.exports = { scrapeJD }
