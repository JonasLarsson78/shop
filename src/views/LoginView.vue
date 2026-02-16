<template>
  <div class="view auth-view">
    <LoginCard />
  </div>
</template>

<script setup lang="ts">
import LoginCard from '../components/auth/LoginCard.vue'
</script>

<style scoped>
.auth-view{display:grid;place-items:center;padding:2rem}
</style>
