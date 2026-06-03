<div align="center">

# 🎬 SmartGallery - AI Event Gallery & Cinematic Reels

![Python](https://img.shields.io/badge/Python-3.9%2B-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?logo=vite&logoColor=FFD62E)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?logo=mongodb&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?logo=opencv&logoColor=white)
![MoviePy](https://img.shields.io/badge/MoviePy-FF0000?logo=youtube&logoColor=white)

**A next-generation event gallery platform powered by Facial Recognition, Computer Vision, and Generative AI for automatic cinematic reel creation.**

[🚀 Features](#-key-features--use-cases) • [🛠️ Tech Stack](#️-technology-stack) • [📦 Setup](#️-how-to-setup--run) • [📁 Structure](#-project-structure)

</div>

---

## 🚀 Key Features & Use Cases

1. **Smart Guest Gallery**: A highly polished, luxury minimalist gallery where guests can view event photos organized beautifully by folders/categories.
2. **AI Facial Recognition Search**: Guests no longer need to scroll through hundreds of photos. They can upload a quick selfie, and the system instantly finds every photo they are in using DeepFace/InsightFace models.
3. **Cinematic Reel Studio**: Guests can select their favorite photos, choose a trending song (integrated with YouTube Music), and our AI will automatically generate a highly polished, beat-synced cinematic video reel (with auto-zoom, transitions, and pulsing effects) ready for social media.
4. **Automated Admin Dashboard**: Event organizers can easily create events, upload bulk photos via ZIP files, and manage their portfolio effortlessly.
5. **AI Semantic Search (Backend)**: Capability to search photos by natural language descriptions (e.g., "bride smiling", "people dancing").

---

## 🛠️ Technology Stack

### Frontend
* **React + Vite**: High-performance modern web framework.
* **Tailwind CSS**: For crafting the beautiful, responsive, luxury dark-mode aesthetic.
* **Framer Motion**: For buttery-smooth page transitions and micro-animations.
* **Lucide React**: Premium iconography.
* **Axios**: API communication.

### Backend
* **FastAPI (Python)**: Ultra-fast backend API framework.
* **MongoDB**: NoSQL database for flexible data storage.
* **OpenCV & DeepFace**: For advanced facial recognition, face detection, and image processing.
* **Transformers (Hugging Face)**: For semantic image tagging and text-based searching.
* **MoviePy & FFmpeg**: For dynamic, beat-synced programmatic video (Reel) generation.
* **yt-dlp & ytmusicapi**: To fetch and stream high-quality audio tracks directly from YouTube for Reel generation.

---

## ⚙️ How to Setup & Run

### 1. Prerequisites
* **Python 3.9+**
* **Node.js 18+**
* **MongoDB** (running locally or via MongoDB Atlas)
* **FFmpeg** installed and added to system PATH.

### 2. Backend Setup
Open a terminal and follow these steps:
```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment (Windows)
venv\Scripts\activate
# (For Mac/Linux use: source venv/bin/activate)

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --port 8001 --reload
# (Or use: python -m uvicorn main:app --port 8001 --reload)
```
*The backend will run on http://localhost:8001*

### 3. Frontend Setup
Open a **new** terminal and follow these steps:
```bash
# Navigate to the frontend directory
cd frontend

# Install Node modules
npm install

# Start the Vite development server
npm run dev
```
*The frontend will typically run on http://localhost:5173*

---

## 📂 Project Structure

A highly modular, scalable monorepo structure separating the React client and FastAPI server.

```text
AuraVision-AI-Powered-Smart-Gallery/
├── frontend/                     # React Frontend (Vite)
│   ├── src/
│   │   ├── assets/               # Static assets & images
│   │   ├── components/           # Reusable UI components (BulkUpload, etc.)
│   │   ├── pages/                # Application routes
│   │   │   ├── LandingPage.jsx   # Hero section & login
│   │   │   ├── AdminDashboard.jsx# Event management & uploads
│   │   │   ├── GuestPortal.jsx   # Smart Selfie Search page
│   │   │   ├── GuestGallery.jsx  # Event gallery view
│   │   │   └── CinematicStudio.jsx # Video Reel Generator UI
│   │   ├── App.jsx               # Main React router
│   │   └── main.jsx              # Application entry point & Axios config
│   ├── tailwind.config.js        # UI styling definitions
│   └── vite.config.js            # Build & proxy configuration
│
├── backend/                      # FastAPI Backend (Python)
│   ├── routers/                  # API Endpoints
│   │   ├── auth.py               # JWT authentication
│   │   ├── events.py             # Event CRUD operations
│   │   ├── guest.py              # Guest access & semantic search
│   │   ├── media.py              # Photo uploads & processing
│   │   └── reels.py              # Cinematic video generation API
│   ├── services/                 # Core Business Logic & AI
│   │   ├── ai_pipeline.py        # Facial recognition (OpenCV/Yunet)
│   │   ├── reel_generator.py     # MoviePy beat-synced compilation
│   │   ├── semantic.py           # Text-to-image semantic search
│   │   └── vector_db.py          # FAISS indexing for fast retrieval
│   ├── database.py               # MongoDB Async Motor connection
│   ├── main.py                   # FastAPI application initialization
│   ├── requirements.txt          # Python dependencies
│   └── uploads/                  # Local storage for media (dev only)
│
├── render.yaml                   # Automated Render CI/CD deployment blueprint
└── .gitignore                    # Git exclusions
```

---
*Built for the future of events.*
