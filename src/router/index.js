// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '@/views/login/LoginPage.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'

const routes = [
  { path: '/login', component: LoginPage },
  {
    path: '/',
    component: AdminLayout,
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', component: () => import('@/views/dashboard/DashboardPage.vue') },
      { path: 'financial', component: () => import('@/views/financial/FinancialPage.vue') },
      { path: 'users', component: () => import('@/views/users/UserManagePage.vue') },
      { path: 'withdrawal', component: () => import('@/views/withdrawal/WithdrawalManage.vue') },
       { path: 'notify', component: () => import('@/views/notify/NotifyCenter.vue') },
     { path: 'products', component: () => import('@/views/products/ProductsPage.vue') },
      { path: 'InterestControl', component: () => import('@/views/InterestControl/InterestControl.vue') }


    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 登录守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin-token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
