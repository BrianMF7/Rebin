import { Routes, Route } from "react-router-dom";
// import { CameraUpload } from './components/CameraUpload'
//import { StatsPanel } from './components/StatsPanel'
//Testing
import { Header } from "./components/landingPage/header";
import { EarthBackground } from "./components/landingPage/earthBackground";
import { Footer } from "./components/landingPage/footer";
import { HeroSection } from "./components/landingPage/heroSection";
import { MissionSection } from "./components/landingPage/missionSection";
import { FeaturesSection } from "./components/landingPage/featureSection";
import { ImpactSection } from "./components/landingPage/impactSection";
import { InteractiveAvatarSystem } from "./components/avatar";
import SortingPage from "./components/webCamLayout/page";

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Routes>
        <Route
          path="/"
          element={
            <>
              <EarthBackground />
              <Header />
              <main className="flex-1 relative z-10">
                <HeroSection />
                <MissionSection />
                <FeaturesSection />
                <ImpactSection />
              </main>
              <Footer />
              {/* Interactive Avatar System */}
              <InteractiveAvatarSystem />
            </>
          }
        />
        <Route path="/sorting" element={<SortingPage />} />
        {/* <Route path="/stats" element={<StatsPanel />} /> */}
      </Routes>
    </div>
  );
}

export default App;
