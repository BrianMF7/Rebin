"use client";

import { useState, useEffect, useRef } from "react";
import { Icons } from "../ui/icons";

interface SpeechBubbleProps {
  message: string;
  isVisible: boolean;
  avatarName: string;
  onDismiss: () => void;
}

export function SpeechBubble({
  message,
  isVisible,
  avatarName,
  onDismiss,
}: SpeechBubbleProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showDismissButton, setShowDismissButton] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Typewriter effect
  useEffect(() => {
    if (!isVisible || !message) {
      setDisplayedText("");
      setIsTyping(false);
      setShowDismissButton(false);
      return;
    }

    setIsTyping(true);
    setDisplayedText("");
    setShowDismissButton(false);

    let currentIndex = 0;
    const typingSpeed = 30; // milliseconds per character

    const typeNextCharacter = () => {
      if (currentIndex < message.length) {
        setDisplayedText(message.slice(0, currentIndex + 1));
        currentIndex++;
        typingTimeoutRef.current = setTimeout(typeNextCharacter, typingSpeed);
      } else {
        setIsTyping(false);
        // Show dismiss button after a short delay
        dismissTimeoutRef.current = setTimeout(() => {
          setShowDismissButton(true);
        }, 1000);
      }
    };

    // Start typing after a brief delay
    const startTypingTimeout = setTimeout(typeNextCharacter, 300);

    return () => {
      clearTimeout(startTypingTimeout);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, [message, isVisible]);

  if (!isVisible || !message) return null;

  return (
    <div
      className={`
        absolute bottom-24 right-0 w-80 max-w-[calc(100vw-2rem)] mb-2 speech-bubble
        transform transition-all duration-300 ease-out
        ${isVisible ? "speech-bubble-enter" : "speech-bubble-exit"}
      `}
      role="dialog"
      aria-label={`${avatarName} says: ${message}`}
      aria-live="polite"
    >
      {/* Speech Bubble */}
      <div className="relative bg-card border border-border rounded-2xl p-4 shadow-lg">
        {/* Avatar Name */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">
            {avatarName}
          </span>
        </div>

        {/* Message Text */}
        <div className="text-sm text-card-foreground leading-relaxed">
          <span>{displayedText}</span>
          {isTyping && (
            <span className="inline-block w-2 h-4 bg-primary ml-1 typing-indicator" />
          )}
        </div>

        {/* Dismiss Button */}
        {showDismissButton && (
          <button
            onClick={onDismiss}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-muted hover:bg-muted-foreground text-muted-foreground hover:text-background transition-all duration-200 flex items-center justify-center"
            aria-label="Dismiss message"
            title="Dismiss message"
          >
            <Icons.x className="w-3 h-3" />
          </button>
        )}

        {/* Speech Bubble Tail */}
        <div className="absolute bottom-0 right-6 transform translate-y-full">
          <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-card" />
        </div>
      </div>

      {/* Accessibility: Screen reader announcement */}
      <div className="sr-only" aria-live="polite">
        {avatarName} says: {message}
      </div>
    </div>
  );
}
