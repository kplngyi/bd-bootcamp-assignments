import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchProducts } from '../../api/mockApi'

export const loadProducts = createAsyncThunk(
  'products/loadProducts',
  async ({ filters, sort, page, pageSize }, thunkAPI) => {
    const res = await fetchProducts({ filters, sort, page, pageSize })
    return res
  }
)

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    total: 0,
    loading: false,
    error: null,
    filters: { keyword: '', category: 'all', minPrice: null, maxPrice: null },
    sort: null,
    page: 1,
    pageSize: 20
  },
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload }
      state.page = 1
    },
    setSort(state, action) {
      state.sort = action.payload
      state.page = 1
    },
    setPage(state, action) {
      state.page = action.payload
    },
    setPageSize(state, action) {
      state.pageSize = action.payload
      state.page = 1
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadProducts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadProducts.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.items
        state.total = action.payload.total
      })
      .addCase(loadProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
  }
})

export const { setFilters, setSort, setPage, setPageSize } = productsSlice.actions

export default productsSlice.reducer
