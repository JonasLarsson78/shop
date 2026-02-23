<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  getStoredTheme,
  isValidHex,
  setTheme,
  themeOptions,
  type ThemeMode,
} from '../../utils/theme'

const savedTheme = getStoredTheme()
const selectedMode = ref<ThemeMode>(savedTheme.mode)
const customAccentHex = ref(savedTheme.customAccentHex)
const customMutedHex = ref(savedTheme.customMutedHex)
const customDangerHex = ref(savedTheme.customDangerHex)

const customColorsValid = computed(
  () =>
    isValidHex(customAccentHex.value) &&
    isValidHex(customMutedHex.value) &&
    isValidHex(customDangerHex.value)
)

const applyPresetTheme = (mode: ThemeMode) => {
  selectedMode.value = mode
  setTheme({
    mode,
    customAccentHex: customAccentHex.value,
    customMutedHex: customMutedHex.value,
    customDangerHex: customDangerHex.value,
  })
}

const applyCustomTheme = () => {
  if (!customColorsValid.value) {
    return
  }

  selectedMode.value = 'custom'
  setTheme({
    mode: 'custom',
    customAccentHex: customAccentHex.value,
    customMutedHex: customMutedHex.value,
    customDangerHex: customDangerHex.value,
  })
}

watch([customAccentHex, customMutedHex, customDangerHex], () => {
  if (!customColorsValid.value) {
    return
  }

  selectedMode.value = 'custom'

  setTheme({
    mode: 'custom',
    customAccentHex: customAccentHex.value,
    customMutedHex: customMutedHex.value,
    customDangerHex: customDangerHex.value,
  })
})
</script>

<template>
  <section>
    <div class="card theme-card">
      <h3>Tema</h3>
      <p class="theme-help">
        Välj ett färdigt tema eller ange egna färger. Custom aktiveras
        automatiskt när du ändrar färgerna.
      </p>

      <div class="theme-options">
        <button
          v-for="option in themeOptions"
          :key="option.id"
          type="button"
          class="theme-option"
          :class="{ 'theme-option-active': selectedMode === option.id }"
          @click="
            option.id === 'custom'
              ? applyCustomTheme()
              : applyPresetTheme(option.id)
          "
        >
          {{ option.label }}
        </button>
      </div>

      <div class="custom-theme">
        <h4>Custom</h4>
        <label>
          Primär (knappar/länkar)
          <div class="color-input-row">
            <input
              v-model="customAccentHex"
              type="text"
              placeholder="#4f46e5"
            />
            <input
              v-model="customAccentHex"
              class="color-picker"
              type="color"
            />
          </div>
        </label>
        <label>
          Sekundär (muted-knappar)
          <div class="color-input-row">
            <input v-model="customMutedHex" type="text" placeholder="#0f766e" />
            <input v-model="customMutedHex" class="color-picker" type="color" />
          </div>
        </label>
        <label>
          Danger (röda knappar)
          <div class="color-input-row">
            <input
              v-model="customDangerHex"
              type="text"
              placeholder="#be123c"
            />
            <input
              v-model="customDangerHex"
              class="color-picker"
              type="color"
            />
          </div>
        </label>
        <p v-if="!customColorsValid" class="theme-error">
          Ange giltiga hex-koder, t.ex. #4f46e5.
        </p>
        <button
          type="button"
          class="button-primary"
          :disabled="!customColorsValid"
          @click="applyCustomTheme"
        >
          Använd custom
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.theme-card {
  display: grid;
  gap: 0.8rem;
  max-width: 560px;

  h3,
  h4,
  p {
    margin: 0;
  }
}

.theme-help {
  color: $color-text-soft;
}

.theme-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.theme-option {
  background: $color-surface-muted;
  color: $color-text-strong;
  border: 1px solid $color-border;
}

.theme-option-active {
  background: var(--theme-accent-soft);
  border-color: var(--theme-accent-border);
}

.custom-theme {
  display: grid;
  gap: 0.55rem;
}

.color-input-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  align-items: center;
}

.color-picker {
  width: 2.2rem;
  height: 2.2rem;
  padding: 0.1rem;
}

.theme-error {
  color: var(--theme-button-danger-bg);
  font-size: 0.9rem;
}
</style>
