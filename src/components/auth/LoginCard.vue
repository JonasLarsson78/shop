<template>
  <div class="auth-card login-card">
    <h3>Logga in</h3>
    <form @submit.prevent="onSubmit" class="form">
      <label class="field">
        <span class="label">E-post</span>
        <input v-model="email" type="email" required autocomplete="email" />
      </label>

      <label class="field">
        <span class="label">Lösenord</span>
        <input v-model="password" type="password" required autocomplete="current-password" />
      </label>

      <div class="actions">
        <BaseButton variant="primary" :type="'submit'" :disabled="loading">{{ loading ? 'Loggar in…' : 'Logga in' }}</BaseButton>
        <BaseButton variant="secondary" :type="'button'" @click="goRegister">Registrera</BaseButton>
      </div>

      <p class="error" v-if="error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import BaseButton from '../ui/BaseButton.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login({ email: email.value, password: password.value })
    const redirect = (route.query.redirect as string) || '/'
    await router.push(redirect)
  } catch (err: any) {
    error.value = err?.message || 'Inloggning misslyckades'
  } finally {
    loading.value = false
  }
}

function goRegister() {
  router.push({ path: '/register' })
}
</script>

<style scoped lang="scss">
@import '../../styles/_variables.scss';

.auth-card{
  border:1px solid $color-border;
  padding:16px;
  border-radius:$radius-sm;
  max-width:420px;
  background:$color-surface;
}
.auth-card h3{margin:0 0 12px;font-size:18px;color:$color-text-strong}
.field{display:block;margin-bottom:10px}
.label{display:block;margin-bottom:6px;font-size:13px;color:$color-text-soft}
input{width:100%;padding:8px 10px;border:1px solid $color-border-input;border-radius:6px;background:$color-surface-muted;color:$color-text}
.actions{display:flex;gap:8px;margin-top:12px}
.btn{padding:8px 12px;border-radius:$radius-sm;border:0;background:$color-brand;color:$color-brand-contrast;cursor:pointer}
.btn.secondary{background:$color-surface-muted;color:$color-text}
.btn:disabled{opacity:0.6;cursor:not-allowed}
.error{color:$color-danger;margin-top:10px}

@media (max-width:$breakpoint-mobile){
  .auth-card{max-width:100%;padding:12px}
  .actions{flex-direction:column}
  .btn{width:100%}
  .btn.secondary{width:100%}
}
</style>
