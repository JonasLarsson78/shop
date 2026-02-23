import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ShopView from '../views/ShopView.vue'
import CartView from '../views/CartView.vue'
import CheckoutView from '../views/CheckoutView.vue'
import AdminView from '../views/AdminView.vue'
import AdminProductsView from '../views/admin/AdminProductsView.vue'
import AdminGroupsView from '../views/admin/AdminGroupsView.vue'
import AdminOrdersView from '../views/admin/AdminOrdersView.vue'
import AdminSettingsView from '../views/admin/AdminSettingsView.vue'
import AdminThemeView from '../views/admin/AdminThemeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import AccountView from '../views/AccountView.vue'
import ProductView from '../views/ProductView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/shop', name: 'shop', component: ShopView },
    { path: '/product/:id', name: 'product', component: ProductView },
    { path: '/cart', name: 'cart', component: CartView },
    { path: '/checkout', name: 'checkout', component: CheckoutView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/register', name: 'register', component: RegisterView },
    {
      path: '/account',
      name: 'account',
      component: AccountView,
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      component: AdminView,
      children: [
        { path: '', redirect: '/admin/products' },
        {
          path: 'products',
          name: 'admin-products',
          component: AdminProductsView,
        },
        { path: 'groups', name: 'admin-groups', component: AdminGroupsView },
        { path: 'orders', name: 'admin-orders', component: AdminOrdersView },
        {
          path: 'settings',
          name: 'admin-settings',
          component: AdminSettingsView,
        },
        { path: 'theme', name: 'admin-theme', component: AdminThemeView },
      ],
    },
  ],
})

// Simple auth guard: checks localStorage for persisted user
const AUTH_KEY = 'shop-auth-v1'

router.beforeEach((to) => {
  const requiresAuth = to.matched.some((r) => r.meta && r.meta.requiresAuth)
  if (!requiresAuth) return true

  let user = null
  try {
    const raw = window.localStorage.getItem(AUTH_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { user?: any }
      user = parsed.user ?? null
    }
  } catch {
    user = null
  }

  if (user) return true

  return { path: '/login', query: { redirect: to.fullPath } }
})

export default router
