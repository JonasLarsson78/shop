import { defineStore } from 'pinia'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  groupId: string | null
}

export interface ProductGroup {
  id: string
  name: string
}

interface Settings {
  storeName: string
  shippingCost: number
  freeShippingThreshold: number
}

interface PersistedShopState {
  products: Product[]
  groups: ProductGroup[]
  cart: Record<string, number>
  settings: Settings
}

const SHOP_STORAGE_KEY = 'doggo-shop-state-v1'
const DEFAULT_PRODUCT_IMAGE = 'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=1200'

const defaultGroups: ProductGroup[] = [
  { id: 'group-food', name: 'Mat & Skålar' },
  { id: 'group-walk', name: 'Promenad' },
  { id: 'group-sleep', name: 'Sovplats' },
  { id: 'group-play', name: 'Leksaker' },
]

const defaultProducts: Product[] = [
  {
    id: 'dog-bowl-1',
    name: 'Stålhundskål 1L',
    description: 'Slitstark matskål i rostfritt stål för daglig användning.',
    price: 149,
    imageUrl: 'https://images.pexels.com/photos/5731866/pexels-photo-5731866.jpeg?auto=compress&cs=tinysrgb&w=1200',
    groupId: 'group-food',
  },
  {
    id: 'dog-leash-1',
    name: 'Justerbart Koppel',
    description: 'Mjukt men starkt koppel för promenader i alla väder.',
    price: 229,
    imageUrl: 'https://images.pexels.com/photos/1490908/pexels-photo-1490908.jpeg?auto=compress&cs=tinysrgb&w=1200',
    groupId: 'group-walk',
  },
  {
    id: 'dog-bed-1',
    name: 'Hundsäng Comfort',
    description: 'Mjuk hundsäng med tvättbart överdrag.',
    price: 699,
    imageUrl: 'https://images.pexels.com/photos/4587995/pexels-photo-4587995.jpeg?auto=compress&cs=tinysrgb&w=1200',
    groupId: 'group-sleep',
  },
  {
    id: 'dog-toy-1',
    name: 'Tuggleksak Gummi',
    description: 'Tålig leksak som aktiverar och tränar käkmuskler.',
    price: 89,
    imageUrl: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1200',
    groupId: 'group-play',
  },
]

const defaultSettings: Settings = {
  storeName: 'Doggo Shop',
  shippingCost: 59,
  freeShippingThreshold: 800,
}

const normalizeGroup = (rawGroup: Partial<ProductGroup>): ProductGroup | null => {
  if (typeof rawGroup.id !== 'string' || typeof rawGroup.name !== 'string') {
    return null
  }

  const trimmedName = rawGroup.name.trim()

  if (!trimmedName) {
    return null
  }

  return {
    id: rawGroup.id,
    name: trimmedName,
  }
}

const normalizeProduct = (rawProduct: Partial<Product>): Product | null => {
  if (
    typeof rawProduct.id !== 'string' ||
    typeof rawProduct.name !== 'string' ||
    typeof rawProduct.description !== 'string' ||
    typeof rawProduct.price !== 'number'
  ) {
    return null
  }

  return {
    id: rawProduct.id,
    name: rawProduct.name,
    description: rawProduct.description,
    price: rawProduct.price,
    imageUrl:
      typeof rawProduct.imageUrl === 'string' && rawProduct.imageUrl.trim().length > 0
        ? rawProduct.imageUrl
        : DEFAULT_PRODUCT_IMAGE,
    groupId: typeof rawProduct.groupId === 'string' ? rawProduct.groupId : null,
  }
}

const loadPersistedShopState = (): PersistedShopState | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const rawState = window.localStorage.getItem(SHOP_STORAGE_KEY)

    if (!rawState) {
      return null
    }

    const parsedState = JSON.parse(rawState) as Partial<PersistedShopState>

    if (!parsedState || typeof parsedState !== 'object') {
      return null
    }

    const normalizedGroups = Array.isArray(parsedState.groups)
      ? parsedState.groups
          .map((group) => normalizeGroup(group as Partial<ProductGroup>))
          .filter((group): group is ProductGroup => group !== null)
      : defaultGroups

    const safeGroups = normalizedGroups.length > 0 ? normalizedGroups : defaultGroups
    const validGroupIds = new Set(safeGroups.map((group) => group.id))

    const normalizedProducts = Array.isArray(parsedState.products)
      ? parsedState.products
          .map((product) => normalizeProduct(product as Partial<Product>))
          .filter((product): product is Product => product !== null)
          .map((product) => ({
            ...product,
            groupId: product.groupId && validGroupIds.has(product.groupId) ? product.groupId : null,
          }))
      : defaultProducts

    return {
      products: normalizedProducts.length > 0 ? normalizedProducts : defaultProducts,
      groups: safeGroups,
      cart: parsedState.cart && typeof parsedState.cart === 'object' ? parsedState.cart : {},
      settings:
        parsedState.settings && typeof parsedState.settings === 'object'
          ? {
              storeName:
                typeof parsedState.settings.storeName === 'string'
                  ? parsedState.settings.storeName
                  : defaultSettings.storeName,
              shippingCost:
                typeof parsedState.settings.shippingCost === 'number'
                  ? parsedState.settings.shippingCost
                  : defaultSettings.shippingCost,
              freeShippingThreshold:
                typeof parsedState.settings.freeShippingThreshold === 'number'
                  ? parsedState.settings.freeShippingThreshold
                  : defaultSettings.freeShippingThreshold,
            }
          : defaultSettings,
    }
  } catch {
    return null
  }
}

const saveShopState = (state: PersistedShopState) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(state))
}

const persistedState = loadPersistedShopState()

export const useShopStore = defineStore('shop', {
  state: () => ({
    products: persistedState?.products ?? defaultProducts,
    groups: persistedState?.groups ?? defaultGroups,
    cart: persistedState?.cart ?? ({} as Record<string, number>),
    settings: persistedState?.settings ?? defaultSettings,
  }),
  getters: {
    cartItems(state) {
      return Object.entries(state.cart)
        .map(([productId, quantity]) => {
          const product = state.products.find((item) => item.id === productId)

          if (!product) {
            return null
          }

          return {
            product,
            quantity,
            subtotal: product.price * quantity,
          }
        })
        .filter((item): item is { product: Product; quantity: number; subtotal: number } => item !== null)
    },
    cartSubtotal(state) {
      return Object.entries(state.cart).reduce((total, [productId, quantity]) => {
        const product = state.products.find((item) => item.id === productId)

        if (!product) {
          return total
        }

        return total + product.price * quantity
      }, 0)
    },
    shippingFee(state) {
      const cartItemCount = Object.values(state.cart).reduce((total, qty) => total + qty, 0)

      if (cartItemCount === 0) {
        return 0
      }

      const subtotal = Object.entries(state.cart).reduce((total, [productId, quantity]) => {
        const product = state.products.find((item) => item.id === productId)

        if (!product) {
          return total
        }

        return total + product.price * quantity
      }, 0)

      return subtotal >= state.settings.freeShippingThreshold ? 0 : state.settings.shippingCost
    },
    cartTotal(state) {
      const subtotal = Object.entries(state.cart).reduce((total, [productId, quantity]) => {
        const product = state.products.find((item) => item.id === productId)

        if (!product) {
          return total
        }

        return total + product.price * quantity
      }, 0)

      if (subtotal === 0) {
        return 0
      }

      const shipping = subtotal >= state.settings.freeShippingThreshold ? 0 : state.settings.shippingCost

      return subtotal + shipping
    },
    totalItems(state) {
      return Object.values(state.cart).reduce((total, qty) => total + qty, 0)
    },
    ungroupedProducts(state) {
      return state.products.filter((product) => !product.groupId)
    },
  },
  actions: {
    persistState() {
      saveShopState({
        products: this.products,
        groups: this.groups,
        cart: this.cart,
        settings: this.settings,
      })
    },
    addToCart(productId: string) {
      this.cart[productId] = (this.cart[productId] ?? 0) + 1
      this.persistState()
    },
    updateCartItem(productId: string, quantity: number) {
      if (quantity <= 0) {
        delete this.cart[productId]
        this.persistState()
        return
      }

      this.cart[productId] = quantity
      this.persistState()
    },
    removeFromCart(productId: string) {
      delete this.cart[productId]
      this.persistState()
    },
    clearCart() {
      this.cart = {}
      this.persistState()
    },
    addProduct(payload: Omit<Product, 'id'>) {
      const id = `dog-product-${Date.now()}`
      const groupExists = payload.groupId ? this.groups.some((group) => group.id === payload.groupId) : true

      this.products.push({
        id,
        ...payload,
        imageUrl: payload.imageUrl.trim().length > 0 ? payload.imageUrl : DEFAULT_PRODUCT_IMAGE,
        groupId: groupExists ? payload.groupId : null,
      })

      this.persistState()
    },
    updateProduct(productId: string, payload: Omit<Product, 'id'>) {
      const productIndex = this.products.findIndex((product) => product.id === productId)
      const groupExists = payload.groupId ? this.groups.some((group) => group.id === payload.groupId) : true

      if (productIndex === -1) {
        return
      }

      this.products[productIndex] = {
        id: productId,
        ...payload,
        imageUrl: payload.imageUrl.trim().length > 0 ? payload.imageUrl : DEFAULT_PRODUCT_IMAGE,
        groupId: groupExists ? payload.groupId : null,
      }

      this.persistState()
    },
    deleteProduct(productId: string) {
      this.products = this.products.filter((product) => product.id !== productId)

      if (this.cart[productId]) {
        delete this.cart[productId]
      }

      this.persistState()
    },
    addGroup(name: string) {
      const trimmedName = name.trim()

      if (!trimmedName) {
        return
      }

      const id = `group-${Date.now()}`

      this.groups.push({
        id,
        name: trimmedName,
      })

      this.persistState()
    },
    updateGroup(groupId: string, name: string) {
      const trimmedName = name.trim()

      if (!trimmedName) {
        return
      }

      const groupIndex = this.groups.findIndex((group) => group.id === groupId)

      if (groupIndex === -1) {
        return
      }

      this.groups[groupIndex] = {
        id: groupId,
        name: trimmedName,
      }

      this.persistState()
    },
    deleteGroup(groupId: string) {
      this.groups = this.groups.filter((group) => group.id !== groupId)
      this.products = this.products.map((product) =>
        product.groupId === groupId
          ? {
              ...product,
              groupId: null,
            }
          : product,
      )

      this.persistState()
    },
    updateSettings(payload: Partial<Settings>) {
      this.settings = {
        ...this.settings,
        ...payload,
      }

      this.persistState()
    },
  },
})