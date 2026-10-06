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

async function chamarApi(
  caminho,
  options = {},
  session = null
) {
  const sessao =
    session || await obterSessao()

  const response = await fetch(
    `${apiUrl}${caminho}`,
    {
      ...options,

      headers: {
        Authorization:
          `Bearer ${sessao.access_token}`,

        ...(options.body
          ? {
              'Content-Type':
                'application/json'
            }
          : {}),

        ...(options.headers || {})
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
        'Você não tem permissão para acessar esta sala.'
      )
    }

    if (response.status === 404) {
      throw new Error(
        'Sala não encontrada.'
      )
    }

    if (
      typeof detalhe?.detail === 'string'
    ) {
      throw new Error(
        detalhe.detail
      )
    }

    throw new Error(
      'Não foi possível carregar os dados da sala.'
    )
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export async function buscarPaginaSala(
  classroomId
) {
  const session = await obterSessao()

  const [
    sala,
    atividades,
    membros
  ] = await Promise.all([
    chamarApi(
      `/api/v1/classrooms/${classroomId}`,
      {},
      session
    ),

    chamarApi(
      `/api/v1/classrooms/${classroomId}/assignments`,
      {},
      session
    ),

    chamarApi(
      `/api/v1/classrooms/${classroomId}/members`,
      {},
      session
    )
  ])

  return {
    sala,
    atividades,
    membros
  }
}