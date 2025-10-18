"use client"

import { useState, useEffect, useRef } from "react"
import { Icons } from "../ui/icons"

interface ScanResult {
  id: string
  item: string
  category: "recycling" | "compost" | "trash"
  confidence: number
  timestamp: Date
  details: string
}

interface ScanInfoPanelProps {
  isScanning: boolean
}

export function ScanInfoPanel({ isScanning }: ScanInfoPanelProps) {
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isScanning) {
      const mockResults: ScanResult[] = [
        {
          id: "1",
          item: "Plastic Water Bottle",
          category: "recycling",
          confidence: 95,
          timestamp: new Date(),
          details: "Clean plastic bottles can be recycled. Remove cap and rinse before recycling.",
        },
        {
          id: "2",
          item: "Banana Peel",
          category: "compost",
          confidence: 98,
          timestamp: new Date(),
          details: "Fruit peels are perfect for composting. They break down quickly and add nutrients.",
        },
        {
          id: "3",
          item: "Styrofoam Container",
          category: "trash",
          confidence: 92,
          timestamp: new Date(),
          details: "Styrofoam cannot be recycled in most facilities. Dispose in regular trash.",
        },
      ]

      intervalRef.current = setInterval(() => {
        const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)]
        setScanResults((prev) =>
          [{ ...randomResult, id: Date.now().toString(), timestamp: new Date() }, ...prev].slice(0, 10),
        )
      }, 5000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isScanning])

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "recycling":
        return "text-primary"
      case "compost":
        return "text-secondary"
      case "trash":
        return "text-muted-foreground"
      default:
        return "text-foreground"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "recycling":
        return Icons.recycle
      case "compost":
        return Icons.leaf
      case "trash":
        return Icons.x
      default:
        return Icons.sparkles
    }
  }

  return (
    <div className="h-full bg-black border border-gray-800 rounded-lg overflow-hidden flex flex-col min-h-[400px] lg:min-h-[600px]">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Icons.sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white">Scan Results</h2>
            <p className="text-xs sm:text-sm text-gray-400">{scanResults.length} items detected</p>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {scanResults.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-4 sm:p-8">
            <div className="space-y-3">
              <div className="h-12 sm:h-16 w-12 sm:w-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto">
                <Icons.sparkles className="h-6 sm:h-8 w-6 sm:w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1">No Results Yet</h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  {isScanning ? "Analyzing items..." : "Start scanning to see classifications"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          scanResults.map((result) => {
            const CategoryIcon = getCategoryIcon(result.category)
            return (
              <div
                key={result.id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300"
              >
                {/* Item Header */}
                <div className="flex items-start gap-3">
                  <div
                    className={`h-8 sm:h-10 w-8 sm:w-10 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 ${getCategoryColor(result.category)}`}
                  >
                    <CategoryIcon className="h-4 sm:h-5 w-4 sm:w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-xs sm:text-sm mb-1">{result.item}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium capitalize ${getCategoryColor(result.category)}`}>
                        {result.category}
                      </span>
                      <span className="text-xs text-gray-400">{result.confidence}% confident</span>
                    </div>
                  </div>
                </div>

                {/* Details Bubble */}
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 sm:p-3">
                  <p className="text-xs text-gray-300 leading-relaxed">{result.details}</p>
                </div>

                {/* Timestamp */}
                <div className="text-xs text-gray-400">{result.timestamp.toLocaleTimeString()}</div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
