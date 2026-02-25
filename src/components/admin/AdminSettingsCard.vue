<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
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
  freeShippingThreshold: shopStore.settings.freeShippingThreshold,
  vatPercent: (shopStore.settings as any).vatPercent ?? 25,
})

// Keep the form in sync if settings are loaded/updated after component creation
watch(
  () => shopStore.settings,
  (s) => {
    if (!s) return
    settingsForm.storeName = s.storeName ?? ''
    settingsForm.subName = s.subName ?? ''
    settingsForm.brandImageUrl = s.brandImageUrl ?? ''
    settingsForm.heroKicker = s.heroKicker ?? ''
    settingsForm.heroTitle = s.heroTitle ?? ''
    settingsForm.heroLead = s.heroLead ?? ''
    settingsForm.heroPoint1 = s.heroPoint1 ?? ''
    settingsForm.heroPoint2 = s.heroPoint2 ?? ''
    settingsForm.heroPoint3 = s.heroPoint3 ?? ''
    settingsForm.shopHeroKicker = s.shopHeroKicker ?? ''
    settingsForm.shopHeroTitle = s.shopHeroTitle ?? ''
    settingsForm.shopHeroLead = s.shopHeroLead ?? ''
    settingsForm.cartHeroKicker = s.cartHeroKicker ?? ''
    settingsForm.cartHeroTitle = s.cartHeroTitle ?? ''
    settingsForm.cartHeroLead = s.cartHeroLead ?? ''
    settingsForm.checkoutHeroKicker = s.checkoutHeroKicker ?? ''
    settingsForm.checkoutHeroTitle = s.checkoutHeroTitle ?? ''
    settingsForm.checkoutHeroLead = s.checkoutHeroLead ?? ''
    settingsForm.freeShippingThreshold = s.freeShippingThreshold ?? 0
    settingsForm.vatPercent = (s as any).vatPercent ?? 25
  },
  { immediate: true }
)

const newShipping = ref({ name: '', price: 0 })

// Track deletion/loading state per shipping option id
const deleting = reactive<Record<string, boolean>>({})

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
    freeShippingThreshold: Number(settingsForm.freeShippingThreshold),
    vatPercent: Number(settingsForm.vatPercent),
  })
}

const addShipping = async () => {
  if (!newShipping.value.name || newShipping.value.price < 0) return
  await shopStore.addShippingOption({
    name: newShipping.value.name,
    price: newShipping.value.price,
  })
  newShipping.value = { name: '', price: 0 }
}

const updateShipping = async (option: any) => {
  await shopStore.updateShippingOption(option.id, {
    name: option.name,
    price: option.price,
  })
}

const deleteShipping = async (id: number) => {
  const idx = shopStore.shippingOptions.findIndex((o: any) => o.id === id)
  if (idx === -1) return

  // Optimistic remove
  const removed = shopStore.shippingOptions[idx]
  shopStore.shippingOptions.splice(idx, 1)
  deleting[id] = true

  try {
    await shopStore.deleteShippingOption(id)
  } catch (err) {
    // rollback on error
    if (removed !== undefined) {
      shopStore.shippingOptions.splice(idx, 0, removed)
    }
    console.error('Failed to delete shipping option, rolled back:', err)
  } finally {
    deleting[id] = false
  }
}

// Hämta fraktalternativ när komponenten mountas
if (!shopStore.shippingOptions.length) shopStore.fetchShippingOptions()
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
      <input
        v-model="settingsForm.brandImageUrl"
        type="text"
        placeholder="https://..."
      />
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
      Fri frakt över (kr)
      <input
        v-model.number="settingsForm.freeShippingThreshold"
        min="0"
        required
        type="number"
      />
    </label>

    <label>
      Momsprocent (%)
      <input
        v-model.number="settingsForm.vatPercent"
        min="0"
        required
        type="number"
      />
    </label>

    <div class="shipping-options">
      <h4>Fraktalternativ</h4>
      <ol>
        <li v-for="option in shopStore.shippingOptions" :key="option.id">
          <input
            class="ship-name"
            v-model="option.name"
            @blur="updateShipping(option)"
            placeholder="Namn"
            :disabled="deleting[option.id]"
          />
          <div class="ship-right">
            <input
              class="ship-price"
              v-model.number="option.price"
              @blur="updateShipping(option)"
              type="number"
              min="0"
              :disabled="deleting[option.id]"
            />
            <span class="kr">kr</span>
            <button
              class="btn-remove"
              type="button"
              @click="deleteShipping(option.id)"
              :disabled="deleting[option.id]"
            >
              <span v-if="deleting[option.id]">Tar bort...</span>
              <span v-else>Ta bort</span>
            </button>
          </div>
        </li>
      </ol>
      <div class="new-shipping">
        <input v-model="newShipping.name" placeholder="Nytt fraktalternativ" />
        <input
          v-model.number="newShipping.price"
          type="number"
          min="0"
          class="ship-price"
          placeholder="Pris"
        />
        <button type="button" @click="addShipping">Lägg till</button>
      </div>
    </div>

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

.shipping-options {
  margin-bottom: 1.5rem;

  ol {
    list-style: decimal;
    list-style-position: outside;
    padding-left: 1.2rem;
    margin: 0;
  }

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .ship-name {
    flex: 1 1 auto;
    padding: 0.35rem 0.5rem;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 4px;
  }

  .ship-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: 0.75rem;
  }

  .ship-price {
    width: 90px;
    padding: 0.25rem 0.4rem;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 4px;
    text-align: right;
  }

  .kr {
    font-size: 0.9rem;
    color: $color-text-soft;
  }

  .btn-remove {
    background: transparent;
    border: none;
    color: var(--theme-accent);
    cursor: pointer;
    padding: 0.25rem 0.5rem;
  }

  .new-shipping {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
    align-items: center;
  }
}

.card > button[type='submit'] {
  margin-top: 1.25rem;
}
</style>
