import { useState, useEffect, useCallback } from "react";
import { AvatarConfig } from "../types";
import { Icons } from "./ui/icons";

interface AvatarDisplayProps {
  avatar: AvatarConfig;
  isSpeaking?: boolean;
  isListening?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  showName?: boolean;
  showTraits?: boolean;
  className?: string;
  onAvatarClick?: () => void;
}

/**
 * AvatarDisplay component renders an animated avatar with different states
 * Supports speaking, listening, and idle animations with accessibility features
 */
export function AvatarDisplay({
  avatar,
  isSpeaking = false,
  isListening = false,
  size = "md",
  showName = true,
  showTraits = false,
  className = "",
  onAvatarClick,
}: AvatarDisplayProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<
    "idle" | "speaking" | "listening"
  >("idle");

  // Update animation phase based on props
  useEffect(() => {
    if (isSpeaking) {
      setAnimationPhase("speaking");
    } else if (isListening) {
      setAnimationPhase("listening");
    } else {
      setAnimationPhase("idle");
    }
  }, [isSpeaking, isListening]);

  // Handle image loading
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
  }, []);

  // Size configurations
  const sizeConfig = {
    sm: {
      container: "w-16 h-16",
      image: "w-14 h-14",
      name: "text-xs",
      traits: "text-xs",
    },
    md: {
      container: "w-24 h-24",
      image: "w-20 h-20",
      name: "text-sm",
      traits: "text-xs",
    },
    lg: {
      container: "w-32 h-32",
      image: "w-28 h-28",
      name: "text-base",
      traits: "text-sm",
    },
    xl: {
      container: "w-40 h-40",
      image: "w-36 h-36",
      name: "text-lg",
      traits: "text-base",
    },
  };

  const currentSize = sizeConfig[size];

  // Animation classes based on state
  const getAnimationClasses = () => {
    const baseClasses = "transition-all duration-300 ease-in-out";

    switch (animationPhase) {
      case "speaking":
        return `${baseClasses} animate-pulse scale-105`;
      case "listening":
        return `${baseClasses} animate-bounce`;
      case "idle":
      default:
        return `${baseClasses} hover:scale-105`;
    }
  };

  // Get avatar image URL with fallback
  const getAvatarImageUrl = () => {
    if (imageError) {
      // Return a placeholder or default avatar
      return `data:image/svg+xml;base64,${btoa(`
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" fill="${
            avatar.color_theme
          }" opacity="0.3"/>
          <text x="50" y="55" text-anchor="middle" font-family="Arial" font-size="12" fill="${
            avatar.color_theme
          }">
            ${avatar.name.charAt(0)}
          </text>
        </svg>
      `)}`;
    }
    return avatar.avatar_url;
  };

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      {/* Avatar Container */}
      <div
        className={`
          ${currentSize.container}
          ${getAnimationClasses()}
          relative rounded-full overflow-hidden
          border-2 border-gray-200 hover:border-gray-300
          cursor-pointer group
          ${onAvatarClick ? "hover:shadow-lg" : ""}
        `}
        onClick={onAvatarClick}
        role={onAvatarClick ? "button" : "img"}
        aria-label={`${avatar.name} avatar, ${avatar.description}`}
        tabIndex={onAvatarClick ? 0 : undefined}
        onKeyDown={(e) => {
          if (onAvatarClick && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onAvatarClick();
          }
        }}
      >
        {/* Avatar Image */}
        <img
          src={getAvatarImageUrl()}
          alt={`${avatar.name} - ${avatar.description}`}
          className={`
            ${currentSize.image}
            object-cover rounded-full
            transition-opacity duration-300
            ${imageLoaded ? "opacity-100" : "opacity-0"}
          `}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />

        {/* Loading State */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-full">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Status Indicators */}
        <div className="absolute -bottom-1 -right-1">
          {isSpeaking && (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
              <Icons.volume className="w-3 h-3 text-white" />
            </div>
          )}
          {isListening && (
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-bounce">
              <Icons.mic className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Hover Overlay */}
        {onAvatarClick && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-full flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Icons.arrowRight className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Avatar Name */}
      {showName && (
        <div className="text-center">
          <h3 className={`font-medium text-gray-900 ${currentSize.name}`}>
            {avatar.name}
          </h3>
          <p className={`text-gray-500 ${currentSize.traits}`}>
            {avatar.description}
          </p>
        </div>
      )}

      {/* Personality Traits */}
      {showTraits && avatar.personality_traits && (
        <div className="flex flex-wrap gap-1 justify-center max-w-32">
          {avatar.personality_traits.slice(0, 3).map((trait, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
            >
              {trait}
            </span>
          ))}
          {avatar.personality_traits.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              +{avatar.personality_traits.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Accessibility: Screen reader only status */}
      <div className="sr-only" aria-live="polite">
        {isSpeaking && `${avatar.name} is speaking`}
        {isListening && `${avatar.name} is listening`}
        {!isSpeaking && !isListening && `${avatar.name} is idle`}
      </div>
    </div>
  );
}

/**
 * AvatarSelector component for selecting between different avatars
 */
interface AvatarSelectorProps {
  avatars: AvatarConfig[];
  selectedAvatar: AvatarConfig;
  onAvatarSelect: (avatar: AvatarConfig) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvatarSelector({
  avatars,
  selectedAvatar,
  onAvatarSelect,
  size = "md",
  className = "",
}: AvatarSelectorProps) {
  return (
    <div className={`grid grid-cols-3 gap-4 ${className}`}>
      {avatars.map((avatar) => (
        <div
          key={avatar.id}
          className={`
            relative cursor-pointer transition-all duration-200
            ${
              selectedAvatar.id === avatar.id
                ? "ring-2 ring-blue-500 ring-offset-2"
                : "hover:ring-2 hover:ring-gray-300 hover:ring-offset-1"
            }
            rounded-lg p-2
          `}
          onClick={() => onAvatarSelect(avatar)}
          role="button"
          tabIndex={0}
          aria-label={`Select ${avatar.name} avatar`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onAvatarSelect(avatar);
            }
          }}
        >
          <AvatarDisplay
            avatar={avatar}
            size={size}
            showName={true}
            showTraits={false}
          />

          {/* Selection Indicator */}
          {selectedAvatar.id === avatar.id && (
            <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <Icons.x className="w-2 h-2 text-white rotate-45" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
