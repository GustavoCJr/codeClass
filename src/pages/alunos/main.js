import { obterUsuarioAtual } from '../../config/auth'
import { createPageApp } from '../../config/createPageApp'
import Alunos from './alunos.vue'
async function iniciar() {
  const usuario = await obterUsuarioAtual()
  if (!usuario) { window.location.href = '/login.html'; return }
  if (!['admin', 'owner'].includes(usuario.perfil.role)) { window.location.href = usuario.perfil.role === 'student' ? '/dashboardAluno.html' : '/dashboardProfessor.html'; return }
  createPageApp(Alunos)
}
iniciar()
