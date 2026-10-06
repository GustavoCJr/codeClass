import { createApp } from 'vue'

import { configurarPrimeVue } from './primevue'

export function createPageApp(PageComponent) {
    const app = createApp(PageComponent)

    configurarPrimeVue(app)

    app.mount('#app')
}