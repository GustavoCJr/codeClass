import Sala from './sala.vue'

import { createPageApp } from '../../config/createPageApp'
import { obterUsuarioAtual } from '../../config/auth'
import { definirContextoSala } from './service'

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
    role !== 'teacher'
  ) {
    window.location.href = '/login.html'
    return
  }

  definirContextoSala(usuarioAtual.perfil)

  createPageApp(Sala)
}

iniciarPagina()
