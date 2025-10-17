<<<<<<< HEAD
# ReBin Pro - AI-Powered Waste Sorting

ReBin Pro is an AI-powered waste sorting application that uses computer vision, reasoning, and voice output to teach users proper recycling habits. Upload a photo of waste items and get instant guidance on whether they should go in recycling, compost, or trash.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### 1. Clone and Setup
```bash
git clone <your-repo>
cd Rebin
cp env.example .env
```

### 2. Configure Environment
Edit `.env` with your API keys:
```bash
# Required: Get these from your service providers
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

### 3. Setup Supabase Database
Run these SQL commands in your Supabase SQL editor:

```sql
-- Create tables
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE,
  zip TEXT
);

CREATE TABLE sort_events (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  zip TEXT,
  items_json TEXT[],
  decision TEXT,
  co2e_saved FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE policies (
  zip TEXT PRIMARY KEY,
  rules_json JSONB
);

-- Insert sample policies
INSERT INTO policies (zip, rules_json) VALUES 
('10001', '{"recycling": ["plastic #1-2", "paper"], "compost": ["food", "yard"], "trash": ["styrofoam"]}'),
('94103', '{"recycling": ["glass", "paper", "metal"], "compost": ["food", "soiled paper"], "trash": ["film plastic"]}');
```

### 4. Run with Docker
```bash
docker-compose up --build
```

### 5. Access the App
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Location**: `frontend/`
- **Tech**: React 18, TypeScript, TailwindCSS, React Query
- **Features**: Camera upload, result display, stats dashboard
- **Components**: CameraUpload, ResultCard, StatsPanel

### Backend (FastAPI)
- **Location**: `backend/`
- **Tech**: FastAPI, Pydantic, Supabase, OpenRouter
- **Endpoints**:
  - `POST /infer` - Computer vision detection
  - `POST /explain` - AI reasoning for bin decisions
  - `POST /event` - Log sorting events

### Edge Layer (Cloudflare Worker)
- **Location**: `cloudflare-worker/`
- **Features**: Image resizing, ZIP-based policy lookup, request forwarding
- **Deploy**: `cd cloudflare-worker && npm run deploy`

### Mock CV Service
- **Location**: `services/cv-mock/`
- **Purpose**: Demo computer vision endpoint
- **Replace**: Point `GRADIENT_INFER_URL` to your actual YOLOv8n endpoint

## 🔧 Development

### Local Development (without Docker)
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev

# Mock CV Service
cd services/cv-mock
pip install -r requirements.txt
uvicorn app:app --reload --port 9000
```

### Environment Variables
- Copy `env.example` to `.env` in project root
- Copy `frontend/env.example` to `frontend/.env`
- Copy `backend/env.example` to `backend/.env`

## 📦 API Integration

### Computer Vision
Replace the mock service with your DigitalOcean Gradient YOLOv8n endpoint:
```bash
export GRADIENT_INFER_URL=https://your-gradient-endpoint.com/predict
```

### Reasoning
Uses OpenRouter for AI reasoning. Supports any model via OpenRouter API.

### Voice Output
ElevenLabs integration for text-to-speech feedback.

## 🚀 Deployment

### Production Docker
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Cloudflare Worker
```bash
cd cloudflare-worker
npm install
npm run deploy
```

### Environment Setup
1. Create Supabase project
2. Get OpenRouter API key
3. Get ElevenLabs API key
4. Deploy YOLOv8n model to DigitalOcean Gradient
5. Update environment variables

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📊 Features

- **AI Detection**: Computer vision identifies waste items
- **Smart Reasoning**: AI determines proper disposal method
- **Local Policies**: ZIP code-based recycling rules
- **Voice Feedback**: Spoken guidance via ElevenLabs
- **Progress Tracking**: User stats and environmental impact
- **Real-time Updates**: Live sorting results

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, TailwindCSS, React Query
- **Backend**: FastAPI, Python 3.11, Pydantic
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenRouter (GPT-4o-mini), DigitalOcean Gradient (YOLOv8n)
- **Voice**: ElevenLabs TTS
- **Edge**: Cloudflare Workers, KV Storage
- **Deployment**: Docker, Docker Compose

## 📝 License

MIT License - see LICENSE file for details.
=======
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
>>>>>>> 9fcf476ba76c90e21bbd3593ed4591a8d83d9fa5
