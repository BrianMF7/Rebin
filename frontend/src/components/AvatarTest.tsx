import { useState } from "react";
import { AvatarDisplay, AvatarSelector } from "./AvatarDisplay";
import { AvatarConfig } from "../types";
import { apiClient } from "../lib/api";

/**
 * Test component to verify avatar functionality
 * This can be used for testing the avatar display and selection
 */
export function AvatarTest() {
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarConfig | null>(
    null
  );
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Test avatar configurations
  const testAvatars: AvatarConfig[] = [
    {
      id: "friendly",
      name: "Green Gary",
      description:
        "A friendly, approachable guide who makes recycling feel easy and natural",
      gender: "male",
      voice_personality: "friendly",
      avatar_url: "/avatars/green-gary.png",
      personality_traits: ["encouraging", "patient", "warm", "supportive"],
      color_theme: "#4CAF50",
      animation_styles: {
        idle: "animate-pulse",
        speaking: "animate-pulse scale-105",
        listening: "animate-bounce",
      },
    },
    {
      id: "enthusiastic",
      name: "Eco Emma",
      description:
        "An energetic environmental enthusiast who gets excited about sustainable practices",
      gender: "female",
      voice_personality: "enthusiastic",
      avatar_url: "/avatars/eco-emma.png",
      personality_traits: [
        "energetic",
        "passionate",
        "motivating",
        "inspiring",
      ],
      color_theme: "#FF9800",
      animation_styles: {
        idle: "animate-pulse",
        speaking: "animate-pulse scale-105",
        listening: "animate-bounce",
      },
    },
    {
      id: "educational",
      name: "Professor Pete",
      description:
        "A knowledgeable educator who provides clear, informative guidance on waste management",
      gender: "male",
      voice_personality: "educational",
      avatar_url: "/avatars/professor-pete.png",
      personality_traits: [
        "knowledgeable",
        "clear",
        "professional",
        "informative",
      ],
      color_theme: "#2196F3",
      animation_styles: {
        idle: "animate-pulse",
        speaking: "animate-pulse scale-105",
        listening: "animate-bounce",
      },
    },
  ];

  const handleAvatarSelect = (avatar: AvatarConfig) => {
    setSelectedAvatar(avatar);
  };

  const handleTestAPI = async () => {
    try {
      console.log("Testing API client...");
      const avatars = await apiClient.getAvatarConfigs();
      console.log("API avatars:", avatars);
    } catch (error) {
      console.error("API test failed:", error);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Avatar Test Component
      </h1>

      {/* API Test */}
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">API Test</h2>
        <button
          onClick={handleTestAPI}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Test Avatar API
        </button>
      </div>

      {/* Avatar Display Test */}
      {selectedAvatar && (
        <div className="mb-8 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Avatar Display Test</h2>
          <div className="flex justify-center mb-4">
            <AvatarDisplay
              avatar={selectedAvatar}
              isSpeaking={isSpeaking}
              isListening={isListening}
              size="xl"
              showName={true}
              showTraits={true}
            />
          </div>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setIsSpeaking(!isSpeaking)}
              className={`px-4 py-2 rounded-md ${
                isSpeaking
                  ? "bg-green-600 text-white"
                  : "bg-gray-300 text-gray-700"
              }`}
            >
              {isSpeaking ? "Stop Speaking" : "Start Speaking"}
            </button>
            <button
              onClick={() => setIsListening(!isListening)}
              className={`px-4 py-2 rounded-md ${
                isListening
                  ? "bg-blue-600 text-white"
                  : "bg-gray-300 text-gray-700"
              }`}
            >
              {isListening ? "Stop Listening" : "Start Listening"}
            </button>
          </div>
        </div>
      )}

      {/* Avatar Selector Test */}
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Avatar Selector Test</h2>
        <AvatarSelector
          avatars={testAvatars}
          selectedAvatar={selectedAvatar || testAvatars[0]}
          onAvatarSelect={handleAvatarSelect}
          size="lg"
        />
      </div>

      {/* Avatar Information */}
      {selectedAvatar && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            Selected Avatar Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900">Basic Info</h3>
              <p>
                <strong>Name:</strong> {selectedAvatar.name}
              </p>
              <p>
                <strong>Gender:</strong> {selectedAvatar.gender}
              </p>
              <p>
                <strong>Voice Personality:</strong>{" "}
                {selectedAvatar.voice_personality}
              </p>
              <p>
                <strong>Color Theme:</strong>
                <span
                  className="inline-block w-4 h-4 rounded-full ml-2"
                  style={{ backgroundColor: selectedAvatar.color_theme }}
                />
                {selectedAvatar.color_theme}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Description</h3>
              <p className="text-sm text-gray-600">
                {selectedAvatar.description}
              </p>
              <h3 className="font-medium text-gray-900 mt-4">
                Personality Traits
              </h3>
              <div className="flex flex-wrap gap-1">
                {selectedAvatar.personality_traits.map((trait, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
