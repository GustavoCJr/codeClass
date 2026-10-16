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

async function chamarApi(caminho, session, options = {}) {
  const response = await fetch(
    `${apiUrl}${caminho}`,
    {
      ...options,
      headers: {
        Authorization:
          `Bearer ${session.access_token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {})
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

    if (Array.isArray(detalhe?.detail)) {
      throw new Error(detalhe.detail[0]?.msg || 'Confira as respostas informadas.')
    }

    throw new Error(
      'Não foi possível carregar os dados da atividade.'
    )
  }

  return response.json()
}

export async function buscarAtividadeAluno(assignmentId) {
  const session = await obterSessao()
  const id = encodeURIComponent(assignmentId)
  const [atividade, submissoes] = await Promise.all([
    chamarApi(`/api/v1/assignments/${id}`, session),
    chamarApi(`/api/v1/assignments/${id}/submissions`, session)
  ])
  const resumo = submissoes[0]
  const submissao = resumo
    ? await chamarApi(`/api/v1/submissions/${encodeURIComponent(resumo.id)}`, session)
    : null
  return { atividade, submissao }
}

export async function salvarRespostasAluno(assignmentId, content, rascunho = false) {
  if (rascunho && content.answers?.some(resposta => 'text_answer' in resposta)) {
    throw new Error('O salvamento de rascunhos com respostas abertas está temporariamente indisponível.')
  }
  const session = await obterSessao()
  const caminho = `/api/v1/assignments/${encodeURIComponent(assignmentId)}/submissions`
  return chamarApi(rascunho ? `${caminho}/draft` : caminho, session, {
    method: rascunho ? 'PUT' : 'POST',
    body: JSON.stringify({ content })
  })
}

export async function testarCodigoAluno(assignmentId, content) {
  const session = await obterSessao()
  return chamarApi(`/api/v1/assignments/${encodeURIComponent(assignmentId)}/test-run`, session, {
    method: 'POST',
    body: JSON.stringify(content)
  })
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
