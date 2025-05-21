<template>
  <div class="container">
    <h1>HeyGen Demo</h1>
    <StreamingAvatarDemo />
  </div>
</template>

<script>
import StreamingAvatarDemo from "./components/StreamingAvatarDemo.vue";
export default { components: { StreamingAvatarDemo } };
</script>

<style>
* {
  box-sizing: border-box;
}
.container {
  max-width: 760px;
  margin: 2rem auto;
  font-family: sans-serif;
}
.panel {
  margin-top: 3rem;
}
video {
  width: 320px;
  height: 480px;
  background: #000;
}
button {
  padding: 0.5rem 1rem;
}
</style>
