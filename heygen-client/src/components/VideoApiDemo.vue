<template>
  <section>
    <h2>Video API</h2>
    <button :disabled="busy" @click="createVideo">
      {{ busy ? statusText : "Create demo video" }}
    </button>
    <p v-if="videoUrl">
      <a :href="videoUrl" target="_blank">Download video</a>
    </p>
  </section>
</template>

<script>
export default {
  data() {
    return { busy: false, statusText: "", videoUrl: "" };
  },
  methods: {
    async createVideo() {
      this.busy = true;
      this.statusText = "Creating video…";
      try {
        // 1. Kick off generation
        const { video_id } = await fetch("/api/videos").then((r) => r.json());

        // 2. Poll every 3s
        let status = "";
        while (status !== "completed" && status !== "failed") {
          const { status: s, video_url } = await fetch(`/api/videos/${video_id}`).then((r) => r.json());
          status = s;
          this.statusText = `Status: ${status}`;
          if (status === "completed") {
            this.videoUrl = video_url;
          }
          if (status !== "completed" && status !== "failed") {
            await new Promise((r) => setTimeout(r, 3000));
          }
        }
      } catch (err) {
        console.error(err);
        alert("Video creation failed—see console.");
      } finally {
        this.busy = false;
      }
    },
  },
};
</script>
