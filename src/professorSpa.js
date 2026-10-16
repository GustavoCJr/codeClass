import { createApp } from 'vue'
import ProfessorLayout from './layouts/ProfessorLayout.vue'
import { configurarPrimeVue } from './config/primevue'
import { obterUsuarioAtual } from './config/auth'
import { definirPerfilDashboard } from './pages/dashboardProfessor/service'
import { definirContextoSalas } from './pages/salasProfessor/service'
import { definirContextoSala } from './pages/sala/service'
import { router } from './router/index'
import './pages/dashboardProfessor/estilos.css'

async function iniciar() {
  const usuario = await obterUsuarioAtual()
  if (!usuario || !['owner', 'admin', 'teacher'].includes(usuario.perfil?.role)) {
    window.location.replace('/login.html')
    return
  }
  definirPerfilDashboard(usuario.perfil)
  definirContextoSalas(usuario.perfil)
  definirContextoSala(usuario.perfil)
  const app = createApp(ProfessorLayout)
  configurarPrimeVue(app)
  app.use(router)
  await router.isReady()
  app.mount('#app')
}
iniciar().catch((erro) => {
  console.error('Falha ao iniciar área do professor', erro)
  window.location.replace('/login.html')
})
