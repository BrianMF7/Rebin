# 🎤 ReBin Pro Chatbot Feature

## Overview

The ReBin Pro chatbot feature converts AI-generated recycling explanations into engaging, natural speech using ElevenLabs TTS technology. Users can now listen to personalized explanations with different voice personalities.

## Features

### 🎯 Core Functionality

- **Voice Conversion**: Converts text explanations to natural speech
- **Voice Personalities**: Three distinct voice styles (Friendly, Enthusiastic, Educational)
- **Interactive Controls**: Play, pause, stop, and repeat audio
- **Fallback Support**: Text display when audio fails
- **Multi-item Support**: Listen to explanations for multiple items at once

### 🎨 Voice Personalities

1. **Friendly Guide** (`friendly`)

   - Warm, encouraging tone
   - Perfect for everyday use
   - Voice ID: `pNInz6obpgDQGcFmaJgB`

2. **Eco Enthusiast** (`enthusiastic`)

   - Excited and energetic about environmental impact
   - Great for engaging users
   - Voice ID: `EXAVITQu4vr4xnSDxMaL`

3. **Educational** (`educational`)
   - Clear, informative delivery
   - Ideal for learning environments
   - Voice ID: `VR6AewLTigWG4xSOukaG`

### 🎮 User Interface

#### Individual Item Listening

- Each `ResultCard` now includes a "🎤 Listen to Explanation" button
- Opens a modal with voice controls and personality selection
- Supports play/pause/stop/repeat functionality

#### Multiple Items Listening

- When multiple items are detected, a "🎤 Listen to All" button appears
- Provides a comprehensive explanation of all items
- Includes eco tips and environmental impact information

### 🔧 Technical Implementation

#### Backend Components

1. **Enhanced ElevenLabs Client** (`backend/utils/elevenlabs_client.py`)

   - Multiple voice personality support
   - Proper audio data handling
   - Base64 encoding for web delivery
   - Error handling and fallbacks

2. **Chatbot Route** (`backend/routes/chatbot.py`)

   - `POST /chatbot/speak` - Generate speech from decisions
   - `GET /chatbot/voices` - Get available voice options
   - Input validation and sanitization
   - Rate limiting (max 10 items per request)

3. **Updated Schemas** (`backend/schemas.py`)
   - `ChatbotRequest` - Input model with voice preferences
   - `ChatbotResponse` - Output model with audio and text

#### Frontend Components

1. **ChatbotInterface** (`frontend/src/components/ChatbotInterface.tsx`)

   - Modal interface for voice controls
   - Voice personality selection
   - Audio playback controls
   - Fallback text display

2. **Enhanced ResultCard** (`frontend/src/components/ResultCard.tsx`)

   - Individual "Listen" button
   - Integration with ChatbotInterface

3. **Updated CameraUpload** (`frontend/src/components/CameraUpload.tsx`)

   - Global "Listen to All" button for multiple items
   - Integration with ChatbotInterface

4. **API Client** (`frontend/src/lib/api.ts`)
   - `speakDecisions()` - Generate speech from decisions
   - `getAvailableVoices()` - Fetch voice options

### 🛡️ Security & Best Practices

#### Input Validation

- Text sanitization to prevent injection attacks
- Character limits (1000 chars max)
- Rate limiting (max 10 items per request)

#### Error Handling

- Graceful fallback to text when TTS fails
- Comprehensive error logging
- User-friendly error messages

#### Performance

- Efficient audio generation
- Proper cleanup of audio resources
- Optimized for mobile devices

### 🚀 Usage Examples

#### Basic Usage

```typescript
// Generate speech for a single item
const response = await apiClient.speakDecisions([decision], {
  voice_personality: "friendly",
  include_eco_tips: true,
});

// Play the audio
if (response.audio_url) {
  const audio = new Audio(response.audio_url);
  audio.play();
}
```

#### Advanced Usage

```typescript
// Generate speech for multiple items with custom settings
const response = await apiClient.speakDecisions(decisions, {
  voice_personality: "enthusiastic",
  include_eco_tips: false,
});

// Handle fallback
if (!response.audio_url) {
  console.log("Fallback text:", response.fallback_text);
}
```

### 🔧 Configuration

#### Environment Variables

```bash
# Required for TTS functionality
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

#### Voice Customization

Voice personalities can be customized in `backend/utils/elevenlabs_client.py`:

```python
VOICE_PERSONALITIES = {
    "friendly": {
        "voice_id": "pNInz6obpgDQGcFmaJgB",
        "voice_settings": {
            "stability": 0.6,
            "similarity_boost": 0.7,
            "style": 0.3,
            "use_speaker_boost": True
        }
    },
    # ... other personalities
}
```

### 🧪 Testing

#### Backend Testing

```bash
cd backend
source venv/bin/activate
python -c "from main import app; print('✅ Backend imports successfully')"
```

#### Frontend Testing

```bash
cd frontend
npm run build
```

#### API Testing

```bash
# Test the chatbot endpoint
curl -X POST "http://localhost:8000/chatbot/speak" \
  -H "Content-Type: application/json" \
  -d '{
    "decisions": [{
      "label": "plastic bottle",
      "bin": "recycling",
      "explanation": "This plastic bottle can be recycled",
      "eco_tip": "Recycling one bottle saves energy"
    }],
    "voice_personality": "friendly",
    "include_eco_tips": true
  }'
```

### 🎯 Success Criteria

✅ **Functional**: Users can hear recycling explanations in natural speech  
✅ **Engaging**: Voice personality makes the experience fun and memorable  
✅ **Reliable**: Graceful fallbacks when TTS fails  
✅ **Accessible**: Works for users with different abilities  
✅ **Performant**: Fast audio generation and playback  
✅ **Secure**: No security vulnerabilities in implementation

### 🔮 Future Enhancements

- **Internationalization**: Support for multiple languages
- **Voice Customization**: Allow users to choose voice characteristics
- **Analytics**: Track usage patterns for improvement
- **Mobile Optimization**: Enhanced mobile experience
- **Offline Support**: Consider offline audio capabilities
- **Voice Cloning**: Custom voice creation for brands

### 📝 Notes

- The feature maintains backward compatibility with existing functionality
- All existing API endpoints remain unchanged
- The chatbot feature is optional and gracefully degrades when unavailable
- Audio files are generated on-demand and not cached (for security)
- The implementation follows the existing codebase patterns and security practices

---

**Implementation Date**: December 2024  
**Version**: 1.0.0  
**Status**: ✅ Complete and Ready for Production
