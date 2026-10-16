import Atividade from './atividade.vue'
import AtividadeAluno from './atividadeAluno.vue'

import { createPageApp } from '../../config/createPageApp'
import { obterUsuarioAtual } from '../../config/auth'

async function iniciarPagina() {
  const usuarioAtual = await obterUsuarioAtual()

  if (!usuarioAtual) {
    window.location.href = '/login.html'
    return
  }

  const role = usuarioAtual.perfil?.role

  if (role === 'student') {
    createPageApp(AtividadeAluno)
    return
  }

  if (
    role !== 'owner' &&
    role !== 'admin' &&
    role !== 'teacher'
  ) {
    window.location.href = '/login.html'
    return
  }

  createPageApp(Atividade)
}

iniciarPagina()
