import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../lib/api";
import { ResultCard } from "./ResultCard";
import { ChatbotInterface } from "./ChatbotInterface";
import { ItemDecision } from "../types";
import { Icons } from "./ui/icons";

export function CameraUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [zipCode, setZipCode] = useState("");
  const [results, setResults] = useState<ItemDecision[]>([]);
  const [showGlobalChatbot, setShowGlobalChatbot] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Webcam state
  const [isWebcamMode, setIsWebcamMode] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [isWebcamSupported, setIsWebcamSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const inferMutation = useMutation({
    mutationFn: (file: File) => apiClient.infer(file, zipCode || undefined),
    onSuccess: (data) => {
      // Trigger explanation
      explainMutation.mutate({
        items: data.items.map((item) => ({ label: item.label })),
        zip: data.zip,
      });
    },
  });

  const explainMutation = useMutation({
    mutationFn: ({
      items,
      zip,
    }: {
      items: { label: string }[];
      zip?: string;
    }) => apiClient.explain(items, zip),
    onSuccess: (data) => {
      setResults(data.decisions);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResults([]);
    }
  };

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      inferMutation.mutate(selectedFile);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Webcam functionality
  const checkWebcamSupport = useCallback(async () => {
    try {
      const hasGetUserMedia = !!(
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia
      );
      setIsWebcamSupported(hasGetUserMedia);
    } catch (error) {
      console.error("Error checking webcam support:", error);
      setIsWebcamSupported(false);
    }
  }, []);

  const startWebcam = useCallback(async () => {
    try {
      setWebcamError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });
      setStream(mediaStream);
      setIsWebcamMode(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing webcam:", error);
      setWebcamError("Unable to access webcam. Please check permissions.");
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsWebcamMode(false);
    setWebcamError(null);
  }, [stream]);

  const captureFromWebcam = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], "webcam-capture.jpg", {
            type: "image/jpeg",
          });
          setSelectedFile(file);
          setResults([]);
          stopWebcam();
        }
      },
      "image/jpeg",
      0.8
    );
  }, [stopWebcam]);

  // Check webcam support on mount
  useEffect(() => {
    checkWebcamSupport();
  }, [checkWebcamSupport]);

  // Cleanup webcam on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          AI-Powered Waste Sorting
        </h1>
        <p className="text-gray-600">
          Upload or capture a photo of your waste item to get instant sorting
          guidance
        </p>
      </div>

      <div className="card mb-6">
        <div className="mb-4">
          <label
            htmlFor="zip"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
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
                  disabled={
                    inferMutation.isPending || explainMutation.isPending
                  }
                  className="btn-primary disabled:opacity-50"
                >
                  {inferMutation.isPending || explainMutation.isPending
                    ? "Analyzing..."
                    : "Analyze"}
                </button>
                <button onClick={handleReset} className="btn-secondary">
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Webcam Section */}
      {isWebcamSupported && (
        <div className="card mb-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Or Capture with Webcam
            </h3>

            {!isWebcamMode ? (
              <button
                onClick={startWebcam}
                className="btn-secondary"
                aria-label="Start webcam capture"
              >
                📹 Start Webcam
              </button>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-w-md mx-auto rounded-lg border-2 border-gray-300"
                    aria-label="Webcam preview"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={captureFromWebcam}
                    className="btn-primary"
                    aria-label="Capture photo from webcam"
                  >
                    📸 Capture Photo
                  </button>
                  <button
                    onClick={stopWebcam}
                    className="btn-secondary"
                    aria-label="Stop webcam"
                  >
                    Stop Webcam
                  </button>
                </div>
              </div>
            )}

            {webcamError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{webcamError}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Sorting Results
            </h2>
            {results.length > 1 && (
              <button
                onClick={() => setShowGlobalChatbot(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white rounded-md transition-all duration-200 transform hover:scale-105"
                aria-label="Listen to all explanations"
              >
                <Icons.phone className="w-4 h-4" />
                <span className="text-sm font-medium">🎤 Listen to All</span>
              </button>
            )}
          </div>
          {results.map((decision, index) => (
            <ResultCard key={index} decision={decision} />
          ))}
        </div>
      )}

      {(inferMutation.error || explainMutation.error) && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">
            Error:{" "}
            {inferMutation.error?.message || explainMutation.error?.message}
          </p>
        </div>
      )}

      {/* Global Chatbot Interface Modal */}
      {showGlobalChatbot && (
        <ChatbotInterface
          decisions={results}
          onClose={() => setShowGlobalChatbot(false)}
        />
      )}
    </div>
  );
}
