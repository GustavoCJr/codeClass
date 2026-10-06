import { obterUsuarioAtual } from '../../config/auth'

const apiUrl = import.meta.env.VITE_API_URL

export async function buscarSalasParaTarefa() {
  const usuarioAtual = await obterUsuarioAtual()

  if (!usuarioAtual) {
    throw new Error('Usuário não autenticado.')
  }

  const response = await fetch(
    `${apiUrl}/api/v1/classrooms/my-classes`,
    {
      headers: {
        Authorization:
          `Bearer ${usuarioAtual.session.access_token}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(
      'Não foi possível carregar as salas.'
    )
  }

  return response.json()
}

export async function criarTarefa(
  classroomId,
  payload
) {
  const usuarioAtual = await obterUsuarioAtual()

  if (!usuarioAtual) {
    throw new Error('Usuário não autenticado.')
  }

  const response = await fetch(
    `${apiUrl}/api/v1/classrooms/${classroomId}/assignments`,
    {
      method: 'POST',

      headers: {
        Authorization:
          `Bearer ${usuarioAtual.session.access_token}`,

        'Content-Type': 'application/json'
      },

      body: JSON.stringify(payload)
    }
  )

  let resultado = null

  try {
    resultado = await response.json()
  } catch {
    resultado = null
  }

  if (!response.ok) {
    console.error(
      'Erro ao criar tarefa:',
      resultado
    )

    const detalhe = resultado?.detail

    if (typeof detalhe === 'string') {
      throw new Error(detalhe)
    }

    if (Array.isArray(detalhe)) {
      const mensagens = detalhe
        .map((item) => item?.msg)
        .filter(Boolean)

      if (mensagens.length) {
        throw new Error(
          mensagens.join(' | ')
        )
      }
    }

    throw new Error(
      'Não foi possível criar a tarefa.'
    )
  }

  return resultado
}
