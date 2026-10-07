import { supabase } from '../../config/supabase'

const apiUrl = import.meta.env.VITE_API_URL

let perfilAtual = null

export function definirContextoSalas(perfil) {
  perfilAtual = perfil
}

async function obterSessao() {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession()

  if (error || !session) {
    throw new Error('Usuário não autenticado.')
  }

  return session
}

async function extrairMensagemErro(response, mensagemPadrao) {
  let detalhe = null

  try {
    detalhe = await response.json()
  } catch {
    detalhe = null
  }

  if (typeof detalhe?.detail === 'string') {
    return detalhe.detail
  }

  if (
    Array.isArray(detalhe?.detail) &&
    detalhe.detail.length
  ) {
    const primeiraMensagem = detalhe.detail[0]?.msg

    if (typeof primeiraMensagem === 'string') {
      return primeiraMensagem
    }
  }

  return mensagemPadrao
}

export async function buscarSalas() {
  const session = await obterSessao()

  const response = await fetch(
    `${apiUrl}/api/v1/classrooms/my-classes`,
    {
      headers: {
        Authorization:
          `Bearer ${session.access_token}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(
      await extrairMensagemErro(
        response,
        'Não foi possível carregar as salas.'
      )
    )
  }

  return response.json()
}

export async function criarSala(payload) {
  const session = await obterSessao()

  const organizationId =
    perfilAtual?.organization_id

  if (!organizationId) {
    throw new Error(
      'Não foi possível identificar a organização do usuário.'
    )
  }

  const nome = String(payload?.nome || '').trim()
  const descricao =
    String(payload?.descricao || '').trim()

  if (nome.length < 3) {
    throw new Error(
      'O nome da sala deve ter pelo menos 3 caracteres.'
    )
  }

  if (nome.length > 255) {
    throw new Error(
      'O nome da sala deve ter no máximo 255 caracteres.'
    )
  }

  const response = await fetch(
    `${apiUrl}/api/v1/orgs/${encodeURIComponent(
      organizationId
    )}/classrooms`,
    {
      method: 'POST',
      headers: {
        Authorization:
          `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: nome,
        description: descricao || null
      })
    }
  )

  if (!response.ok) {
    throw new Error(
      await extrairMensagemErro(
        response,
        'Não foi possível criar a sala.'
      )
    )
  }

  return response.json()
}
