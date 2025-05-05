<template>
  <div class="StreamingAvatar">
    <h2>Streaming Avatar</h2>

    <!-- 1. Choose your avatar from the list -->
    <div v-if="avatars.length && !started" style="margin-bottom: 1rem">
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
        <input @keyup.enter="handleSpeak" type="text" placeholder="Enter text" v-model="avatarNextText" />
        <button @click="handleSpeak" :disabled="!started">Send</button>
      </div>
    </div>

    <!-- Button to toggle 'repeat' -->
    <div class="StreamingAvatar--controls">
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

    <div class="StreamingAvatarStatus">
      <div v-if="isLoadingSession">Loading{{ loadingDots }}</div>
      <div v-else-if="started">
        <div>Session ID: {{ sessionId }}</div>
        <div>Avatar: {{ selectedAvatar }}</div>
      </div>
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
      selectedAvatar: null,

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
        this.avatars = avatars;
        if (this.avatars.length) this.selectedAvatar = avatars[0].avatar_id;
        this.addConsoleLog("Avatars fetched and loaded", avatars);
      } catch (err) {
        console.error("Failed to load avatars:", err);
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
        /*         this.avatar.on(StreamingEvents.SESSION_CREATED, ({ session_id }) => {
          this.avatar.speak({
            sessionId: session_id,
            text: "Hire Robert Foenix and he will make sure HeyGen customers are always delighted!",
            task_type: TaskType.REPEAT,
          });
        }); */

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

    resetStreamingData() {
      this.$refs.video.srcObject = null;
      this.avatar = null;
      this.sessionData = null;
      this.sessionId = null;
      this.started = false;
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

    /** UI METHODS */
    addConsoleLog(message) {
      this.logs.push({ id: this.logs.length, message });
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
  margin: 10px;
  display: flex;
}
.StreamingAvatar--chat {
  margin-left: auto;
}
.StreamingAvatar--chat input {
  box-sizing: border-box;
  border: 1px solid #ddd;
  border-radius: 5px;
  height: 33.5px;
  width: 340px;
  padding: 5px;
}
.StreamingAvatar--repeat {
  display: flex;
  margin-top: 20px;
  align-items: center;
  border: 1px solid #ddd;
  padding: 5px;
  border-radius: 5px;
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
