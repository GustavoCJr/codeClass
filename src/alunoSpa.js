import { createApp } from 'vue'
import AlunoLayout from './layouts/AlunoLayout.vue'
import { configurarPrimeVue } from './config/primevue'
import { obterUsuarioAtual } from './config/auth'
import { definirContextoDashboardAluno } from './pages/dashboardAluno/service'
import { definirContextoSalas } from './pages/salasProfessor/service'
import { definirContextoSala } from './pages/sala/service'
import { alunoRouter } from './router/aluno'
import './pages/dashboardAluno/estilos.css'

async function iniciar() {
  const usuario = await obterUsuarioAtual()
  if (!usuario || usuario.perfil?.role !== 'student') {
    window.location.replace(usuario ? '/professor.html#/professor/dashboard' : '/login.html')
    return
  }
  definirContextoDashboardAluno(usuario.perfil)
  definirContextoSalas(usuario.perfil)
  definirContextoSala(usuario.perfil)
  const app = createApp(AlunoLayout)
  configurarPrimeVue(app)
  app.use(alunoRouter)
  await alunoRouter.isReady()
  app.mount('#app')
}
iniciar().catch(error => {
  console.error('Falha ao iniciar área do aluno', error)
  window.location.replace('/login.html')
})
