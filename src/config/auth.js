import { supabase } from './supabase'

const apiUrl = import.meta.env.VITE_API_URL

export async function obterUsuarioAtual() {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession()

  if (error || !session) {
    return null
  }

  const response = await fetch(`${apiUrl}/api/v1/users/me`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  })

  if (!response.ok) {
    await supabase.auth.signOut()
    return null
  }

  const perfil = await response.json()

  return {
    session,
    perfil
  }
}