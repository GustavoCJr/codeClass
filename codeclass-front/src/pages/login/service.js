const TEMPO_RESPOSTA_MOCK = 700

function aguardar(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

/**
 * Mock temporário de autenticação.
 *
 * O papel do usuário NÃO é decidido pelo front-end.
 * Quando houver integração real, o backend deverá informar
 * contexto institucional, permissões e destino autorizado.
 */
export async function autenticarUsuario({
  identificador,
  senha,
  manterConectado
}) {
  await aguardar(TEMPO_RESPOSTA_MOCK)

  if (!identificador?.trim() || !senha) {
    throw new Error('Informe seu usuário ou e-mail e sua senha.')
  }

  return {
    autenticado: true,
    manterConectado,
    contextoInstitucional: null,
    redirectUrl: null,
    mensagem:
      'Login simulado com sucesso. O redirecionamento será definido pelo backend.'
  }
}
