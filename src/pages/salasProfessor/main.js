import SalasProfessor from './salasProfessor.vue'

import { createPageApp } from '../../config/createPageApp'
import { obterUsuarioAtual } from '../../config/auth'
import { definirContextoSalas } from './service'

async function iniciarPagina() {
  const usuarioAtual = await obterUsuarioAtual()

  if (!usuarioAtual) {
    window.location.href = '/login.html'
    return
  }

  const role = usuarioAtual.perfil?.role

  if (
    role !== 'owner' &&
    role !== 'admin' &&
    role !== 'teacher' &&
    role !== 'student'
  ) {
    window.location.href = '/login.html'
    return
  }

  definirContextoSalas(usuarioAtual.perfil)

  createPageApp(SalasProfessor)
}

iniciarPagina()
