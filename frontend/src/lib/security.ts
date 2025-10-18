/**
 * Security utilities for avatar handling and content validation
 */

/**
 * Validates avatar URL to ensure it's safe and from allowed sources
 */
export function validateAvatarUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);

    // Allow data URLs for fallback avatars
    if (urlObj.protocol === "data:") {
      return (
        url.startsWith("data:image/svg+xml;base64,") ||
        url.startsWith("data:image/png;base64,") ||
        url.startsWith("data:image/jpeg;base64,")
      );
    }

    // Allow relative URLs (for local assets)
    if (url.startsWith("/")) {
      return true;
    }

    // Allow HTTPS URLs from same origin or trusted domains
    if (urlObj.protocol === "https:") {
      const allowedDomains = [
        window.location.hostname,
        "localhost",
        "127.0.0.1",
        // Add other trusted domains as needed
      ];

      return allowedDomains.some(
        (domain) =>
          urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Sanitizes avatar configuration data to prevent XSS
 */
export function sanitizeAvatarConfig(config: any): any {
  if (!config || typeof config !== "object") {
    return null;
  }

  const sanitized = { ...config };

  // Sanitize string fields
  const stringFields = [
    "id",
    "name",
    "description",
    "gender",
    "voice_personality",
    "avatar_url",
    "color_theme",
  ];
  stringFields.forEach((field) => {
    if (sanitized[field] && typeof sanitized[field] === "string") {
      sanitized[field] = sanitizeString(sanitized[field]);
    }
  });

  // Sanitize array fields
  if (Array.isArray(sanitized.personality_traits)) {
    sanitized.personality_traits = sanitized.personality_traits
      .filter((trait: any) => typeof trait === "string")
      .map((trait: any) => sanitizeString(trait))
      .slice(0, 10); // Limit to 10 traits
  }

  // Validate and sanitize animation styles
  if (
    sanitized.animation_styles &&
    typeof sanitized.animation_styles === "object"
  ) {
    const allowedStyles = ["idle", "speaking", "listening"];
    const sanitizedStyles: any = {};

    allowedStyles.forEach((style) => {
      if (
        sanitized.animation_styles[style] &&
        typeof sanitized.animation_styles[style] === "string"
      ) {
        sanitizedStyles[style] = sanitizeString(
          sanitized.animation_styles[style]
        );
      }
    });

    sanitized.animation_styles = sanitizedStyles;
  }

  return sanitized;
}

/**
 * Sanitizes a string to prevent XSS attacks
 */
function sanitizeString(str: string): string {
  return str
    .replace(/[<>\"'&]/g, (match) => {
      const escapeMap: { [key: string]: string } = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "&": "&amp;",
      };
      return escapeMap[match];
    })
    .slice(0, 500); // Limit length
}

/**
 * Validates color theme hex code
 */
export function validateColorTheme(color: string): boolean {
  if (!color || typeof color !== "string") {
    return false;
  }

  // Check if it's a valid hex color
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexColorRegex.test(color);
}

/**
 * Creates a safe fallback avatar configuration
 */
export function createFallbackAvatarConfig(personalityId: string): any {
  const fallbackConfigs: { [key: string]: any } = {
    friendly: {
      id: "friendly-fallback",
      name: "Green Gary",
      description: "Friendly recycling guide",
      gender: "male",
      voice_personality: "friendly",
      avatar_url: "/avatars/green-gary.png",
      personality_traits: ["friendly", "helpful"],
      color_theme: "#4CAF50",
      animation_styles: {
        idle: "animate-pulse",
        speaking: "animate-pulse scale-105",
        listening: "animate-bounce",
      },
    },
    enthusiastic: {
      id: "enthusiastic-fallback",
      name: "Eco Emma",
      description: "Energetic eco enthusiast",
      gender: "female",
      voice_personality: "enthusiastic",
      avatar_url: "/avatars/eco-emma.png",
      personality_traits: ["energetic", "passionate"],
      color_theme: "#FF9800",
      animation_styles: {
        idle: "animate-pulse",
        speaking: "animate-pulse scale-105",
        listening: "animate-bounce",
      },
    },
    educational: {
      id: "educational-fallback",
      name: "Professor Pete",
      description: "Educational waste expert",
      gender: "male",
      voice_personality: "educational",
      avatar_url: "/avatars/professor-pete.png",
      personality_traits: ["knowledgeable", "clear"],
      color_theme: "#2196F3",
      animation_styles: {
        idle: "animate-pulse",
        speaking: "animate-pulse scale-105",
        listening: "animate-bounce",
      },
    },
  };

  return fallbackConfigs[personalityId] || fallbackConfigs.friendly;
}

/**
 * Validates avatar configuration structure
 */
export function validateAvatarConfig(config: any): boolean {
  if (!config || typeof config !== "object") {
    return false;
  }

  const requiredFields = [
    "id",
    "name",
    "description",
    "gender",
    "voice_personality",
    "avatar_url",
    "color_theme",
  ];

  // Check required fields
  for (const field of requiredFields) {
    if (!config[field] || typeof config[field] !== "string") {
      return false;
    }
  }

  // Validate specific fields
  if (!["male", "female", "neutral"].includes(config.gender)) {
    return false;
  }

  if (!validateColorTheme(config.color_theme)) {
    return false;
  }

  if (!validateAvatarUrl(config.avatar_url)) {
    return false;
  }

  // Validate personality traits
  if (config.personality_traits && !Array.isArray(config.personality_traits)) {
    return false;
  }

  return true;
}

/**
 * Content Security Policy helper for avatar images
 */
export function getCSPDirectiveForAvatars(): string {
  return "img-src 'self' data: https:;";
}

/**
 * Preloads avatar images for better performance
 */
export function preloadAvatarImages(avatars: any[]): Promise<void[]> {
  const preloadPromises = avatars.map((avatar) => {
    return new Promise<void>((resolve) => {
      if (!avatar.avatar_url || !validateAvatarUrl(avatar.avatar_url)) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Don't fail on image load errors
      img.src = avatar.avatar_url;
    });
  });

  return Promise.all(preloadPromises);
}
