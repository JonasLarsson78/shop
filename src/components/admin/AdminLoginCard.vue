<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  authError: string
}>()

const emit = defineEmits<{
  login: [password: string]
}>()

const password = ref('')

const submitLogin = () => {
  emit('login', password.value)
  password.value = ''
}
</script>

<template>
  <form class="card" @submit.prevent="submitLogin">
    <h3>Admin-inloggning</h3>

    <label>
      Lösenord
      <input v-model="password" required type="password" />
    </label>

    <button type="submit">Logga in</button>
    <p v-if="props.authError" class="auth-error">{{ props.authError }}</p>
  </form>
</template>

<style scoped lang="scss">
.auth-error {
  margin-top: 0.75rem;
  color: $color-danger;
  font-weight: 600;
}
</style>
