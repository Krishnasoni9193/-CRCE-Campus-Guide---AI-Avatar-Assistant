// streaming-client-api.js
'use strict';

class VideoAgent {
  constructor() {
    this.peerConnection = null;
    this.streamId = null;
    this.sessionId = null;
    this.statsIntervalId = null;
    this.API_CONFIG = null;
    this.DID_API_URL = 'Your url';
    this.lastBytesReceived = 0;
    this.videoIsPlaying = false;
    this.recognition = null;
    this.isRecording = false;

    this.idleVideo = document.getElementById('idle-video');
    this.talkVideo = document.getElementById('talk-video');

    this.init();
  }

  async init() {
    try {
      const response = await fetch('./api.json');
      this.API_CONFIG = await response.json();

      if (!this.API_CONFIG?.key) throw new Error('Missing D-ID API key in api.json');
      if (!this.API_CONFIG?.apiKey) throw new Error('Missing OpenAI API key in api.json');
      if (this.API_CONFIG.url) this.DID_API_URL = this.API_CONFIG.url;

      this.talkVideo.setAttribute('playsinline', '');
      this.setupEventListeners();

      console.log('Initialized successfully');
    } catch (error) {
      this.showError(`Initialization failed: ${error.message}`);
    }
  }

  setupEventListeners() {
    document.getElementById('connect-button').addEventListener('click', () => this.handleConnect());
    document.getElementById('destroy-button').addEventListener('click', () => this.handleDestroy());
    document.getElementById('enter-button').addEventListener('click', () => this.handleTalk());
    document.getElementById('user-input-field').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleTalk();
    });
  
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      if (document.body.classList.contains('dark-mode')) {
        themeToggle.innerText = 'Light Mode';
      } else {
        themeToggle.innerText = 'Dark Mode';
      }
    });

    const micButton = document.getElementById('mic-button');
    micButton.addEventListener('click', () => this.toggleMicrophone());

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('user-input-field').value = transcript;
        this.handleTalk();
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        document.getElementById('mic-button').classList.remove('recording');
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.isRecording = false;
        document.getElementById('mic-button').classList.remove('recording');
        alert('Speech recognition error. Please try again.');
      };
    }
  }

  async handleConnect() {
    const connectButton = document.getElementById('connect-button');
    connectButton.classList.add('loading');
  
    try {
      if (this.peerConnection?.connectionState === 'connected') return;
  
      this.cleanup();
  
      const response = await this.createStream();
      const { id, offer, ice_servers, session_id } = await response.json();
      this.streamId = id;
      this.sessionId = session_id;
  
      const answer = await this.createPeerConnection(offer, ice_servers);
      await this.sendSDPAnswer(answer);
  
      // Ensure the loading class is removed
      connectButton.classList.remove('loading');
      connectButton.classList.add('connected');
  
      this.updateUI(true);
      document.getElementById('user-input-field').focus();
    } catch (error) {
      this.showError(`Connection failed: ${error.message}`);
      connectButton.classList.remove('loading', 'connected');
      this.cleanup();
    }

  }

  async handleTalk() {
    try {
      const userMessage = document.getElementById('user-input-field').value.trim();
      if (!userMessage) throw new Error('Please enter a message');
  
      // Add a loading animation to the input field
      document.getElementById('input-container').classList.add('loading');
  
      const { fetchGeminiResponse } = await import('./openai.js');
  
  
      const aiResponse = await fetchGeminiResponse(this.API_CONFIG.apiKey, userMessage);
  
      const talkResponse = await fetch(`${this.DID_API_URL}/talks/streams/${this.streamId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(this.API_CONFIG.key + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          script: {
            type: 'text',
            input: aiResponse,
            provider: {
              type: 'microsoft',
              voice_id: this.API_CONFIG.voice_id
            }
          },
          config: { fluent: true, stitch: true },
          driver_url: 'bank://lively/',
          session_id: this.sessionId
        })
      });
  
      const responseData = await talkResponse.json();
  
      // Remove the loading animation after we receive the response
      document.getElementById('input-container').classList.remove('loading');
  
      if (!talkResponse.ok) throw new Error('Failed to send to D-ID');
  
      document.getElementById('user-input-field').value = '';
    } catch (error) {
      console.error('Talk Error:', error);
      alert(`Error: ${error.message}`);
  
      // Remove the loading animation in case of an error
      document.getElementById('input-container').classList.remove('loading');
    }
  }

  async handleDestroy() {
    const connectButton = document.getElementById('connect-button');

    try {
      if (this.streamId) {
        await this.deleteStream();
      }
    } catch (error) {
      console.error('Destroy error:', error);
    } finally {
      this.cleanup();
      this.updateUI(false);
      connectButton.classList.remove('connected', 'loading');
    }
  }

  async createStream() {
    // NOTE: Stream creation not implemented in open source version
    // You'll need to implement your own stream creation logic here
    throw new Error('Stream creation not implemented. Please implement your own stream creation logic.');
  }
  
  async createPeerConnection(offer, iceServers) {
    const RTCPeerConnection = (
      window.RTCPeerConnection ||
      window.webkitRTCPeerConnection ||
      window.mozRTCPeerConnection
    ).bind(window);
  
    this.peerConnection = new RTCPeerConnection({ iceServers });
  
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        fetch(`${this.DID_API_URL}/talks/streams/${this.streamId}/ice`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(this.API_CONFIG.key + ':')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            session_id: this.sessionId,
          }),
        }).catch(console.error);
      }
    };
  
    this.peerConnection.ontrack = (event) => {
      if (event.track.kind === 'video') {
        this.statsIntervalId = setInterval(async () => {
          const stats = await this.peerConnection.getStats(event.track);
          stats.forEach((report) => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              const isPlaying = report.bytesReceived > this.lastBytesReceived;
              if (isPlaying !== this.videoIsPlaying) {
                this.videoIsPlaying = isPlaying;
                this.updateStatus('streaming', isPlaying ? 'streaming' : 'idle');
  
                if (isPlaying) {
                  this.idleVideo.style.display = 'none';
                  this.talkVideo.style.display = 'block';
                  this.talkVideo.srcObject = event.streams[0];
                  this.talkVideo.play().catch(console.error);
                } else {
                  this.talkVideo.pause();
                  this.talkVideo.srcObject = null;
                  this.talkVideo.style.display = 'none';
                  this.idleVideo.style.display = 'block';
                }
              }
              this.lastBytesReceived = report.bytesReceived;
            }
          });
        }, 500);
      }
    };
  
    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }
  
  async sendSDPAnswer(answer) {
    return fetch(`${this.DID_API_URL}/talks/streams/${this.streamId}/sdp`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(this.API_CONFIG.key + ':')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        answer: answer,
        session_id: this.sessionId
      })
    });
  }
 
  async sendTalkRequest(aiResponse) {
    return fetch(`${this.DID_API_URL}/talks/streams/${this.streamId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(this.API_CONFIG.key + ':')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        script: {
          type: 'text',
          input: aiResponse,
          provider: {
            type: 'microsoft',
            voice_id: this.API_CONFIG.voice_id
          }
        },
        config: { fluent: true, stitch: true },
        driver_url: 'bank://lively/',
        session_id: this.sessionId
      })
    });
  }
  
  async deleteStream() {
    return fetch(`${this.DID_API_URL}/talks/streams/${this.streamId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${btoa(this.API_CONFIG.key + ':')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ session_id: this.sessionId })
    });
  }
  
  cleanup() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  
    this.talkVideo.pause();
    this.talkVideo.srcObject = null;
    this.talkVideo.style.display = 'none';
    this.idleVideo.style.display = 'block';
  
    const video = document.getElementById('talk-video');
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
  
    if (this.statsIntervalId) {
      clearInterval(this.statsIntervalId);
      this.statsIntervalId = null;
    }
  
    ['peer', 'ice', 'iceGathering', 'signaling', 'streaming'].forEach(type => {
      this.updateStatus(type, type === 'signaling' ? 'stable' : 'disconnected');
    });
  }
  
  updateUI(connected) {
    const connectButton = document.getElementById('connect-button');
    const destroyButton = document.getElementById('destroy-button');
    
    destroyButton.disabled = !connected;
    
    if (connected) {
      connectButton.classList.add('connected');
      connectButton.innerText = 'Connected';
    } else {
      connectButton.classList.remove('connected', 'loading');
      connectButton.innerText = 'Connect';
    }
  }
  
  updateStatus(type, state) {
    const label = document.getElementById(`${type}-status-label`);
    if (!label) return;
    label.innerText = state;
    label.className = `${type}-${state}`;
  }
  
  showError(message) {
    alert(message);
    console.error(message);
  }

  toggleMicrophone() {
    if (!this.recognition) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    const micButton = document.getElementById('mic-button');

    if (this.isRecording) {
      this.recognition.stop();
      this.isRecording = false;
      micButton.classList.remove('recording');
    } else {
      this.recognition.start();
      this.isRecording = true;
      micButton.classList.add('recording');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new VideoAgent());
