import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ShopView from '../views/ShopView.vue'
import CartView from '../views/CartView.vue'
import CheckoutView from '../views/CheckoutView.vue'
import AdminView from '../views/AdminView.vue'
import AdminProductsView from '../views/admin/AdminProductsView.vue'
import AdminGroupsView from '../views/admin/AdminGroupsView.vue'
import AdminSettingsView from '../views/admin/AdminSettingsView.vue'
import AdminThemeView from '../views/admin/AdminThemeView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/shop', name: 'shop', component: ShopView },
    { path: '/cart', name: 'cart', component: CartView },
    { path: '/checkout', name: 'checkout', component: CheckoutView },
    {
      path: '/admin',
      component: AdminView,
      children: [
        { path: '', redirect: '/admin/products' },
        { path: 'products', name: 'admin-products', component: AdminProductsView },
        { path: 'groups', name: 'admin-groups', component: AdminGroupsView },
        { path: 'settings', name: 'admin-settings', component: AdminSettingsView },
        { path: 'theme', name: 'admin-theme', component: AdminThemeView },
      ],
    },
  ],
})

export default router