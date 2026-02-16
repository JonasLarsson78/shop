<template>
  <div class="view auth-view">
    <RegisterCard />
  </div>
</template>

<script setup lang="ts">
import RegisterCard from '../components/auth/RegisterCard.vue'
</script>

<style scoped>
.auth-view {
  display: grid;
  place-items: center;
  padding: 2rem
}
</style>
