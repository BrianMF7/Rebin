"use client";

import { useState } from "react";
import { AvatarPersonality } from "./InteractiveAvatarSystem";
import { Icons } from "../ui/icons";

interface AvatarSelectorProps {
  currentAvatar: AvatarPersonality;
  onAvatarChange: (personality: AvatarPersonality) => void;
  isVisible: boolean;
}

const AVATAR_OPTIONS = [
  {
    personality: "friendly" as AvatarPersonality,
    name: "Green Gary",
    image: "/avatars/green-gary.png",
    color: "#22c55e",
    description: "Friendly and encouraging guide",
  },
  {
    personality: "enthusiastic" as AvatarPersonality,
    name: "Eco Emma",
    image: "/avatars/eco-emma.png",
    color: "#FF9800",
    description: "Energetic environmental advocate",
  },
  {
    personality: "educational" as AvatarPersonality,
    name: "Professor Pete",
    image: "/avatars/professor-pete.png",
    color: "#2196F3",
    description: "Knowledgeable educator",
  },
];

export function AvatarSelector({
  currentAvatar,
  onAvatarChange,
  isVisible,
}: AvatarSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-24 right-0 space-y-2">
      {/* Avatar Selection Panel */}
      <div
        className={`
          bg-card border border-border rounded-lg p-3 shadow-lg transition-all duration-300
          ${
            isExpanded
              ? "panel-enter"
              : "opacity-0 translate-y-2 pointer-events-none"
          }
        `}
      >
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Choose Avatar
        </div>
        <div className="flex gap-2">
          {AVATAR_OPTIONS.map((option) => (
            <button
              key={option.personality}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAvatarChange(option.personality);
                setIsExpanded(false);
              }}
              className={`
                relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all duration-200
                ${
                  currentAvatar === option.personality
                    ? "border-primary scale-110"
                    : "border-border hover:border-primary/50"
                }
              `}
              style={{
                filter:
                  currentAvatar === option.personality
                    ? `drop-shadow(0 0 8px ${option.color})`
                    : "none",
              }}
              aria-label={`Select ${option.name} avatar`}
              title={`${option.name} - ${option.description}`}
            >
              <img
                src={option.image}
                alt={option.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    parent.style.backgroundColor = option.color;
                    parent.innerHTML = `<div class="flex items-center justify-center w-full h-full text-white font-bold text-sm">${
                      option.name.split(" ")[0][0]
                    }</div>`;
                  }
                }}
              />
              {currentAvatar === option.personality && (
                <div className="absolute inset-0 bg-primary/20 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-2">
        {/* Avatar Selection Toggle */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="w-8 h-8 rounded-full bg-muted hover:bg-muted-foreground text-muted-foreground hover:text-background transition-all duration-200 flex items-center justify-center"
          aria-label="Toggle avatar selection"
          title="Choose avatar personality"
        >
          <Icons.users className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
