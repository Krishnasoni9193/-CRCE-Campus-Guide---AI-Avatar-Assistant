# 🎥 CRCE Campus Guide - AI Avatar Assistant

A virtual campus guide for Fr. Conceicao Rodrigues College of Engineering (CRCE) using an AI-powered talking avatar.

## 🛠️ Setup

### 1. Get API Keys
- D-ID API key from [d-id.com](https://www.d-id.com)
- Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 2. Install & Configure
```bash
# Install dependencies
npm install

# Create api.json in project root
{
  "key": "your-d-id-key",
  "apiKey": "your-gemini-key",
  "url": "https://api.d-id.com",
  "voice_id": "en-US-JennyNeural"
}
```

### 3. Test Setup
```bash
# Test both APIs
node test_d-id.js
node test_openai.js
```

### 4. Run
```bash
node app.js
# Open http://localhost:3000
```

## 💬 Using the Guide

1. Click "Connect"
2. Ask questions about CRCE:
   - Admissions
   - Departments
   - Facilities
   - Campus life

## 🎮 Controls
- Type or use 🎤 for questions
- Press Enter/↵ to send
- 🌓 Toggle dark mode
- Disconnect when done

## ⚠️ Troubleshooting

### No Connection?
1. Check API keys in api.json
2. Verify D-ID credits
3. Check browser console (F12)

### No Audio/Video?
1. Allow browser permissions
2. Check video file paths
3. Try Chrome/Firefox

### AI Not Responding?
1. Check Gemini API key
2. Restart server
3. Clear browser cache

## 📱 Best Browsers
- Chrome (Recommended)
- Firefox
- Edge

## 📄 License
MIT License