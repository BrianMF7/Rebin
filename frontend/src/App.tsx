import { Routes, Route } from 'react-router-dom'
// import { CameraUpload } from './components/CameraUpload'
//import { StatsPanel } from './components/StatsPanel'
//Testing
import { Header } from './components/landingPage/header'
import { EarthBackground } from './components/landingPage/earthBackground'
import { Footer } from './components/landingPage/footer'
import { HeroSection } from './components/landingPage/heroSection'
import { MissionSection } from './components/landingPage/missionSection'
import { FeaturesSection } from './components/landingPage/featureSection'
import { ImpactSection } from './components/landingPage/impactSection'

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <EarthBackground />
      <Header />
    
      <main className="flex-1 relative z-10">
        <HeroSection />
        <MissionSection />
        <FeaturesSection />
        <ImpactSection />
        <Routes>
          {/* <Route path="/" element={<CameraUpload />} /> */}
          {/* <Route path="/stats" element={<StatsPanel />} /> */}
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
