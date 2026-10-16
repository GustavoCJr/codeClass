import { supabase } from '../../config/supabase'

const apiUrl = import.meta.env.VITE_API_URL

function destinoPorRole(role) {
  if (role === 'student') {
    return '/aluno.html#/aluno/dashboard'
  }

  if (
    role === 'owner' ||
    role === 'admin' ||
    role === 'teacher'
  ) {
    return '/professor.html#/professor/dashboard'
  }

  return null
}

async function mensagemErroApi(response) {
  try {
    const body = await response.json()

    if (typeof body?.detail === 'string') {
      return body.detail
    }
  } catch {
    // O fallback abaixo cobre respostas sem JSON.
  }

  return 'Não foi possível validar seu acesso institucional.'
}

export async function autenticarUsuario({
  identificador,
  senha,
  manterConectado
}) {
  const email = String(
    identificador || ''
  ).trim()

  if (!email || !senha) {
    throw new Error(
      'Informe seu usuário ou e-mail e sua senha.'
    )
  }

  const {
    data,
    error
  } = await supabase.auth.signInWithPassword({
    email,
    password: senha
  })

  if (error || !data?.session) {
    throw new Error(
      'E-mail ou senha inválidos.'
    )
  }

  const response = await fetch(
    `${apiUrl}/api/v1/users/me`,
    {
      headers: {
        Authorization:
          `Bearer ${data.session.access_token}`
      }
    }
  )

  if (!response.ok) {
    const mensagem =
      await mensagemErroApi(response)

    await supabase.auth.signOut()

    throw new Error(mensagem)
  }

  const perfil = await response.json()
  const redirectUrl =
    destinoPorRole(perfil.role)

  if (!redirectUrl) {
    await supabase.auth.signOut()

    throw new Error(
      'Seu perfil não possui uma área disponível no CodeClass.'
    )
  }

  return {
    autenticado: true,
    manterConectado,
    perfil,
    redirectUrl,
    mensagem: 'Login realizado com sucesso.'
  }
}
