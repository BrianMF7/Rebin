import { Routes, Route } from 'react-router-dom'
import { CameraUpload } from './components/CameraUpload'
import { StatsPanel } from './components/StatsPanel'
import { Header } from './components/Header'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<CameraUpload />} />
          <Route path="/stats" element={<StatsPanel />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
