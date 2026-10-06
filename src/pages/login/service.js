import { supabase } from '../../config/supabase'

const apiUrl = import.meta.env.VITE_API_URL

export async function autenticarUsuario({
  identificador,
  senha,
  manterConectado
}) {
  const email = identificador?.trim()

  if (!email || !senha) {
    throw new Error('Informe seu e-mail e sua senha.')
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha
  })

  if (error) {
    if (
      error.code === 'invalid_credentials' ||
      error.message === 'Invalid login credentials'
    ) {
      throw new Error('E-mail ou senha inválidos.')
    }

    throw new Error(
      'Não foi possível entrar agora. Tente novamente.'
    )
  }

  if (!data.user || !data.session) {
    throw new Error('Não foi possível criar sua sessão.')
  }

  const response = await fetch(`${apiUrl}/api/v1/users/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${data.session.access_token}`
    }
  })

  if (!response.ok) {
    throw new Error(
      'Login realizado, mas não foi possível carregar seu perfil.'
    )
  }

  const perfil = await response.json()

  let redirectUrl = null

  if (
    perfil.role === 'owner' ||
    perfil.role === 'admin' ||
    perfil.role === 'teacher'
  ) {
    redirectUrl = '/dashboardProfessor.html'
  }

  return {
    autenticado: true,
    manterConectado,
    usuario: data.user,
    sessao: data.session,
    perfil,
    redirectUrl,
    mensagem: `Bem-vindo, ${perfil.full_name || perfil.email}!`
  }
}