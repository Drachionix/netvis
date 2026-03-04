import { createApp } from 'vue'
import App from './App.vue'

const root = document.createElement('div')
root.setAttribute('id', 'root')
document.body.appendChild(root)

createApp(App).mount('#root')
