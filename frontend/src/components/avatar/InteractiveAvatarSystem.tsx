"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AvatarCharacter } from "./AvatarCharacter";
import { SpeechBubble } from "./SpeechBubble";
import { useMessageQueue } from "./MessageQueue";
import { TTSController, TTSControllerRef } from "./TTSController";

export type AvatarPersonality = "friendly" | "enthusiastic" | "educational";
export type LandingSection = "hero" | "mission" | "features" | "impact";

interface AvatarState {
  currentAvatar: AvatarPersonality;
  isSpeaking: boolean;
  isListening: boolean;
  currentMessage: string;
  messageQueue: string[];
  isVisible: boolean;
  currentSection: LandingSection;
  isMinimized: boolean;
}

const AVATAR_CONFIG = {
  friendly: {
    name: "Green Gary",
    image: "/avatars/green-gary.png",
    color: "#22c55e",
    personality: "friendly" as AvatarPersonality,
  },
  enthusiastic: {
    name: "Eco Emma",
    image: "/avatars/eco-emma.png",
    color: "#FF9800",
    personality: "enthusiastic" as AvatarPersonality,
  },
  educational: {
    name: "Professor Pete",
    image: "/avatars/professor-pete.png",
    color: "#2196F3",
    personality: "educational" as AvatarPersonality,
  },
};

const SECTION_MESSAGES = {
  hero: {
    friendly: [
      "Welcome to ReBin! I'm here to help you sort waste like a pro! 🌱",
      "Ready to make a difference? Let's start your eco-journey together!",
      "Every item you sort correctly helps save our planet. Let me guide you!",
    ],
    enthusiastic: [
      "Hey there, eco-warrior! Ready to revolutionize your recycling game?",
      "This is going to be AMAZING! Let's turn waste into wonder together!",
      "I'm SO excited to help you make the biggest environmental impact ever!",
    ],
    educational: [
      "Welcome to ReBin. I'll provide you with accurate information about waste sorting.",
      "Let me explain how our AI-powered system can help you make informed decisions.",
      "Understanding proper waste classification is the first step toward sustainability.",
    ],
  },
  mission: {
    friendly: [
      "Our mission is simple: zero waste, 100% green! Want to join us?",
      "Together we can create a sustainable future. Every action counts!",
      "I believe in you! Small changes lead to big environmental impact.",
    ],
    enthusiastic: [
      "Our mission is INCREDIBLE! We're literally saving the planet!",
      "Zero waste, 100% green - and we're doing it TOGETHER!",
      "This is the most exciting mission ever! Let's make history!",
    ],
    educational: [
      "Our mission focuses on achieving zero waste through systematic classification.",
      "We employ data-driven approaches to maximize recycling efficiency.",
      "The goal is to create a comprehensive waste management ecosystem.",
    ],
  },
  features: {
    friendly: [
      "Check out our AI-powered features! They make recycling super easy.",
      "Instant recognition, smart tips, and progress tracking - all in one app!",
      "Our technology learns and improves with every item you sort.",
    ],
    enthusiastic: [
      "These features are ABSOLUTELY AMAZING! You're going to love them!",
      "AI-powered magic that makes recycling feel like a game!",
      "This technology is REVOLUTIONARY! It's like having a recycling superpower!",
    ],
    educational: [
      "Our AI system uses computer vision and machine learning for accurate classification.",
      "The platform provides real-time feedback and educational content.",
      "Advanced analytics help track your environmental impact over time.",
    ],
  },
  impact: {
    friendly: [
      "Look at the amazing impact our community is making! You could be next!",
      "Numbers don't lie - we're saving the planet, one item at a time!",
      "Join thousands of eco-warriors making a real difference!",
    ],
    enthusiastic: [
      "These numbers are INCREDIBLE! We're making MASSIVE changes!",
      "Look at what we've accomplished together! It's absolutely AMAZING!",
      "This impact is HUGE! You're part of something truly special!",
    ],
    educational: [
      "Our data shows measurable environmental improvements across all metrics.",
      "Statistical analysis confirms the effectiveness of our waste management approach.",
      "The cumulative impact demonstrates significant progress toward sustainability goals.",
    ],
  },
};

export function InteractiveAvatarSystem() {
  const [state, setState] = useState<AvatarState>({
    currentAvatar: "friendly",
    isSpeaking: false,
    isListening: false,
    currentMessage: "",
    messageQueue: [],
    isVisible: true,
    currentSection: "hero",
    isMinimized: false,
  });

  const messageQueue = useMessageQueue();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const ttsControllerRef = useRef<TTSControllerRef | null>(null);

  // Initialize intersection observer for section detection
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Clear any existing debounce timer
        clearTimeout(debounceTimer);

        // Debounce section changes to prevent rapid switching
        debounceTimer = setTimeout(() => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
              const sectionId = entry.target.id as LandingSection;
              if (sectionId && sectionId !== state.currentSection) {
                console.log(`Section changed to: ${sectionId}`);
                setState((prev) => ({ ...prev, currentSection: sectionId }));
              }
            }
          });
        }, 300); // 300ms debounce
      },
      { threshold: [0.3, 0.5, 0.7], rootMargin: "-20% 0px -20% 0px" }
    );

    // Observe all landing page sections with a delay to ensure DOM is ready
    const observeSections = () => {
      const sections = ["hero", "mission", "features", "impact"];
      sections.forEach((sectionId) => {
        const element = document.getElementById(sectionId);
        if (element && observerRef.current) {
          console.log(`Observing section: ${sectionId}`);
          observerRef.current.observe(element);
        } else {
          console.warn(`Section not found: ${sectionId}`);
        }
      });
    };

    // Try to observe immediately, then retry after a short delay
    observeSections();
    const retryTimer = setTimeout(observeSections, 1000);

    return () => {
      clearTimeout(retryTimer);
      clearTimeout(debounceTimer);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []); // Remove state.currentSection dependency to prevent re-creation

  // Track the last section that had a message to prevent duplicates
  const lastMessageSectionRef = useRef<string>("");
  const hasInitializedRef = useRef<boolean>(false);

  // Trigger messages when section changes
  useEffect(() => {
    const sectionKey = `${state.currentSection}-${state.currentAvatar}`;

    // Only add message if this is a new section/avatar combination or initial load
    if (
      sectionKey !== lastMessageSectionRef.current ||
      !hasInitializedRef.current
    ) {
      const messages =
        SECTION_MESSAGES[state.currentSection][state.currentAvatar];
      if (messages && messages.length > 0) {
        const randomMessage =
          messages[Math.floor(Math.random() * messages.length)];
        console.log(
          `Adding message for section ${state.currentSection} with avatar ${state.currentAvatar}: ${randomMessage}`
        );
        messageQueue.addMessage(randomMessage);
        lastMessageSectionRef.current = sectionKey;
        hasInitializedRef.current = true;
      }
    }
  }, [state.currentSection, state.currentAvatar, messageQueue]);

  // Update current message from message queue
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      currentMessage: messageQueue.currentText,
      isSpeaking: messageQueue.isProcessing,
    }));
  }, [messageQueue.currentText, messageQueue.isProcessing]);

  // Handle TTS completion
  const handleTTSComplete = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isSpeaking: false,
    }));
    // Don't clear currentMessage here - let the message queue handle it
    messageQueue.nextChunk();
  }, [messageQueue]);

  // Handle avatar click - cycle through avatars
  const handleAvatarClick = useCallback(() => {
    if (state.isMinimized) {
      setState((prev) => ({ ...prev, isMinimized: false }));
    } else {
      // Cycle through avatars: friendly -> enthusiastic -> educational -> friendly
      const avatarOrder: AvatarPersonality[] = [
        "friendly",
        "enthusiastic",
        "educational",
      ];
      const currentIndex = avatarOrder.indexOf(state.currentAvatar);
      const nextIndex = (currentIndex + 1) % avatarOrder.length;
      const nextAvatar = avatarOrder[nextIndex];

      setState((prev) => ({ ...prev, currentAvatar: nextAvatar }));

      // Clear the last message section ref to allow new message for same section with different avatar
      lastMessageSectionRef.current = "";

      // Trigger a message from the new avatar for current section
      const messages = SECTION_MESSAGES[state.currentSection][nextAvatar];
      if (messages && messages.length > 0) {
        const randomMessage =
          messages[Math.floor(Math.random() * messages.length)];
        console.log(
          `Avatar changed to ${nextAvatar}, adding message for section ${state.currentSection}: ${randomMessage}`
        );
        messageQueue.addMessage(randomMessage);
      }
    }
  }, [
    state.isMinimized,
    state.currentSection,
    state.currentAvatar,
    messageQueue,
  ]);

  // Handle minimize/maximize
  const handleToggleMinimize = useCallback(() => {
    setState((prev) => ({ ...prev, isMinimized: !prev.isMinimized }));
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !state.isMinimized) {
        handleToggleMinimize();
      }
    },
    [state.isMinimized, handleToggleMinimize]
  );

  // Add keyboard event listeners
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const currentConfig = AVATAR_CONFIG[state.currentAvatar];

  if (!state.isVisible) return null;

  return (
    <div
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
      role="complementary"
      aria-label="Interactive avatar assistant"
    >
      {/* Keyboard Shortcuts Help */}
      <div className="sr-only">
        <p>
          Keyboard shortcuts: Escape to minimize. Click avatar to cycle through
          personalities.
        </p>
      </div>
      <TTSController
        ref={ttsControllerRef}
        text={state.currentMessage}
        voicePersonality={state.currentAvatar}
        onComplete={handleTTSComplete}
        volume={0.7}
        isMuted={false}
      />

      <div
        className={`transition-all duration-300 ${
          state.isMinimized ? "scale-75 opacity-70" : "scale-100 opacity-100"
        }`}
      >
        {state.currentMessage && (
          <SpeechBubble
            message={state.currentMessage}
            isVisible={!!state.currentMessage}
            avatarName={currentConfig.name}
            onDismiss={() =>
              setState((prev) => ({ ...prev, currentMessage: "" }))
            }
          />
        )}

        <AvatarCharacter
          config={currentConfig}
          isSpeaking={state.isSpeaking}
          isListening={state.isListening}
          onClick={handleAvatarClick}
          onMinimize={handleToggleMinimize}
          isMinimized={state.isMinimized}
        />
      </div>
    </div>
  );
}
