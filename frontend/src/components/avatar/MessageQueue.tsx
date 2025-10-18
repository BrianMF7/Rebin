"use client";

import { useState, useEffect, useCallback } from "react";

interface MessageQueueProps {
  messages: string[];
  onMessageComplete: () => void;
  onQueueEmpty: () => void;
  isProcessing: boolean;
}

interface MessageChunk {
  text: string;
  isComplete: boolean;
}

// Hook for using the message queue
export function useMessageQueue() {
  const [messages, setMessages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [chunks, setChunks] = useState<MessageChunk[]>([]);
  const [isDisplayingChunk, setIsDisplayingChunk] = useState(false);

  // Split message into chunks at natural pause points
  const splitIntoChunks = useCallback((message: string): string[] => {
    // Split at natural pause points: periods, exclamation marks, question marks, and some commas
    const pausePoints = /[.!?]|,\s+(?=\w{3,})/g;
    const sentences = message
      .split(pausePoints)
      .filter((s) => s.trim().length > 0);

    const chunks: string[] = [];
    let currentChunk = "";

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      // If adding this sentence would make the chunk too long, start a new chunk
      if (currentChunk && (currentChunk + trimmedSentence).length > 15) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmedSentence;
      } else {
        currentChunk += (currentChunk ? " " : "") + trimmedSentence;
      }
    }

    // Add the last chunk if it has content
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [message];
  }, []);

  // Process current message into chunks
  useEffect(() => {
    if (messages.length > 0 && currentMessageIndex < messages.length) {
      const currentMessage = messages[currentMessageIndex];
      const messageChunks = splitIntoChunks(currentMessage);
      setChunks(messageChunks.map((text) => ({ text, isComplete: false })));
      setCurrentChunkIndex(0);
      setIsDisplayingChunk(false);
    }
  }, [messages, currentMessageIndex, splitIntoChunks]);

  // Display current chunk - let TTS controller handle timing
  useEffect(() => {
    if (
      chunks.length > 0 &&
      currentChunkIndex < chunks.length &&
      !isProcessing
    ) {
      setIsDisplayingChunk(true);
      // Don't set automatic timers - let TTS completion handle progression
    }
  }, [chunks, currentChunkIndex, isProcessing]);

  // Check if queue is empty
  useEffect(() => {
    if (currentMessageIndex >= messages.length && messages.length > 0) {
      setMessages([]);
      setCurrentText("");
      setIsTyping(false);
      setCurrentMessageIndex(0);
      setCurrentChunkIndex(0);
      setChunks([]);
      setIsDisplayingChunk(false);
    }
  }, [currentMessageIndex, messages.length]);

  // Update current text when chunks change
  useEffect(() => {
    if (chunks.length > 0 && currentChunkIndex < chunks.length) {
      setCurrentText(chunks[currentChunkIndex].text);
      setIsTyping(isDisplayingChunk && !isProcessing);
    } else {
      setCurrentText("");
      setIsTyping(false);
    }
  }, [chunks, currentChunkIndex, isDisplayingChunk, isProcessing]);

  const addMessage = useCallback((message: string) => {
    setMessages((prev) => [...prev, message]);
    setIsProcessing(true);
  }, []);

  const addMessages = useCallback((newMessages: string[]) => {
    setMessages((prev) => [...prev, ...newMessages]);
    setIsProcessing(true);
  }, []);

  const clearQueue = useCallback(() => {
    setMessages([]);
    setCurrentText("");
    setIsTyping(false);
    setIsProcessing(false);
    setCurrentMessageIndex(0);
    setCurrentChunkIndex(0);
    setChunks([]);
    setIsDisplayingChunk(false);
  }, []);

  const nextChunk = useCallback(() => {
    if (chunks.length > 0 && currentChunkIndex < chunks.length - 1) {
      // Move to next chunk
      setCurrentChunkIndex((prev) => prev + 1);
      setIsDisplayingChunk(false);
    } else if (currentMessageIndex < messages.length - 1) {
      // Move to next message
      setCurrentMessageIndex((prev) => prev + 1);
      setCurrentChunkIndex(0);
      setIsDisplayingChunk(false);
    } else {
      // No more messages, clear queue
      clearQueue();
    }
  }, [
    chunks.length,
    currentChunkIndex,
    currentMessageIndex,
    messages.length,
    clearQueue,
  ]);

  return {
    currentText,
    isTyping,
    isProcessing,
    addMessage,
    addMessages,
    clearQueue,
    nextChunk,
    queueLength: messages.length,
  };
}

// Legacy component for backward compatibility
export function MessageQueue({ messages, onQueueEmpty }: MessageQueueProps) {
  const messageQueue = useMessageQueue();

  // Sync with external state
  useEffect(() => {
    if (messages.length > 0) {
      messageQueue.addMessages(messages);
    }
  }, [messages, messageQueue]);

  useEffect(() => {
    if (!messageQueue.isProcessing && messageQueue.queueLength === 0) {
      onQueueEmpty();
    }
  }, [messageQueue.isProcessing, messageQueue.queueLength, onQueueEmpty]);

  return {
    getCurrentChunkText: () => messageQueue.currentText,
    getDisplayStatus: () => ({
      hasMessage: messageQueue.queueLength > 0,
      currentText: messageQueue.currentText,
      isTyping: messageQueue.isTyping,
      progress: 0,
    }),
    reset: messageQueue.clearQueue,
  };
}
