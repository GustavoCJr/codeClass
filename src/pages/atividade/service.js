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

async function chamarApi(caminho, session) {
  const response = await fetch(
    `${apiUrl}${caminho}`,
    {
      headers: {
        Authorization:
          `Bearer ${session.access_token}`
      }
    }
  )

  if (!response.ok) {
    let detalhe = null

    try {
      detalhe = await response.json()
    } catch {
      detalhe = null
    }

    if (response.status === 403) {
      throw new Error(
        'Você não tem permissão para acessar esta atividade.'
      )
    }

    if (response.status === 404) {
      throw new Error('Atividade não encontrada.')
    }

    if (typeof detalhe?.detail === 'string') {
      throw new Error(detalhe.detail)
    }

    throw new Error(
      'Não foi possível carregar os dados da atividade.'
    )
  }

  return response.json()
}

export async function buscarPaginaAtividade(
  assignmentId
) {
  const session = await obterSessao()

  const [
    atividade,
    submissoes,
    estatisticas
  ] = await Promise.all([
    chamarApi(
      `/api/v1/assignments/${assignmentId}`,
      session
    ),
    chamarApi(
      `/api/v1/assignments/${assignmentId}/submissions`,
      session
    ),
    chamarApi(
      `/api/v1/assignments/${assignmentId}/submissions/stats`,
      session
    )
  ])

  return {
    atividade,
    submissoes,
    estatisticas
  }
}
