export function validarNomePerfil(nome) {
  const limpo = String(nome ?? '').trim().replace(/\s+/g, ' ')
  if (limpo.length < 2) throw new Error('Informe um nome com pelo menos 2 caracteres.')
  if (limpo.length > 255) throw new Error('O nome deve ter no máximo 255 caracteres.')
  return limpo
}

export function validarSenhaPerfil(senha, confirmacao) {
  if (typeof senha !== 'string' || senha.length < 6) {
    throw new Error('A nova senha deve conter pelo menos 6 caracteres.')
  }
  if (senha !== confirmacao) throw new Error('A confirmação da senha não confere.')
  return senha
}

