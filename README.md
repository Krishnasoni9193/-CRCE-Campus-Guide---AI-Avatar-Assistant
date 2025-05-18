🎥 CRCE Campus Guide - AI Avatar Assistant
A virtual campus guide for Fr. Conceicao Rodrigues College of Engineering (CRCE) using an AI-powered talking avatar.

🛠️ Setup
1. Get API Keys
D-ID API key from d-id.com
Gemini API key from Google AI Studio
2. Install & Configure
# Install dependencies
npm install

# Create api.json in project root
{
  "key": "your-d-id-key",
  "apiKey": "your-gemini-key",
  "url": "https://api.d-id.com",
  "voice_id": "en-US-JennyNeural"
}
3. Test Setup
# Test both APIs
node test_d-id.js
node test_openai.js
4. Run
node app.js
# Open http://localhost:3000
💬 Using the Guide
Click "Connect"
Ask questions about CRCE:
Admissions
Departments
Facilities
Campus life
🎮 Controls
Type or use 🎤 for questions
Press Enter/↵ to send
🌓 Toggle dark mode
Disconnect when done
⚠️ Troubleshooting
No Connection?
Check API keys in api.json
Verify D-ID credits
Check browser console (F12)
No Audio/Video?
Allow browser permissions
Check video file paths
Try Chrome/Firefox
AI Not Responding?
Check Gemini API key
Restart server
Clear browser cache
📱 Best Browsers
Chrome (Recommended)
Firefox
Edge
📄 License
MIT License
