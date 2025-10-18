'use client'

import { useState } from "react";
import { Header } from "../landingPage/header";
import { Footer } from "../landingPage/footer";
import { WebcamScanner } from "./webcamScanner"
import { ScanInfoPanel } from "./scanInfoPanel"

export default function SortingPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState<any[]>([])

  const handleImageUpload = (imageData: string) => {
    console.log("[v0] Image uploaded, sending to backend:", imageData.substring(0, 50))
    // TODO: Call backend API here
    // const result = await classifyImage(imageData)
    // setScanResults(prev => [...prev, result])
  }

  const handleScanningChange = (scanning: boolean) => {
    setIsScanning(scanning)
    if (!scanning) {
      // Clear results when stopping
      setScanResults([])
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Webcam Scanner - 70% on desktop */}
          <div className="w-full lg:w-[70%]">
            <WebcamScanner
              isScanning={isScanning}
              setIsScanning={handleScanningChange}
              onImageUpload={handleImageUpload}
            />
          </div>

          {/* Info Panel - 30% on desktop */}
          <div className="w-full lg:w-[30%]">
            <ScanInfoPanel isScanning={isScanning} />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
