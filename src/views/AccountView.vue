<template>
  <div class="view account-view">
    <div class="card">
      <h2>Dina uppgifter</h2>
      <div v-if="user">
        <form @submit.prevent="save" class="account-form">
          <div class="grid">
            <label class="field">
              <span class="label">E-post</span>
              <input v-model="form.email" type="email" required />
            </label>

            <label class="field">
              <span class="label">Namn</span>
              <input v-model="form.name" type="text" />
            </label>

            <label class="field full">
              <span class="label">Adress</span>
              <textarea v-model="form.address" rows="3" />
            </label>

            <label class="field">
              <span class="label">Telefon</span>
              <input v-model="form.phone" type="tel" />
            </label>

            <label class="field">
              <span class="label">Postnummer</span>
              <input v-model="form.zip" type="text" />
            </label>

            <label class="field">
              <span class="label">Stad</span>
              <input v-model="form.city" type="text" />
            </label>
          </div>

          <div class="actions">
            <BaseButton variant="primary" :type="'submit'" :disabled="loading">{{ loading ? 'Sparar…' : 'Spara' }}</BaseButton>
            <BaseButton variant="secondary" :type="'button'" @click="reset">Återställ</BaseButton>
          </div>

          <p class="error" v-if="error">{{ error }}</p>
          <p class="success" v-if="success">{{ success }}</p>
        </form>
      </div>
      <div v-else class="not-logged">
        <p>Du är inte inloggad. Du omdirigeras till inloggning…</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import BaseButton from '../components/ui/BaseButton.vue'

const auth = useAuthStore()
const user = computed(() => auth.state.user)

const form = reactive({
  email: '',
  name: '',
  address: '',
  phone: '',
  zip: '',
  city: '',
})

const loading = ref(false)
const error = ref('')
const success = ref('')

function populate() {
  const u = auth.state.user
  if (!u) return
  form.email = u.email ?? ''
  form.name = u.name ?? ''
  form.address = u.address ?? ''
  form.phone = u.phone ?? ''
  form.zip = u.zip ?? ''
  form.city = u.city ?? ''
}

const router = useRouter()

// populate when user becomes available
watch(user, (u) => {
  if (u) populate()
})

onMounted(() => {
  if (!user.value) {
    // small delay so the message can show briefly before redirect
    setTimeout(() => router.push({ path: '/login' }), 300)
  } else {
    populate()
  }
})

function reset() {
  error.value = ''
  success.value = ''
  populate()
}

async function save() {
  error.value = ''
  success.value = ''
  if (!auth.state.user) {
    error.value = 'Ingen inloggad användare'
    return
  }
  loading.value = true
  try {
    const payload = {
      id: auth.state.user.id,
      email: form.email,
      name: form.name,
      address: form.address,
      phone: form.phone,
      zip: form.zip,
      city: form.city,
    }

    const res = await fetch('/api/auth/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || 'Uppdatering misslyckades')
    }

    const updated = await res.json()
    auth.setUser(updated)
    success.value = 'Uppgifterna sparades'
  } catch (err: any) {
    error.value = err?.message || 'Misslyckades att spara'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@import '../styles/_variables.scss';

.account-view{padding:2rem 1rem;display:flex;justify-content:center}
.card{max-width:820px;width:100%;padding:1.25rem;background: $color-surface;border-radius:$radius-md;box-shadow:0 6px 18px rgba(16,24,40,0.04);border:1px solid $color-border}
.card h2{margin:0 0 12px;font-size:20px;color:$color-text-strong}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.field{display:flex;flex-direction:column}
.field.full{grid-column:1/-1}
.label{font-size:13px;color:$color-text-soft;margin-bottom:6px}
input,textarea{width:100%;padding:10px 12px;border:1px solid $color-border-input;border-radius:$radius-sm;background:var(--theme-page-top, $color-surface-muted);color:$color-text;font-size:14px}
textarea{resize:vertical}
.account-form .field + .field{margin-top:0}
.actions{display:flex;gap:10px;margin-top:16px;justify-content:flex-end}
.btn{padding:9px 14px;border-radius:$radius-md;border:0;background:$color-brand;color:$color-brand-contrast;cursor:pointer}
.btn.secondary{background:$color-surface-muted;color:$color-text}
.btn:disabled{opacity:0.6;cursor:not-allowed}
.error{color:$color-danger;margin-top:10px}
.success{color:$color-success;margin-top:10px}
.not-logged{color:$color-text-soft;padding:12px;background:rgba(#eef4ff,0.6);border-radius:6px}

@media (max-width:$breakpoint-mobile){
  .grid{grid-template-columns:1fr}
  .card{padding:1rem}
  .actions{justify-content:stretch}
}

</style>
