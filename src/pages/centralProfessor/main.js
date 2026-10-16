import { obterUsuarioAtual } from '../../config/auth'
import { createPageApp } from '../../config/createPageApp'
import CentralProfessor from './centralProfessor.vue'
async function iniciar() {
  const usuario = await obterUsuarioAtual()
  if (!usuario) { window.location.href = '/login.html'; return }
  if (!['teacher', 'admin', 'owner'].includes(usuario.perfil.role)) { window.location.href = '/dashboardAluno.html'; return }
  createPageApp(CentralProfessor)
}
iniciar()
