import { useState } from "react";
import { ItemDecision } from "../types";
import { ChatbotInterface } from "./ChatbotInterface";
import { Icons } from "./ui/icons";

interface ResultCardProps {
  decision: ItemDecision;
}

export function ResultCard({ decision }: ResultCardProps) {
  const [showChatbot, setShowChatbot] = useState(false);
  const getBinColor = (bin: string) => {
    switch (bin) {
      case "recycling":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "compost":
        return "bg-green-100 text-green-800 border-green-200";
      case "trash":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getBinIcon = (bin: string) => {
    switch (bin) {
      case "recycling":
        return "♻️";
      case "compost":
        return "🌱";
      case "trash":
        return "🗑️";
      default:
        return "❓";
    }
  };

  return (
    <>
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {decision.label}
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium border ${getBinColor(
              decision.bin
            )}`}
          >
            {getBinIcon(decision.bin)} {decision.bin.toUpperCase()}
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">
              Explanation
            </h4>
            <p className="text-gray-600">{decision.explanation}</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <h4 className="text-sm font-medium text-yellow-800 mb-1">
              💡 Eco Tip
            </h4>
            <p className="text-yellow-700 text-sm">{decision.eco_tip}</p>
          </div>
        </div>

        {/* Listen Button */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowChatbot(true)}
            className="flex items-center space-x-2 w-full justify-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-md transition-all duration-200 transform hover:scale-105"
          >
            <Icons.phone className="w-4 h-4" />
            <span className="text-sm font-medium">
              🎤 Listen to Explanation
            </span>
          </button>
        </div>
      </div>

      {/* Chatbot Interface Modal */}
      {showChatbot && (
        <ChatbotInterface
          decisions={[decision]}
          onClose={() => setShowChatbot(false)}
        />
      )}
    </>
  );
}
