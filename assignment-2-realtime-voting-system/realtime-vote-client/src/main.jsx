import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Message } from '@arco-design/web-react';
import App from './App.jsx'
import '@arco-design/web-react/dist/css/arco.css';
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Message />
    <App />
  </StrictMode>,
)
