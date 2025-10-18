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
  const [isCapturing, setIsCapturing] = useState(false);
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

  // Check webcam support on component mount
  useEffect(() => {
    setIsWebcamSupported(
      !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    );
  }, []);

  // Cleanup stream on unmount and when switching modes
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
          console.log("Stopped track:", track.kind);
        });
        setStream(null);
      }
    };
  }, [stream]);

  // Additional cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clear any remaining video streams
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  // Start webcam stream
  const startWebcam = useCallback(async () => {
    try {
      setWebcamError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Prefer back camera on mobile
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
        },
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing webcam:", error);
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          setWebcamError(
            "Camera access denied. Please allow camera permissions and try again."
          );
        } else if (error.name === "NotFoundError") {
          setWebcamError(
            "No camera found. Please connect a camera and try again."
          );
        } else if (error.name === "NotSupportedError") {
          setWebcamError("Camera not supported on this device.");
        } else {
          setWebcamError("Failed to access camera. Please try again.");
        }
      } else {
        setWebcamError("Failed to access camera. Please try again.");
      }
    }
  }, []);

  // Stop webcam stream
  const stopWebcam = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setWebcamError(null);
  }, [stream]);

  // Capture image from video
  const captureImage = useCallback(async (): Promise<File | null> => {
    if (!videoRef.current || !canvasRef.current) return null;

    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Failed to get canvas context");
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob, then to file
      return new Promise<File | null>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], "webcam-capture.jpg", {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(file);
            } else {
              reject(new Error("Failed to capture image"));
            }
          },
          "image/jpeg",
          0.9
        );
      });
    } catch (error) {
      console.error("Error capturing image:", error);
      setWebcamError("Failed to capture image. Please try again.");
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  // Handle mode switching with proper cleanup
  const switchToFileMode = useCallback(() => {
    if (isWebcamMode) {
      stopWebcam();
      setIsWebcamMode(false);
    }
  }, [isWebcamMode, stopWebcam]);

  const switchToWebcamMode = useCallback(() => {
    if (!isWebcamMode) {
      setIsWebcamMode(true);
      startWebcam();
    }
  }, [isWebcamMode, startWebcam]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResults([]);
    }
  };

  const handleCapture = async () => {
    if (isWebcamMode) {
      try {
        const capturedFile = await captureImage();
        if (capturedFile) {
          setSelectedFile(capturedFile);
          setResults([]);
        }
      } catch (error) {
        // Error already handled in captureImage
      }
    } else {
      fileInputRef.current?.click();
    }
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
    if (isWebcamMode) {
      stopWebcam();
    }
  };

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
          {/* Mode Toggle */}
          {isWebcamSupported && (
            <div className="flex justify-center mb-4">
              <div className="bg-gray-100 rounded-lg p-1 flex">
                <button
                  onClick={switchToFileMode}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    !isWebcamMode
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  📁 Upload File
                </button>
                <button
                  onClick={switchToWebcamMode}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isWebcamMode
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  📷 Use Camera
                </button>
              </div>
            </div>
          )}

          {/* Webcam Preview */}
          {isWebcamMode && stream && (
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 sm:h-80 object-cover"
                style={{ transform: "scaleX(-1)" }} // Mirror the video for better UX
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={handleCapture}
                  disabled={isCapturing}
                  className="bg-white/90 hover:bg-white text-gray-900 rounded-full p-4 shadow-lg transition-colors disabled:opacity-50"
                >
                  <Icons.camera className="w-8 h-8" />
                </button>
              </div>
              {isCapturing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white text-lg">Capturing...</div>
                </div>
              )}
            </div>
          )}

          {/* Webcam Error */}
          {isWebcamMode && webcamError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">{webcamError}</p>
              <button
                onClick={startWebcam}
                className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Capture Button (for file upload mode or when webcam is not active) */}
          {(!isWebcamMode || !stream) && (
            <div className="flex justify-center">
              <button
                onClick={handleCapture}
                disabled={isCapturing}
                className="btn-primary text-lg px-8 py-3 disabled:opacity-50"
              >
                {isWebcamMode ? "📷 Start Camera" : "📷 Capture Photo"}
              </button>
            </div>
          )}

          {/* Webcam not supported message */}
          {!isWebcamSupported && (
            <div className="text-center text-sm text-gray-500">
              Camera not supported on this device. Please use file upload
              instead.
            </div>
          )}

          {/* Hidden file input and canvas */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Selected File Display */}
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
