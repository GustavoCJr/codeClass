import DashboardAluno from './dashboardAluno.vue'

import { createPageApp } from '../../config/createPageApp'
import { obterUsuarioAtual } from '../../config/auth'
import {
  definirContextoDashboardAluno
} from './service'

async function iniciarDashboardAluno() {
  const usuarioAtual =
    await obterUsuarioAtual()

  if (!usuarioAtual) {
    window.location.href = '/login.html'
    return
  }

  const role =
    usuarioAtual.perfil?.role

  if (role !== 'student') {
    if (
      role === 'owner' ||
      role === 'admin' ||
      role === 'teacher'
    ) {
      window.location.href =
        '/dashboardProfessor.html'
      return
    }

    window.location.href = '/login.html'
    return
  }

  definirContextoDashboardAluno(
    usuarioAtual.perfil
  )

  createPageApp(DashboardAluno)
}

iniciarDashboardAluno()
