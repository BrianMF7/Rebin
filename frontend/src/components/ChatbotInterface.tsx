import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../lib/api";
import {
  ItemDecision,
  ChatbotResponse,
  VoicePersonality,
  AvatarConfig,
} from "../types";
import { Icons } from "./ui/icons";
import { AvatarDisplay, AvatarSelector } from "./AvatarDisplay";
import { preloadAvatarImages, validateAvatarConfig } from "../lib/security";

interface ChatbotInterfaceProps {
  decisions: ItemDecision[];
  onClose?: () => void;
}

export function ChatbotInterface({
  decisions,
  onClose,
}: ChatbotInterfaceProps) {
  const [voicePersonality, setVoicePersonality] = useState<
    "friendly" | "enthusiastic" | "educational"
  >("friendly");
  const [includeEcoTips, setIncludeEcoTips] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(
    null
  );
  const [availableVoices, setAvailableVoices] = useState<VoicePersonality[]>(
    []
  );
  const [availableAvatars, setAvailableAvatars] = useState<AvatarConfig[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarConfig | null>(
    null
  );
  const [showFallback, setShowFallback] = useState(false);

  // Fetch available voices and avatars on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch voices
        const voicesResponse = await apiClient.getAvailableVoices();
        setAvailableVoices(voicesResponse.voices);

        // Fetch avatars
        const avatars = await apiClient.getAvatarConfigs();
        setAvailableAvatars(avatars);

        // Set default avatar based on voice personality
        const defaultAvatar = avatars.find(
          (avatar) => avatar.voice_personality === voicePersonality
        );
        if (defaultAvatar) {
          setSelectedAvatar(defaultAvatar);
        }

        // Preload avatar images for better performance
        preloadAvatarImages(avatars).catch((error) => {
          console.warn("Failed to preload some avatar images:", error);
        });
      } catch (error) {
        console.error("Failed to fetch voices and avatars:", error);
        // Set fallback avatars
        const fallbackAvatars = apiClient.getFallbackAvatarConfigs();
        setAvailableAvatars(fallbackAvatars);
        const defaultAvatar = fallbackAvatars.find(
          (avatar) => avatar.voice_personality === voicePersonality
        );
        if (defaultAvatar) {
          setSelectedAvatar(defaultAvatar);
        }
      }
    };
    fetchData();
  }, [voicePersonality]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = "";
      }
    };
  }, [currentAudio]);

  const speakMutation = useMutation({
    mutationFn: () =>
      apiClient.speakDecisions(decisions, {
        voice_personality: voicePersonality,
        include_eco_tips: includeEcoTips,
      }),
    onSuccess: (response: ChatbotResponse) => {
      if (response.audio_url) {
        playAudio(response.audio_url);
      } else {
        setShowFallback(true);
      }
    },
    onError: (error) => {
      console.error("Speech generation failed:", error);
      setShowFallback(true);
    },
  });

  const playAudio = (audioUrl: string) => {
    try {
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = "";
      }

      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);

      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        console.error("Audio playback failed");
        setIsPlaying(false);
        setShowFallback(true);
      };

      audio.play().catch((error) => {
        console.error("Failed to play audio:", error);
        setIsPlaying(false);
        setShowFallback(true);
      });
    } catch (error) {
      console.error("Audio setup failed:", error);
      setShowFallback(true);
    }
  };

  const handlePlayPause = () => {
    if (currentAudio) {
      if (isPlaying) {
        currentAudio.pause();
      } else {
        currentAudio.play().catch((error) => {
          console.error("Failed to resume audio:", error);
          setShowFallback(true);
        });
      }
    } else {
      speakMutation.mutate();
    }
  };

  const handleStop = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const handleRepeat = () => {
    if (currentAudio) {
      currentAudio.currentTime = 0;
      currentAudio.play().catch((error) => {
        console.error("Failed to replay audio:", error);
        setShowFallback(true);
      });
    } else {
      speakMutation.mutate();
    }
  };

  const handleClose = () => {
    handleStop();
    onClose?.();
  };

  const getVoiceDisplayName = (voiceId: string) => {
    const voice = availableVoices.find((v) => v.personality_id === voiceId);
    return voice?.avatar?.name || voiceId;
  };

  const getVoiceDescription = (voiceId: string) => {
    const voice = availableVoices.find((v) => v.personality_id === voiceId);
    return voice?.avatar?.description || "";
  };

  // Handle avatar selection
  const handleAvatarSelect = (avatar: AvatarConfig) => {
    if (validateAvatarConfig(avatar)) {
      setSelectedAvatar(avatar);
      setVoicePersonality(avatar.voice_personality as typeof voicePersonality);
    } else {
      console.error("Invalid avatar configuration:", avatar);
    }
  };

  // Update selected avatar when voice personality changes
  useEffect(() => {
    const matchingAvatar = availableAvatars.find(
      (avatar) => avatar.voice_personality === voicePersonality
    );
    if (
      matchingAvatar &&
      (!selectedAvatar || selectedAvatar.id !== matchingAvatar.id)
    ) {
      setSelectedAvatar(matchingAvatar);
    }
  }, [voicePersonality, availableAvatars, selectedAvatar]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">
              🎤 Voice Assistant
            </h2>
            {selectedAvatar && (
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedAvatar.color_theme }}
                />
                <span className="text-sm text-gray-600">
                  {selectedAvatar.name}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close voice assistant"
          >
            <Icons.x className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar Display */}
          {selectedAvatar && (
            <div className="flex justify-center">
              <AvatarDisplay
                avatar={selectedAvatar}
                isSpeaking={isPlaying}
                isListening={speakMutation.isPending}
                size="lg"
                showName={true}
                showTraits={true}
                className="mb-4"
              />
            </div>
          )}

          {/* Avatar Selection */}
          {availableAvatars.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose Your Guide
              </label>
              <AvatarSelector
                avatars={availableAvatars}
                selectedAvatar={selectedAvatar || availableAvatars[0]}
                onAvatarSelect={handleAvatarSelect}
                size="md"
                className="mb-4"
              />
            </div>
          )}

          {/* Voice Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Voice Personality
            </label>
            <div className="grid grid-cols-1 gap-3">
              {(["friendly", "enthusiastic", "educational"] as const).map(
                (voice) => (
                  <label
                    key={voice}
                    className="flex items-start space-x-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="voice"
                      value={voice}
                      checked={voicePersonality === voice}
                      onChange={(e) =>
                        setVoicePersonality(
                          e.target.value as typeof voicePersonality
                        )
                      }
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {getVoiceDisplayName(voice)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getVoiceDescription(voice)}
                      </div>
                    </div>
                  </label>
                )
              )}
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeEcoTips}
                onChange={(e) => setIncludeEcoTips(e.target.checked)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Include eco tips in conversation
              </span>
            </label>
          </div>

          {/* Audio Controls */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handlePlayPause}
                disabled={speakMutation.isPending}
                className="flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-full transition-colors"
              >
                {speakMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Icons.x className="w-5 h-5" />
                ) : (
                  <Icons.arrowRight className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={handleStop}
                disabled={!currentAudio && !isPlaying}
                className="flex items-center justify-center w-10 h-10 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white rounded-full transition-colors"
              >
                <Icons.x className="w-4 h-4" />
              </button>

              <button
                onClick={handleRepeat}
                disabled={!currentAudio}
                className="flex items-center justify-center w-10 h-10 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-full transition-colors"
              >
                <Icons.arrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 text-center">
              {speakMutation.isPending && (
                <p className="text-sm text-blue-600">🎵 Generating speech...</p>
              )}
              {isPlaying && (
                <p className="text-sm text-green-600">🔊 Playing audio</p>
              )}
              {speakMutation.error && (
                <p className="text-sm text-red-600">
                  ❌ Speech generation failed
                </p>
              )}
            </div>
          </div>

          {/* Fallback Text Display */}
          {showFallback && speakMutation.data && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                📝 Text Version (Audio unavailable)
              </h3>
              <p className="text-sm text-yellow-700 whitespace-pre-wrap">
                {speakMutation.data.fallback_text}
              </p>
              <button
                onClick={() => setShowFallback(false)}
                className="mt-2 text-xs text-yellow-600 hover:text-yellow-800 underline"
              >
                Hide text
              </button>
            </div>
          )}

          {/* Items Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              📋 Items to discuss ({decisions.length})
            </h3>
            <div className="space-y-1">
              {decisions.map((decision, index) => (
                <div key={index} className="text-xs text-blue-700">
                  • {decision.label} → {decision.bin} bin
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-xs text-gray-500">
            Powered by ElevenLabs AI Voice
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePlayPause}
              disabled={speakMutation.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded-md transition-colors"
            >
              {speakMutation.isPending
                ? "Generating..."
                : isPlaying
                ? "Pause"
                : "Listen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
