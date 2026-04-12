import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ShareNotFound } from './components/Share/404.tsx'
import Blog from './pages/Blog.tsx'
import ProjectsPage from './pages/Projects.tsx'
import ProjectDetail from './pages/ProjectDetail.tsx'
import ClassProjectsPage from './pages/ClassProjects.tsx'
import AdminPage from './pages/Admin.tsx'

import { GitHub, Youtube, Twitch, Discord, DockerHub, Reddit } from './components/Share/Profiles.tsx'

type ExternalProfileRouteProps = {
  openProfile: () => Window | null
}

function ExternalProfileRoute({ openProfile }: ExternalProfileRouteProps) {
  useEffect(() => {
    openProfile()
  }, [openProfile])

  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/projects/class" element={<ClassProjectsPage />} />
        <Route path="/blogs" element={<Blog />} />
        <Route path="/blogs/:slug" element={<Blog />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/share/404" element={<ShareNotFound />} />
        <Route path="/github" element={<ExternalProfileRoute openProfile={GitHub} />} />
        <Route path="/youtube" element={<ExternalProfileRoute openProfile={Youtube} />} />
        <Route path="/twitch" element={<ExternalProfileRoute openProfile={Twitch} />} />
        <Route path="/discord" element={<ExternalProfileRoute openProfile={Discord} />} />
        <Route path="/dockerhub" element={<ExternalProfileRoute openProfile={DockerHub} />} />
        <Route path="/reddit" element={<ExternalProfileRoute openProfile={Reddit} />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
