<script setup lang="ts">
import { reactive } from 'vue'
import { useShopStore } from '../../stores/shop'

const shopStore = useShopStore()

const settingsForm = reactive({
  storeName: shopStore.settings.storeName,
  subName: shopStore.settings.subName,
  brandImageUrl: shopStore.settings.brandImageUrl,
  heroKicker: shopStore.settings.heroKicker,
  heroTitle: shopStore.settings.heroTitle,
  heroLead: shopStore.settings.heroLead,
  heroPoint1: shopStore.settings.heroPoint1,
  heroPoint2: shopStore.settings.heroPoint2,
  heroPoint3: shopStore.settings.heroPoint3,
  shopHeroKicker: shopStore.settings.shopHeroKicker,
  shopHeroTitle: shopStore.settings.shopHeroTitle,
  shopHeroLead: shopStore.settings.shopHeroLead,
  cartHeroKicker: shopStore.settings.cartHeroKicker,
  cartHeroTitle: shopStore.settings.cartHeroTitle,
  cartHeroLead: shopStore.settings.cartHeroLead,
  checkoutHeroKicker: shopStore.settings.checkoutHeroKicker,
  checkoutHeroTitle: shopStore.settings.checkoutHeroTitle,
  checkoutHeroLead: shopStore.settings.checkoutHeroLead,
  shippingCost: shopStore.settings.shippingCost,
  freeShippingThreshold: shopStore.settings.freeShippingThreshold,
})

const saveSettings = () => {
  shopStore.updateSettings({
    storeName: settingsForm.storeName,
    subName: settingsForm.subName,
    brandImageUrl: settingsForm.brandImageUrl,
    heroKicker: settingsForm.heroKicker,
    heroTitle: settingsForm.heroTitle,
    heroLead: settingsForm.heroLead,
    heroPoint1: settingsForm.heroPoint1,
    heroPoint2: settingsForm.heroPoint2,
    heroPoint3: settingsForm.heroPoint3,
    shopHeroKicker: settingsForm.shopHeroKicker,
    shopHeroTitle: settingsForm.shopHeroTitle,
    shopHeroLead: settingsForm.shopHeroLead,
    cartHeroKicker: settingsForm.cartHeroKicker,
    cartHeroTitle: settingsForm.cartHeroTitle,
    cartHeroLead: settingsForm.cartHeroLead,
    checkoutHeroKicker: settingsForm.checkoutHeroKicker,
    checkoutHeroTitle: settingsForm.checkoutHeroTitle,
    checkoutHeroLead: settingsForm.checkoutHeroLead,
    shippingCost: Number(settingsForm.shippingCost),
    freeShippingThreshold: Number(settingsForm.freeShippingThreshold),
  })
}
</script>

<template>
  <form class="card" @submit.prevent="saveSettings">
    <h3>Butiksinställningar</h3>
    <h4 class="settings-subheading">Grundläggande</h4>
    <hr class="settings-divider" />

    <label>
      Butiksnamn
      <input v-model="settingsForm.storeName" required type="text" />
    </label>

    <label>
      Underrubrik
      <input v-model="settingsForm.subName" type="text" />
    </label>

    <label>
      Bild-URL (ersätter namn + underrubrik)
      <input v-model="settingsForm.brandImageUrl" type="text" placeholder="https://..." />
    </label>

    <h4 class="settings-subheading">Startsida Hero</h4>
    <hr class="settings-divider" />

    <label>
      Hero: Rubrik
      <input v-model="settingsForm.heroTitle" type="text" />
    </label>

    <label>
      Hero: Kicker
      <input v-model="settingsForm.heroKicker" type="text" />
    </label>

    <label>
      Hero: Ingress
      <textarea v-model="settingsForm.heroLead" rows="3" />
    </label>

    <label>
      Hero: Punkt 1
      <input v-model="settingsForm.heroPoint1" type="text" />
    </label>

    <label>
      Hero: Punkt 2
      <input v-model="settingsForm.heroPoint2" type="text" />
    </label>

    <label>
      Hero: Punkt 3
      <input v-model="settingsForm.heroPoint3" type="text" />
    </label>

    <h4 class="settings-subheading">Butik Hero</h4>
    <hr class="settings-divider" />

    <label>
      Butik Hero: Rubrik
      <input v-model="settingsForm.shopHeroTitle" type="text" />
    </label>

    <label>
      Butik Hero: Kicker
      <input v-model="settingsForm.shopHeroKicker" type="text" />
    </label>

    <label>
      Butik Hero: Ingress
      <textarea v-model="settingsForm.shopHeroLead" rows="3" />
    </label>

    <h4 class="settings-subheading">Varukorg Hero</h4>
    <hr class="settings-divider" />

    <label>
      Varukorg Hero: Rubrik
      <input v-model="settingsForm.cartHeroTitle" type="text" />
    </label>

    <label>
      Varukorg Hero: Kicker
      <input v-model="settingsForm.cartHeroKicker" type="text" />
    </label>

    <label>
      Varukorg Hero: Ingress
      <textarea v-model="settingsForm.cartHeroLead" rows="3" />
    </label>

    <h4 class="settings-subheading">Kassa Hero</h4>
    <hr class="settings-divider" />

    <label>
      Kassa Hero: Rubrik
      <input v-model="settingsForm.checkoutHeroTitle" type="text" />
    </label>

    <label>
      Kassa Hero: Kicker
      <input v-model="settingsForm.checkoutHeroKicker" type="text" />
    </label>

    <label>
      Kassa Hero: Ingress
      <textarea v-model="settingsForm.checkoutHeroLead" rows="3" />
    </label>

    <h4 class="settings-subheading">Frakt</h4>
    <hr class="settings-divider" />

    <label>
      Fraktkostnad (kr)
      <input v-model.number="settingsForm.shippingCost" min="0" required type="number" />
    </label>

    <label>
      Fri frakt över (kr)
      <input v-model.number="settingsForm.freeShippingThreshold" min="0" required type="number" />
    </label>

    <button type="submit">Spara inställningar</button>
  </form>
</template>

<style scoped lang="scss">
.settings-subheading {
  margin: 0.4rem 0 0.25rem;
  font-size: 0.9rem;
  color: $color-text-soft;
}

.settings-divider {
  border: 0;
  border-top: 3px solid var(--theme-accent-soft);
  margin: 0 0 0.65rem;
}
</style>
