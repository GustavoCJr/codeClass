import { supabase } from '../../config/supabase'

const apiUrl = import.meta.env.VITE_API_URL

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

async function tratarResposta(response, mensagemPadrao) {
  let resultado = null

  try {
    resultado = await response.json()
  } catch {
    resultado = null
  }

  if (!response.ok) {
    const detalhe = resultado?.detail

    if (typeof detalhe === 'string') {
      throw new Error(detalhe)
    }

    if (Array.isArray(detalhe)) {
      const mensagens = detalhe
        .map((item) => item?.msg)
        .filter(Boolean)

      if (mensagens.length) {
        throw new Error(mensagens.join(' | '))
      }
    }

    throw new Error(mensagemPadrao)
  }

  return resultado
}

async function chamarGet(caminho, session) {
  const response = await fetch(
    `${apiUrl}${caminho}`,
    {
      headers: {
        Authorization:
          `Bearer ${session.access_token}`
      }
    }
  )

  return tratarResposta(
    response,
    'Não foi possível carregar os dados.'
  )
}

export async function buscarPaginaCorrecao(
  submissionId
) {
  const session = await obterSessao()

  const submissao = await chamarGet(
    `/api/v1/submissions/${submissionId}`,
    session
  )

  const atividade = await chamarGet(
    `/api/v1/assignments/${submissao.assignment.id}`,
    session
  )

  return {
    submissao,
    atividade
  }
}

export async function salvarAvaliacao(
  submissionId,
  payload
) {
  const session = await obterSessao()

  const response = await fetch(
    `${apiUrl}/api/v1/submissions/${submissionId}/evaluation`,
    {
      method: 'PUT',
      headers: {
        Authorization:
          `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }
  )

  return tratarResposta(
    response,
    'Não foi possível salvar a correção.'
  )
}
