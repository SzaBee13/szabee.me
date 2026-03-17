import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ShareNotFound } from './components/Share/404.tsx'
import Blog from './pages/Blog.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/blogs" element={<Blog />} />
        <Route path="/blogs/:slug" element={<Blog />} />
        <Route path="/share/404" element={<ShareNotFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
