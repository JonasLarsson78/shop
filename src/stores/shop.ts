import { defineStore } from 'pinia'

export interface Product {
  id: number
  name: string
  description: string
  price: number
  imageUrl: string
  groupId: number | null
}

export interface ProductGroup {
  id: number
  name: string
}

interface Settings {
  storeName: string
  subName: string
  heroKicker: string
  heroTitle: string
  heroLead: string
  heroPoint1: string
  heroPoint2: string
  heroPoint3: string
  shopHeroKicker: string
  shopHeroTitle: string
  shopHeroLead: string
  cartHeroKicker: string
  cartHeroTitle: string
  cartHeroLead: string
  checkoutHeroKicker: string
  checkoutHeroTitle: string
  checkoutHeroLead: string
  shippingCost: number
  freeShippingThreshold: number
}

interface PersistedShopState {
  cart: Record<string, number>
}

interface ShopSnapshot {
  products: Product[]
  groups: ProductGroup[]
  settings: Settings | null
}

const SHOP_STORAGE_KEY = 'template-shop-state-v1'
const DEFAULT_PRODUCT_IMAGE = ''

const defaultSettings: Settings = {
  storeName: '',
  subName: '',
  heroKicker: 'Modern webshop',
  heroTitle: 'Stilren template för en modern butik',
  heroLead: 'Utvalda favoriter för vardagliga behov. Filtrera snabbt via grupper och fyll varukorgen på några sekunder.',
  heroPoint1: 'Snabbt att hitta rätt produkter',
  heroPoint2: 'Tydliga grupper för varje behov',
  heroPoint3: 'Smidig checkout utan krångel',
  shopHeroKicker: 'Webshop',
  shopHeroTitle: '',
  shopHeroLead: 'Produkter för en modern onlinebutik.',
  cartHeroKicker: 'Din beställning',
  cartHeroTitle: 'Varukorg',
  cartHeroLead: 'Granska produkterna innan du går vidare till kassan.',
  checkoutHeroKicker: 'Trygg checkout',
  checkoutHeroTitle: 'Kassa',
  checkoutHeroLead: 'Fyll i dina uppgifter och kontrollera ordern innan du bekräftar köpet.',
  shippingCost: 0,
  freeShippingThreshold: 0,
}

const apiRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return (await response.json()) as T
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

    return {
      cart: parsedState.cart && typeof parsedState.cart === 'object' ? parsedState.cart : {},
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
const toCartKey = (productId: number) => String(productId)

export const useShopStore = defineStore('shop', {
  state: () => ({
    products: [] as Product[],
    groups: [] as ProductGroup[],
    cart: persistedState?.cart ?? ({} as Record<string, number>),
    settings: defaultSettings,
    dbStatus: 'loading' as 'loading' | 'connected' | 'error',
    hasInitializedData: false,
  }),
  getters: {
    cartItems(state) {
      return Object.entries(state.cart)
        .map(([productId, quantity]) => {
          const numericProductId = Number(productId)
          const product = state.products.find((item) => item.id === numericProductId)

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
        const numericProductId = Number(productId)
        const product = state.products.find((item) => item.id === numericProductId)

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
        const numericProductId = Number(productId)
        const product = state.products.find((item) => item.id === numericProductId)

        if (!product) {
          return total
        }

        return total + product.price * quantity
      }, 0)

      return subtotal >= state.settings.freeShippingThreshold ? 0 : state.settings.shippingCost
    },
    cartTotal(state) {
      const subtotal = Object.entries(state.cart).reduce((total, [productId, quantity]) => {
        const numericProductId = Number(productId)
        const product = state.products.find((item) => item.id === numericProductId)

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
        cart: this.cart,
      })
    },
    async initializeData() {
      try {
        const snapshot = await apiRequest<ShopSnapshot>('/api/bootstrap', {
          method: 'POST',
        })

        this.products = snapshot.products
        this.groups = snapshot.groups
        this.settings = snapshot.settings ?? defaultSettings
        this.dbStatus = 'connected'
        this.persistState()
      } catch (error) {
        console.error('Failed to load shop data from DB API:', error)
        this.products = []
        this.groups = []
        this.dbStatus = 'error'
      } finally {
        this.hasInitializedData = true
      }
    },
    addToCart(productId: number, quantity = 1) {
      const safeQuantity = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1
      const key = toCartKey(productId)
      this.cart[key] = (this.cart[key] ?? 0) + safeQuantity
      this.persistState()
    },
    updateCartItem(productId: number, quantity: number) {
      const key = toCartKey(productId)

      if (quantity <= 0) {
        delete this.cart[key]
        this.persistState()
        return
      }

      this.cart[key] = quantity
      this.persistState()
    },
    removeFromCart(productId: number) {
      delete this.cart[toCartKey(productId)]
      this.persistState()
    },
    clearCart() {
      this.cart = {}
      this.persistState()
    },
    applyLocalAddProduct(payload: Omit<Product, 'id'>) {
      const id = Date.now()
      const groupExists = payload.groupId ? this.groups.some((group) => group.id === payload.groupId) : true

      this.products.push({
        id,
        ...payload,
        imageUrl: payload.imageUrl.trim().length > 0 ? payload.imageUrl : DEFAULT_PRODUCT_IMAGE,
        groupId: groupExists ? payload.groupId : null,
      })

      this.persistState()
    },
    async addProduct(payload: Omit<Product, 'id'>) {
      const safePayload = {
        ...payload,
        imageUrl: payload.imageUrl.trim().length > 0 ? payload.imageUrl : DEFAULT_PRODUCT_IMAGE,
      }

      try {
        const product = await apiRequest<Product>('/api/products', {
          method: 'POST',
          body: JSON.stringify(safePayload),
        })

        this.products.push(product)
      } catch (error) {
        console.error('Failed to add product in DB API:', error)
        return
      }

      this.persistState()
    },
    applyLocalUpdateProduct(productId: number, payload: Omit<Product, 'id'>) {
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
    async updateProduct(productId: number, payload: Omit<Product, 'id'>) {
      const safePayload = {
        ...payload,
        imageUrl: payload.imageUrl.trim().length > 0 ? payload.imageUrl : DEFAULT_PRODUCT_IMAGE,
      }

      try {
        const updated = await apiRequest<Product>(`/api/products/${productId}`, {
          method: 'PUT',
          body: JSON.stringify(safePayload),
        })

        const productIndex = this.products.findIndex((product) => product.id === productId)
        if (productIndex === -1) {
          return
        }

        this.products[productIndex] = updated
      } catch (error) {
        console.error('Failed to update product in DB API:', error)
        return
      }

      this.persistState()
    },
    applyLocalDeleteProduct(productId: number) {
      this.products = this.products.filter((product) => product.id !== productId)

      const key = toCartKey(productId)
      if (this.cart[key]) {
        delete this.cart[key]
      }

      this.persistState()
    },
    async deleteProduct(productId: number) {
      const productIndex = this.products.findIndex((product) => product.id === productId)

      if (productIndex === -1) {
        return
      }

      const deletedProduct = this.products[productIndex]

      if (!deletedProduct) {
        return
      }

      const key = toCartKey(productId)
      const previousCartQuantity = this.cart[key] ?? null

      this.products.splice(productIndex, 1)

      if (this.cart[key]) {
        delete this.cart[key]
      }

      this.persistState()

      try {
        await apiRequest<{ ok: boolean }>(`/api/products/${productId}`, {
          method: 'DELETE',
        })
      } catch (error) {
        console.error('Failed to delete product in DB API:', error)
        this.products.splice(productIndex, 0, deletedProduct)

        if (previousCartQuantity !== null) {
          this.cart[key] = previousCartQuantity
        }

        this.persistState()
        return
      }
    },
    applyLocalAddGroup(name: string) {
      const trimmedName = name.trim()

      if (!trimmedName) {
        return
      }

      const id = Date.now()

      this.groups.push({
        id,
        name: trimmedName,
      })

      this.persistState()
    },
    async addGroup(name: string) {
      const trimmedName = name.trim()

      if (!trimmedName) {
        return
      }

      try {
        const group = await apiRequest<ProductGroup>('/api/groups', {
          method: 'POST',
          body: JSON.stringify({ name: trimmedName }),
        })

        this.groups.push(group)
      } catch (error) {
        console.error('Failed to add group in DB API:', error)
        return
      }

      this.persistState()
    },
    applyLocalUpdateGroup(groupId: number, name: string) {
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
    async updateGroup(groupId: number, name: string) {
      const trimmedName = name.trim()

      if (!trimmedName) {
        return
      }

      try {
        const updated = await apiRequest<ProductGroup>(`/api/groups/${groupId}`, {
          method: 'PUT',
          body: JSON.stringify({ name: trimmedName }),
        })

        const groupIndex = this.groups.findIndex((group) => group.id === groupId)
        if (groupIndex === -1) {
          return
        }

        this.groups[groupIndex] = updated
      } catch (error) {
        console.error('Failed to update group in DB API:', error)
        return
      }

      this.persistState()
    },
    applyLocalDeleteGroup(groupId: number) {
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
    async deleteGroup(groupId: number) {
      const previousGroups = [...this.groups]
      const previousProducts = this.products.map((product) => ({ ...product }))

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

      try {
        await apiRequest<{ ok: boolean }>(`/api/groups/${groupId}`, {
          method: 'DELETE',
        })
      } catch (error) {
        console.error('Failed to delete group in DB API:', error)
        this.groups = previousGroups
        this.products = previousProducts
        this.persistState()
        return
      }
    },
    async updateSettings(payload: Partial<Settings>) {
      try {
        const updated = await apiRequest<Settings>('/api/settings', {
          method: 'PUT',
          body: JSON.stringify(payload),
        })

        this.settings = updated
      } catch (error) {
        console.error('Failed to update settings in DB API:', error)
        return
      }

      this.persistState()
    },
  },
})