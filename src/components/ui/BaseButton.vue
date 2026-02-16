<template>
  <button :type="type" :class="['base-btn', variant]
    " :disabled="disabled" @click="$emit('click')">
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}>()

defineEmits(['click'])
</script>

<style scoped lang="scss">
@import '../../styles/_variables.scss';

.base-btn {
  padding: 9px 14px;
  border-radius: $radius-sm;
  border: 0;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.base-btn.primary {
  background: var(--theme-button-primary-bg, #{$color-brand});
  color: var(--theme-button-primary-text, #{$color-brand-contrast});
}

.base-btn.secondary {
  background: var(--theme-button-muted-bg, #{$color-surface-muted});
  color: var(--theme-button-muted-text, #{$color-text});
}

.base-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed
}

@media (max-width:$breakpoint-mobile) {
  .base-btn {
    width: 100%
  }
}
</style>
