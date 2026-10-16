import { api } from '../../config/api'
import { validarNomePerfil, validarSenhaPerfil } from './perfilValidacao'

export async function alterarNomePerfil(nome) {
  return api('/users/me', {
    method: 'PATCH',
    body: JSON.stringify({ full_name: validarNomePerfil(nome) })
  })
}

export async function alterarSenhaPerfil(senha, confirmacao) {
  const senhaValida = validarSenhaPerfil(senha, confirmacao)
  return api('/users/me/password', {
    method: 'PUT',
    body: JSON.stringify({ password: senhaValida })
  })
}
