# Dianshng — 商品列表页 Demo

这是一个基于 React + Vite 的电商商品列表页面演示项目，使用 Ant Design 做 UI，Redux Toolkit 做状态管理。项目以本地 mock 数据为主。

**主要功能**
- **商品列表**：卡片式商品展示（图片、标题、分类、价格、评分、销量）。
- **筛选**：关键词、分类、价格区间；筛选输入做了防抖处理（避免短时间频繁请求）。
- **排序**：支持按价格/销量排序。
- **分页**：分页器支持页码与每页条数。
- **骨架屏**：数据加载时使用 Ant Design 的 Skeleton 提升体验。
- **虚拟滚动**：使用 `react-virtualized` 的 `Grid` 做网格虚拟化，提升大量数据下的渲染与滚动性能。
- **猜你喜欢**：顶部模拟推荐模块（使用本地 mock 随机推荐）。
- **Mock 数据**：内置大量 mock 商品数据（1500 条）供本地开发与测试使用。

**项目结构**
- `src/`：前端源码
	- `src/App.jsx`：页面入口
	- `src/main.jsx`：React 挂载 + Redux Provider
	- `src/store/`：Redux store
	- `src/features/products/productsSlice.js`：产品 slice + 异步加载逻辑
	- `src/api/mockApi.js`：本地 mock API（用于返回商品与推荐）
	- `src/components/Filters.jsx`：筛选控件（带防抖）
	- `src/components/ProductList.jsx`：商品列表（虚拟化 Grid + 分页 + 排序）
	- `src/components/ProductCard.jsx`：商品卡片
	- `src/components/Recommendations.jsx`：猜你喜欢模块
	- `src/styles.css`：全局样式（包含可配置的 CSS 变量用于自适应间距）
- `server/`：实验性后端
	- `server/jdScraper.js`：Puppeteer 爬虫示例（实验性）
	- `server/index.js`：Express 服务，暴露 `/api/jd/scrape`（用于代理爬虫）
	- `server/cache.js`：简单内存缓存

**如何运行（本地开发，使用 mock 数据）**
1. 安装依赖：
```bash
npm install
```
2. 启动开发服务器：
```bash
npm run dev
```
3. 打开浏览器访问：
```
http://localhost:5173
```

**可配置项 & 自适应样式**
- 间距与推荐图高度由 CSS 变量控制：在 `src/styles.css` 中有 `--card-gap`、`--recommend-gap`、`--recommend-img-height`，这些变量在不同屏幕宽度下通过媒体查询进行了自适应设置。修改这些变量可快速调整卡片间距与推荐图片大小。
- 虚拟化参数（单卡宽/高）在 `src/components/ProductList.jsx` 的 `CARD_WIDTH` 与 `CARD_HEIGHT` 常量中可调整以适配布局需求。

**实现细节**
- 筛选输入使用 `lodash.debounce` 做防抖（450ms），减少短时间内重复请求与渲染。
- 数据加载（`loadProducts`）使用 Redux Toolkit 的 `createAsyncThunk`；加载中状态触发骨架屏显示。
- 虚拟化使用 `react-virtualized` 的 `AutoSizer` + `Grid` 做网格渲染，卡片在格子内通过 `padding: var(--card-gap)` 控制间距，从而实现响应式间距。



**下一步（接入真实电商数据）**

