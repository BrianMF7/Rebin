"use client";

import { useState, useEffect } from "react";
import { AvatarPersonality } from "./InteractiveAvatarSystem";

interface AvatarConfig {
  name: string;
  image: string;
  color: string;
  personality: AvatarPersonality;
}

interface AvatarCharacterProps {
  config: AvatarConfig;
  isSpeaking: boolean;
  isListening: boolean;
  onClick: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
}

export function AvatarCharacter({
  config,
  isSpeaking,
  isListening,
  onClick,
  onMinimize,
  isMinimized,
}: AvatarCharacterProps) {
  const [isHovered, setIsHovered] = useState(false);
  // Breathing animation for idle state
  useEffect(() => {
    if (!isSpeaking && !isListening) {
      // Breathing animation is handled by CSS classes
    }
  }, [isSpeaking, isListening]);
  const glowIntensity = isSpeaking ? 1 : isHovered ? 0.8 : 0.3;

  return (
    <div className="relative">
      {/* Avatar Container */}
      <div
        className={`
          relative w-20 h-20 rounded-full cursor-pointer transition-all duration-300 avatar-container
          ${isMinimized ? "scale-75" : "scale-100"}
          ${isHovered ? "scale-105" : ""}
          ${!isSpeaking && !isListening ? "avatar-idle" : ""}
          ${isSpeaking ? "avatar-speaking" : ""}
          ${isListening ? "avatar-listening" : ""}
          ${glowIntensity > 0.5 ? "avatar-glow" : ""}
        `}
        style={{
          filter: `drop-shadow(0 0 ${glowIntensity * 20}px ${
            config.color
          }${Math.floor(glowIntensity * 255)
            .toString(16)
            .padStart(2, "0")})`,
        }}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        aria-label={`${config.name} avatar - Click to switch to next avatar`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {/* Avatar Image */}
        <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white/20">
          <img
            src={config.image}
            alt={config.name}
            className={`
              w-full h-full object-cover transition-all duration-300
              ${isSpeaking ? "animate-pulse" : ""}
              ${isListening ? "animate-bounce" : ""}
            `}
            onError={(e) => {
              // Fallback to a colored circle if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const parent = target.parentElement;
              if (parent) {
                parent.style.backgroundColor = config.color;
                parent.innerHTML = `<div class="flex items-center justify-center w-full h-full text-white font-bold text-lg">${
                  config.name.split(" ")[0][0]
                }</div>`;
              }
            }}
          />
        </div>

        {/* Speaking Animation Overlay */}
        {isSpeaking && (
          <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-75" />
        )}

        {/* Listening Animation */}
        {isListening && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full animate-pulse">
            <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75" />
          </div>
        )}

        {/* Status Indicator */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-white/20 flex items-center justify-center">
          {isSpeaking ? (
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          ) : isListening ? (
            <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" />
          ) : (
            <div className="w-2 h-2 bg-muted-foreground rounded-full" />
          )}
        </div>
      </div>

      {/* Minimize Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMinimize();
        }}
        className={`
          absolute -top-2 -left-2 w-6 h-6 rounded-full bg-muted hover:bg-muted-foreground
          text-muted-foreground hover:text-background transition-all duration-200
          flex items-center justify-center text-xs font-bold
          ${isMinimized ? "opacity-0 pointer-events-none" : "opacity-100"}
        `}
        aria-label={isMinimized ? "Maximize avatar" : "Minimize avatar"}
        title={isMinimized ? "Maximize avatar" : "Minimize avatar"}
      >
        {isMinimized ? "+" : "−"}
      </button>

      {/* Avatar Name Tooltip */}
      {isHovered && !isMinimized && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-card text-card-foreground px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap border border-border shadow-lg">
          {config.name} - Click to switch
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-card" />
        </div>
      )}
    </div>
  );
}
