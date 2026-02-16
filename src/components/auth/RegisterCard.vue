<template>
  <div class="auth-card register-card">
    <h3>Registrera konto</h3>
    <form @submit.prevent="onSubmit" class="form">
      <label class="field">
        <span class="label">Namn</span>
        <input v-model="name" type="text" required autocomplete="name" />
      </label>

      <label class="field">
        <span class="label">E-post</span>
        <input v-model="email" type="email" required autocomplete="email" />
      </label>

      <label class="field">
        <span class="label">Lösenord</span>
        <input v-model="password" type="password" required autocomplete="new-password" />
      </label>

      <label class="field">
        <span class="label">Adress (valfritt)</span>
        <input v-model="address" type="text" autocomplete="street-address" />
      </label>

          <label class="field">
            <span class="label">Telefon (valfritt)</span>
            <input v-model="phone" type="tel" autocomplete="tel" />
          </label>

          <label class="field">
            <span class="label">Postnummer</span>
            <input v-model="zip" type="text" autocomplete="postal-code" />
          </label>

          <label class="field">
            <span class="label">Stad</span>
            <input v-model="city" type="text" autocomplete="address-level2" />
          </label>

      <div class="actions">
        <BaseButton variant="primary" :type="'submit'" :disabled="loading">{{ loading ? 'Registrerar…' : 'Registrera' }}</BaseButton>
        <BaseButton variant="secondary" :type="'button'" @click="goLogin">Till inloggning</BaseButton>
      </div>

      <p class="error" v-if="error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import BaseButton from '../ui/BaseButton.vue'

const auth = useAuthStore()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const address = ref('')
const phone = ref('')
const zip = ref('')
const city = ref('')
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await auth.register({ name: name.value, email: email.value, password: password.value, address: address.value, phone: phone.value, zip: zip.value, city: city.value })
    router.push({ path: '/' })
  } catch (err: any) {
    error.value = err?.message || 'Registrering misslyckades'
  } finally {
    loading.value = false
  }
}

function goLogin() {
  router.push({ path: '/login' })
}
</script>

<style scoped lang="scss">
@import '../../styles/_variables.scss';

.auth-card{
  border:1px solid $color-border;
  padding:16px;
  border-radius:$radius-sm;
  max-width:480px;
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
