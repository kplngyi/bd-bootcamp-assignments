const express = require('express')
const rateLimit = require('express-rate-limit')
const { scrapeJD } = require('./jdScraper')

const app = express()
const PORT = process.env.PORT || 3000

const limiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 10 // limit each IP to 10 requests per windowMs
})

app.use(limiter)

app.get('/api/jd/scrape', async (req, res) => {
  const keyword = req.query.keyword || ''
  const page = Number(req.query.page || 1)
  try {
    const items = await scrapeJD(keyword, page)
    res.json({ items, total: items.length })
  } catch (err) {
    console.error('scrape error', err)
    res.status(500).json({ error: String(err) })
  }
})

app.listen(PORT, () => {
  console.log(`JD scraper server listening on http://localhost:${PORT}`)
})
