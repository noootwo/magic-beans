import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import './styles/theme.css'
import App from './App.vue'

const pinia = createPinia()
createApp(App).use(pinia).use(router).mount('#app')

// 为根元素添加主题类
document.documentElement.classList.add('font-body', 'bg-gradient-theme', 'text-primary')
