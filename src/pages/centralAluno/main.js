import CentralAluno from './centralAluno.vue'
import { obterUsuarioAtual } from '../../config/auth'
import { createPageApp } from '../../config/createPageApp'

async function iniciar() {
  const usuario = await obterUsuarioAtual()
  if (!usuario) { window.location.href = '/login.html'; return }
  if (usuario.perfil?.role !== 'student') { window.location.href = '/dashboardProfessor.html'; return }
  createPageApp(CentralAluno)
}
iniciar()
