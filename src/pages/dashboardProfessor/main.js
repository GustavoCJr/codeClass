import DashboardProfessor from './dashboardProfessor.vue'

import { createPageApp } from '../../config/createPageApp'
import { obterUsuarioAtual } from '../../config/auth'
import { definirPerfilDashboard } from './service'

import './estilos.css'

async function iniciarDashboard() {
  const usuarioAtual = await obterUsuarioAtual()

  if (!usuarioAtual) {
    window.location.href = '/login.html'
    return
  }

  const role = usuarioAtual.perfil?.role

  if (
    role !== 'owner' &&
    role !== 'admin' &&
    role !== 'teacher'
  ) {
    window.location.href = '/login.html'
    return
  }

  definirPerfilDashboard(usuarioAtual.perfil)

  createPageApp(DashboardProfessor)
}

iniciarDashboard()