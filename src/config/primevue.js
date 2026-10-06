import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

import '../styles/global.css'
import { inicializarTema } from './theme'

export function configurarPrimeVue(app) {
  inicializarTema()

  app.use(PrimeVue, {
    license: import.meta.env.VITE_PRIMEUI_LICENSE,

    theme: {
      preset: Aura,

      options: {
        darkModeSelector: '[data-theme="dark"]'
      }
    }
  })
}