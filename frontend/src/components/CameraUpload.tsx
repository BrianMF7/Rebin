import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '../lib/api'
import { ResultCard } from './ResultCard'
import { ItemDetection, ItemDecision } from '../types'

export function CameraUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [zipCode, setZipCode] = useState('')
  const [results, setResults] = useState<ItemDecision[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const inferMutation = useMutation({
    mutationFn: (file: File) => apiClient.infer(file, zipCode || undefined),
    onSuccess: (data) => {
      // Trigger explanation
      explainMutation.mutate({
        items: data.items.map(item => ({ label: item.label })),
        zip: data.zip,
      })
    },
  })

  const explainMutation = useMutation({
    mutationFn: ({ items, zip }: { items: { label: string }[], zip?: string }) => 
      apiClient.explain(items, zip),
    onSuccess: (data) => {
      setResults(data.decisions)
    },
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setResults([])
    }
  }

  const handleCapture = () => {
    fileInputRef.current?.click()
  }

  const handleAnalyze = () => {
    if (selectedFile) {
      inferMutation.mutate(selectedFile)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setResults([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          AI-Powered Waste Sorting
        </h1>
        <p className="text-gray-600">
          Upload or capture a photo of your waste item to get instant sorting guidance
        </p>
      </div>

      <div className="card mb-6">
        <div className="mb-4">
          <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-2">
            ZIP Code (optional)
          </label>
          <input
            type="text"
            id="zip"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="Enter your ZIP code for local policies"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-center">
            <button
              onClick={handleCapture}
              className="btn-primary text-lg px-8 py-3"
            >
              📷 Capture Photo
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {selectedFile && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Selected: {selectedFile.name}
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleAnalyze}
                  disabled={inferMutation.isPending || explainMutation.isPending}
                  className="btn-primary disabled:opacity-50"
                >
                  {inferMutation.isPending || explainMutation.isPending ? 'Analyzing...' : 'Analyze'}
                </button>
                <button
                  onClick={handleReset}
                  className="btn-secondary"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Sorting Results</h2>
          {results.map((decision, index) => (
            <ResultCard key={index} decision={decision} />
          ))}
        </div>
      )}

      {(inferMutation.error || explainMutation.error) && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">
            Error: {inferMutation.error?.message || explainMutation.error?.message}
          </p>
        </div>
      )}
    </div>
  )
}
