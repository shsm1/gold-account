import { createRouter, createWebHashHistory } from 'vue-router'
import Home from './views/Home.vue'
import Transactions from './views/Transactions.vue'
import AddTransaction from './views/AddTransaction.vue'
import Settings from './views/Settings.vue'
import Icbc from './views/Icbc.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/transactions', component: Transactions },
  { path: '/add', component: AddTransaction },
  { path: '/edit/:id', component: AddTransaction },
  { path: '/settings', component: Settings },
  { path: '/icbc', component: Icbc }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
