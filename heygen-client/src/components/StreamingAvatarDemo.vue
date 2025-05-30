<template>
  <div class="StreamingAvatar">
    <div class="StreamingAvatar--tabs">
      <button :class="['tab-btn', { active: currentDemo === 'streaming' }]" @click="setCurrentDemo('streaming')">Streaming Avatar API Demo</button>
      <button :class="['tab-btn', { active: currentDemo === 'video' }]" @click="setCurrentDemo('video')">Pre-Rendered Video Generator API Demo</button>
    </div>

    <div v-if="currentDemo === 'streaming'">
      <h2>Streaming Avatar</h2>

      <div class="StreamingAvatar--picker" v-if="avatars.length && !started" style="margin-bottom: 1rem">
        <label for="avatar-select">Pick an avatar:</label>
        <select id="avatar-select" v-model="selectedAvatar">
          <option v-for="a in avatars" :key="a.avatar_id" :value="a.avatar_id">
            {{ a.avatar_id }}
          </option>
        </select>
      </div>

      <div class="StreaminAvatar--container">
        <video ref="video" autoplay playsinline style="border-radius: 15px; width: 320px; height: 480px; background: #000"></video>

        <div class="StreamingAvatar--console" ref="consoleContainer">
          <div class="StreamingAvatar--console-title">Console</div>
          <div class="StreamingAvatar--console-logs" v-for="log in logs" :key="log.id">
            <div class="StreamingAvatar--console-log-message">{{ log.message }}</div>
          </div>
        </div>
      </div>

      <div class="StreamingAvatar--controls">
        <button @click="startStreamingSession" :disabled="isLoadingSession || started">Start Avatar</button>
        <button @click="stopStreamingSession" :disabled="!started">Stop Avatar</button>
        <div class="StreamingAvatar--chat">
          <input class="StreamingAvatar--chat--input" @keyup.enter="handleSpeak" type="text" placeholder="Enter text" v-model="avatarNextText" />
          <button @click="handleSpeak" :disabled="!started">Send</button>
        </div>
      </div>

      <div class="StreamingAvatar--toggle-container">
        <div class="StreamingAvatar--repeat">
          <label>
            <input type="checkbox" v-model="repeat" class="repeat-checkbox" />
            <span class="repeat-label">
              Toggle to have avatar repeat your text
              <span v-if="repeat" class="repeat-status on">ON</span>
              <span v-else class="repeat-status off">OFF</span>
            </span>
          </label>
        </div>
      </div>

      <div class="StreamingAvatarStatus" v-if="isLoadingSession || started">
        <div v-if="isLoadingSession">Loading{{ loadingDots }}</div>
        <div v-else-if="started">
          <div>Session ID: {{ sessionId }}</div>
          <div>Avatar: {{ selectedAvatar }}</div>
        </div>
      </div>
    </div>
    <div v-else-if="currentDemo === 'video'">
      <h2>Video Generator</h2>
      <div class="VideoGeneratorDemo"></div>
      <div class="StreamingAvatar--picker" v-if="videoAvatars.length && !started" style="margin-bottom: 1rem">
        <label for="avatar-select">Pick an avatar:</label>
        <select id="avatar-select" v-model="selectedAvatar">
          <option v-for="a in videoAvatars" :key="a.avatar_id" :value="a.avatar_id">{{ a.avatar_name }}</option>
        </select>
      </div>

      <div class="StreamingAvatar--picker" v-if="voices.length && !started" style="margin-bottom: 1rem">
        <label for="voice-select">Pick a voice:</label>
        <select id="voice-select" v-model="selectedVoice">
          <option v-for="v in voices" :key="v.voice_id" :value="v.voice_id">{{ v.name || v.voice_id }} ({{ v.language }}, {{ v.gender }})</option>
        </select>
      </div>

      <div class="StreaminAvatar--container">
        <video ref="video2" autoplay playsinline controls style="border-radius: 15px; width: 320px; height: 480px; background: #000" />

        <div class="StreamingAvatar--console" ref="consoleContainer">
          <div class="StreamingAvatar--console-title">Console</div>
          <div class="StreamingAvatar--console-logs" v-for="log in logs" :key="log.id">
            <div class="StreamingAvatar--console-log-message">{{ log.message }}</div>
          </div>
        </div>
      </div>
      <div class="StreamingAvatar--controls">
        <input class="StreamingAvatar--chat--input" @keyup.enter="generateVideo" type="text" placeholder="Enter text" v-model="avatarNextText" />
        <div class="StreamingAvatar--chat">
          <button @click="generateVideo" :disabled="isGeneratingVideo">Generate video</button>
        </div>
      </div>
      <div class="StreamingAvatarStatus" v-if="isGeneratingVideo">Generating video...</div>
    </div>
  </div>
</template>

<script>
import StreamingAvatar, { AvatarQuality, StreamingEvents, TaskType } from "@heygen/streaming-avatar";

export default {
  name: "StreamingAvatarDemo",
  data() {
    return {
      /** Avatar selection data */
      avatars: [],
      videoAvatars: [],
      voices: [],
      selectedAvatar: null,
      selectedVoice: null,

      /** UX process data */
      isLoadingSession: false,
      loadingDots: "",
      loadingInterval: null,
      logs: [],

      /** Streaming session data */
      avatar: null,
      sessionData: null,
      sessionId: null,
      started: false,

      /** Avatar interaction process */
      avatarNextText: "",
      repeat: false,

      /** Demo setup */
      currentDemo: "streaming",

      /** Video generation process */
      videoId: null,
      videoUrl: null,
      isGeneratingVideo: false,
    };
  },
  async mounted() {
    await this.getAvailableAvatars();
  },
  methods: {
    async getAvailableAvatars() {
      try {
        this.addConsoleLog("Fetching avatars...");
        const response = await fetch("/api/avatars");
        const { avatars } = await response.json();
        this.avatars = avatars || [];
        
        if (this.avatars.length) this.selectedAvatar = this.avatars[0].avatar_id;
        this.addConsoleLog(`Avatars fetched and loaded ${this.avatars.length}`);
      } catch (err) {
        this.addConsoleLog(`Failed to load avatars: ${err}`);
      }
    },

    async getAvailableVideoAvatars() {
      try {
        this.addConsoleLog("Fetching video avatars...");
        const response = await fetch("/api/video-avatars");
        const { avatars } = await response.json();
        this.videoAvatars = avatars || [];
        if (this.videoAvatars.length) this.selectedAvatar = this.videoAvatars[0].avatar_id;
        this.addConsoleLog(`Video avatars fetched and loaded ${this.videoAvatars.length}`);
      } catch (err) {
        this.addConsoleLog(`Failed to load video avatars: ${err}`);
      }
    },

    async getAvailableVoices() {
      try {
        this.addConsoleLog("Fetching voices...");
        const response = await fetch("/api/voices");
        const { voices } = await response.json();
        this.voices = voices || [];
        if (this.voices.length) this.selectedVoice = voices[0].voice_id;
        this.addConsoleLog(`Voices fetched and loaded ${voices.length}`);
      } catch (err) {
        this.addConsoleLog(`Failed to load voices: ${err}`);
      }
    },

    async fetchAccessToken() {
      try {
        this.addConsoleLog("Fetching access token...");
        const response = await fetch("/api/token");
        const { token } = await response.json();
        this.addConsoleLog("Access token fetched", token);
        return token;
      } catch (err) {
        console.error("Failed to fetch access token:", err);
      }
      return "";
    },

    async startStreamingSession() {
      if (this.avatars.length === 0) {
        alert("⚠️ Please wait until avatars are loaded");
        return;
      }

      this.addConsoleLog("Initiating streaming session...");
      this.isLoadingSession = true;
      const token = await this.fetchAccessToken();
      if (!token) {
        this.isLoadingSession = false;
        this.addConsoleLog("Failed to fetch access token");
        return;
      }

      try {
        this.addConsoleLog("Initializing a new Streaming Avatar...");
        this.avatar = new StreamingAvatar({ token });
        this.addConsoleLog("Setting up avatar event listeners...");
        this.avatar.on(StreamingEvents.STREAM_READY, this.handleStreamReady);
        this.avatar.on(StreamingEvents.STREAM_DISCONNECTED, this.handleStreamDisconnected);
        this.avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
          this.addConsoleLog("Avatar started talking");
        });
        this.avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
          this.addConsoleLog("Avatar stopped talking");
        });

        this.addConsoleLog("Creating avatar...");
        this.sessionData = await this.avatar.createStartAvatar({
          quality: AvatarQuality.High,
          avatarName: this.selectedAvatar,
        });
        this.sessionId = this.sessionData.session_id;
        this.addConsoleLog(`Session started and session ID: ${this.sessionData.session_id}`);

        this.isLoadingSession = false;
        this.started = true;
      } catch (err) {
        console.error("Failed to start streaming session:", err);
      }
    },

    async stopStreamingSession() {
      if (!this.avatar || !this.sessionId) return;
      await this.avatar.stopAvatar();
      this.resetStreamingData();
      this.addConsoleLog("Streaming session stopped");
    },

    async resetStreamingData() {
      if (this.$refs.video) {
        this.$refs.video.srcObject = null;
      }
      if (this.$refs.video2) {
        this.$refs.video2.srcObject = null;
      }
      if (this.avatar) {
        await this.avatar.stopAvatar();
      }
      this.avatar = null;
      this.sessionData = null;
      this.sessionId = null;
      this.started = false;
      this.videoId = null;
      this.videoUrl = null;
      this.isGeneratingVideo = false;
      this.avatarNextText = "";
    },

    handleStreamReady(stream) {
      this.addConsoleLog(`Received stream data: ${stream}`);
      const videoElement = this.$refs.video;

      if (!videoElement) {
        this.addConsoleLog("Video element not found");
        return;
      }

      if (stream.detail) {
        videoElement.srcObject = stream.detail;
        videoElement.onloadedmetadata = () => {
          videoElement.play().catch(console.error);
        };
      } else {
        this.addConsoleLog("Stream is not available");
      }
    },

    handleStreamDisconnected() {
      this.addConsoleLog("Stream disconnected");
      this.resetStreamingData();
    },

    async handleSpeak() {
      if (!this.avatar || !this.avatarNextText) {
        this.addConsoleLog("Avatar or text not found");
        return;
      }
      if (this.avatarNextText.trim() === "") {
        this.addConsoleLog("Text is empty");
        return;
      }

      const avatarSpeechConfig = {
        sessionId: this.sessionId,
        text: this.avatarNextText,
      };
      if (this.repeat) {
        avatarSpeechConfig.task_type = TaskType.REPEAT;
      }

      if (this.repeat) {
        this.addConsoleLog(`Requested avatar to repeat: "${this.avatarNextText}"`);
      } else {
        this.addConsoleLog(`Requested avatar to respond to: "${this.avatarNextText}"`);
      }

      try {
        await this.avatar.speak(avatarSpeechConfig);
      } catch (err) {
        this.addConsoleLog("Failed to speak:", err);
      }

      this.avatarNextText = "";
    },

    /** Video generation methods */
    async generateVideo() {
      /** Ensure that voices and video avatars are loaded otherwise alert to prompt user to wait */
      if (this.voices.length === 0 || this.videoAvatars.length === 0) {
        alert("⚠️ Please wait until both voices and video avatars are loaded");
        return;
      }

      this.isGeneratingVideo = true;
      this.videoUrl = null;

      if (this.avatarNextText.trim() === "") {
        this.addConsoleLog("Text is empty");
        this.isGeneratingVideo = false;
        return;
      }

      this.addConsoleLog("Requesting video generation...");

      try {
        const res = await fetch("/api/videos/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            avatar_id: this.selectedAvatar,
            voice_id: this.selectedVoice,
            input_text: this.avatarNextText,
          }),
        });
        const { data, error } = await res.json();
        if (error || !data?.video_id) {
          this.addConsoleLog("Failed to get video ID.");
          this.isGeneratingVideo = false;
          return;
        }
        this.addConsoleLog("Request complete, beginning polling for video generation status...", data);
        this.videoId = data.video_id;
        this.pollVideoStatus();
      } catch (err) {
        console.error("Video generation failed:", err);
        this.isGeneratingVideo = false;
      }
    },

    async pollVideoStatus() {
      const POLL_INTERVAL_MS = 10000;
      const TIMEOUT_MS = 20 * 60 * 1000;
      const startTime = Date.now();
      let lastCheckTime = 0;

      const poll = async () => {
        const elapsed = Date.now() - startTime;

        if (elapsed > TIMEOUT_MS) {
          this.addConsoleLog("Video generation timed out.");
          this.isGeneratingVideo = false;
          return;
        }

        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        const formatted = `${minutes}m${seconds.toString().padStart(2, "0")}s`;

        if (Date.now() - lastCheckTime >= POLL_INTERVAL_MS) {
          this.addConsoleLog(`${formatted} elapsed – checking video status...`);
          lastCheckTime = Date.now();
        }

        try {
          const res = await fetch(`/api/videos/${this.videoId}`);
          const result = await res.json();

          const status = result?.data?.status;
          const video_url = result?.data?.video_url;

          if (status === "completed") {
            this.videoUrl = video_url;
            this.addConsoleLog(`✅ Video ready after ${formatted}!`);

            this.isGeneratingVideo = false;

            const videoEl = this.$refs.video2;
            if (videoEl) {
              videoEl.srcObject = null; // stop any streaming
              videoEl.src = video_url;
              videoEl.load();
              videoEl.play().catch(console.error);
            }

            return;
          }

          this.addConsoleLog(`🟡 Video not ready yet, checking again in ${POLL_INTERVAL_MS / 1000}s...`);

          setTimeout(poll, POLL_INTERVAL_MS);
        } catch (err) {
          console.error("Polling failed:", err);
          this.addConsoleLog("Error polling video status.");
          this.isGeneratingVideo = false;
        }
      };

      await poll();
    },

    animateCountdown(durationMs, callback) {
      let seconds = durationMs / 1000;
      const countdown = setInterval(() => {
        this.addConsoleLog(`...${seconds}`);
        seconds--;
        if (seconds <= 0) {
          clearInterval(countdown);
          callback();
        }
      }, 1000);
    },

    /** UI METHODS */
    async setCurrentDemo(demo) {
      if (this.currentDemo === demo) return;
      this.resetStreamingData();
      this.logs = [];
      this.addConsoleLog(`Switched to ${demo} API demo`);
      this.currentDemo = demo;
      if (demo === "video") {
        if (this.voices.length === 0) {
          await this.getAvailableVoices();
        } else {
          this.addConsoleLog("Voices already fetched");
        }
        if (this.videoAvatars.length === 0) {
          await this.getAvailableVideoAvatars();
        } else {
          this.addConsoleLog("Video avatars already fetched");
        }
        this.selectedAvatar = this.videoAvatars[0].avatar_id;
        this.selectedVoice = this.voices[0].voice_id;
      } else {
        if (this.avatars.length === 0) {
          await this.getAvailableAvatars();
        } else {
          this.addConsoleLog("Avatars already fetched");
        }
        this.selectedAvatar = this.avatars[0].avatar_id;
      }
    },

    addConsoleLog(message) {
      const now = new Date();

      const timestamp = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      const id = this.logs.length;

      this.logs.push({
        id,
        message: `[${timestamp}] ${message}`,
      });
    },

    startLoadingAnimation() {
      let step = 0;
      const dotStates = [".", "..", "..."];
      this.loadingDots = dotStates[0];
      this.loadingInterval = setInterval(() => {
        step = (step + 1) % dotStates.length;
        this.loadingDots = dotStates[step];
      }, 400);
    },
    stopLoadingAnimation() {
      clearInterval(this.loadingInterval);
      this.loadingInterval = null;
      this.loadingDots = "";
    },
  },
  watch: {
    isLoadingSession(newVal) {
      if (newVal) {
        this.startLoadingAnimation();
      } else {
        this.stopLoadingAnimation();
      }
    },
    logs() {
      this.$nextTick(() => {
        const container = this.$refs.consoleContainer;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    },
  },
  beforeDestroy() {
    if (this.avatar && this.sessionId) {
      this.stopStreamingSession();
    }
  },
};
</script>

<style>
.StreaminAvatar--container {
  display: flex;
  flex-direction: row;
  gap: 1rem;
}

.StreamingAvatar--console {
  flex: 1;
  border: 1px solid #dddddd;
  padding: 1rem;
  overflow-y: auto;
  background: #f9f9f9;
  border-radius: 15px;
  max-height: 480px;
  box-sizing: border-box;
}
.StreamingAvatar--console-title {
  color: #555;
  margin-bottom: 10px;
}
.StreamingAvatar--console-logs {
  margin: 5px 0;
  background-color: #f0f0f0;
  padding: 5px 5px;
  border-radius: 5px;
}
.StreamingAvatar--console-log-message {
  font-size: 14px;
  font-family: "Helvetica";
  color: #555555;
}
.StreamingAvatar--controls {
  margin-top: 10px;
  display: flex;
  background-color: #f9f9f9;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 15px;
}
.StreamingAvatar--toggle-container {
  margin-top: 10px;
  display: flex;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 15px;
}
.StreamingAvatarStatus {
  margin-top: 10px;
  display: flex;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 15px;
  font-size: 15px;
  font-family: "Helvetica";
  color: #333;
}
.StreamingAvatarStatus > div {
  padding: 5px;
}
.StreamingAvatarStatus > div > div {
  margin: 2.5px 0;
}
.StreamingAvatar--chat {
  margin-left: auto;
}
.StreamingAvatar--chat--input {
  box-sizing: border-box;
  border: 1px solid #aaaaaa;
  border-radius: 7px;
  height: 33.5px;
  width: 340px;
  padding: 5px;
}
.StreamingAvatar--repeat {
  display: flex;
  align-items: center;
  padding: 5px;
  border-radius: 7px;
  cursor: pointer;
}

.StreamingAvatar--repeat label {
  display: flex;
  cursor: pointer;
}
.StreamingAvatar--repeat label input {
  cursor: pointer;
}

.repeat-checkbox {
  margin-right: 8px;
  accent-color: blue; /* Modern browsers, matches your button color */
  width: 18px;
  height: 18px;
}

.repeat-label {
  font-size: 15px;
  font-family: "Helvetica";
  color: #333;
  display: flex;
  align-items: center;
  gap: 4px;
}

.repeat-status {
  font-weight: bold;
  margin-left: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.repeat-status.on {
  background: #0074d9;
  color: #fff;
}

.repeat-status.off {
  background: #ddd;
  color: #555;
}
.StreamingAvatar--tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.StreamingAvatar--picker select {
  margin-left: 5px;
  border-color: #ddd;
  padding: 5px;
  border-radius: 5px;
}

.tab-btn {
  padding: 8px 18px;
  border: 1px solid #1c1c1c;
  background: #fff;
  color: #000000;
  border-radius: 6px 6px 0 0;
  font-size: 16px;
  font-family: "Helvetica";
  cursor: pointer;
  outline: none;
  transition: background 0.2s, color 0.2s;
}

.tab-btn.active {
  background: #000000;
  color: #fff;
  font-weight: bold;
  border-bottom: 2px solid #000;
  z-index: 1;
}
button {
  margin: 0px 3px;
  border-radius: 5px;
  border: 1px solid #dddddd;
  background-color: blue;
  color: white;
  cursor: pointer;
}
button:disabled {
  background-color: #dddddd;
  cursor: not-allowed;
}
</style>
