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
    let detalhe = null

    try {
      detalhe = await response.json()
    } catch {
      detalhe = null
    }

    if (
      typeof detalhe?.detail === 'string'
    ) {
      throw new Error(detalhe.detail)
    }

    throw new Error(
      'Não foi possível carregar as salas.'
    )
  }

  return response.json()
}
