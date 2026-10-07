import { supabase } from '../../config/supabase'

const apiUrl = import.meta.env.VITE_API_URL

let perfilAtual = null

export function definirContextoSala(perfil) {
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

async function chamarApi(
  caminho,
  options = {},
  session = null,
  mensagemPadrao = 'Não foi possível concluir a operação.'
) {
  const sessao = session || await obterSessao()

  const response = await fetch(
    `${apiUrl}${caminho}`,
    {
      ...options,
      headers: {
        Authorization:
          `Bearer ${sessao.access_token}`,
        ...(options.body
          ? { 'Content-Type': 'application/json' }
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

    if (typeof detalhe?.detail === 'string') {
      throw new Error(detalhe.detail)
    }

    if (
      Array.isArray(detalhe?.detail) &&
      detalhe.detail.length
    ) {
      const mensagem =
        detalhe.detail[0]?.msg

      if (typeof mensagem === 'string') {
        throw new Error(mensagem)
      }
    }

    if (response.status === 403) {
      throw new Error(
        'Você não tem permissão para realizar esta ação.'
      )
    }

    if (response.status === 404) {
      throw new Error(
        'O recurso solicitado não foi encontrado.'
      )
    }

    throw new Error(mensagemPadrao)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export async function buscarPaginaSala(classroomId) {
  const session = await obterSessao()

  const [
    sala,
    atividades,
    membros
  ] = await Promise.all([
    chamarApi(
      `/api/v1/classrooms/${classroomId}`,
      {},
      session,
      'Não foi possível carregar os dados da sala.'
    ),

    chamarApi(
      `/api/v1/classrooms/${classroomId}/assignments`,
      {},
      session,
      'Não foi possível carregar as atividades da sala.'
    ),

    chamarApi(
      `/api/v1/classrooms/${classroomId}/members`,
      {},
      session,
      'Não foi possível carregar os participantes da sala.'
    )
  ])

  return {
    sala,
    atividades,
    membros
  }
}

export async function buscarAlunosOrganizacao(
  busca = ''
) {
  const organizationId =
    perfilAtual?.organization_id

  if (!organizationId) {
    throw new Error(
      'Não foi possível identificar a organização do usuário.'
    )
  }

  const params = new URLSearchParams({
    role: 'student',
    is_active: 'true',
    limit: '50',
    offset: '0'
  })

  const termo = String(busca || '').trim()

  if (termo) {
    params.set('search', termo)
  }

  return chamarApi(
    `/api/v1/orgs/${encodeURIComponent(
      organizationId
    )}/members?${params.toString()}`,
    {},
    null,
    'Não foi possível buscar os alunos da instituição.'
  )
}

export async function matricularAluno(
  classroomId,
  studentId
) {
  if (!classroomId || !studentId) {
    throw new Error(
      'Não foi possível identificar a sala ou o aluno.'
    )
  }

  return chamarApi(
    `/api/v1/classrooms/${encodeURIComponent(
      classroomId
    )}/students`,
    {
      method: 'POST',
      body: JSON.stringify({
        student_id: studentId
      })
    },
    null,
    'Não foi possível adicionar o aluno à sala.'
  )
}
