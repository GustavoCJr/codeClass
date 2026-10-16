import { supabase } from '../../config/supabase'

const apiUrl = import.meta.env.VITE_API_URL

let perfilAtual = null

const STATUS_ENTREGUES = new Set([
  'pending',
  'awaiting_review',
  'published'
])

export function definirContextoDashboardAluno(
  perfil
) {
  perfilAtual = perfil
}

async function obterSessao() {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession()

  if (error || !session) {
    throw new Error(
      'Usuário não autenticado.'
    )
  }

  return session
}

async function chamarApi(
  caminho,
  session,
  mensagemPadrao
) {
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

    if (typeof detalhe?.detail === 'string') {
      throw new Error(detalhe.detail)
    }

    throw new Error(mensagemPadrao)
  }

  return response.json()
}

function dataValida(valor) {
  if (!valor) {
    return null
  }

  const data = new Date(valor)

  if (
    Number.isNaN(data.getTime())
  ) {
    return null
  }

  return data
}

function ordenarPorPrazo(a, b) {
  const dataA = dataValida(a.deadline)
  const dataB = dataValida(b.deadline)

  if (!dataA && !dataB) return 0
  if (!dataA) return 1
  if (!dataB) return -1

  return dataA - dataB
}

function ordenarAtrasadas(a, b) {
  const dataA = dataValida(a.deadline)
  const dataB = dataValida(b.deadline)

  if (!dataA && !dataB) return 0
  if (!dataA) return 1
  if (!dataB) return -1

  return dataA - dataB
}

function montarMapaSubmissoes(
  submissoes
) {
  const mapa = new Map()

  for (const submissao of submissoes) {
    const assignmentId =
      submissao?.assignment?.id

    if (
      assignmentId &&
      !mapa.has(assignmentId)
    ) {
      mapa.set(
        assignmentId,
        submissao
      )
    }
  }

  return mapa
}

function atividadeEntregue(submissao) {
  return STATUS_ENTREGUES.has(
    submissao?.status
  )
}

function enriquecerAtividade(
  atividade,
  sala,
  submissao,
  agora
) {
  const deadline =
    dataValida(atividade.deadline)

  const entregue =
    atividadeEntregue(submissao)

  const atrasada = Boolean(
    !entregue &&
    deadline &&
    deadline < agora
  )

  const pendente = Boolean(
    !entregue &&
    !atrasada
  )

  return {
    ...atividade,
    salaId: sala.id,
    salaNome: sala.name,
    salaDescricao:
      sala.description || '',
    submissao: submissao || null,
    entregue,
    atrasada,
    pendente
  }
}

export async function buscarDashboardAluno() {
  if (!perfilAtual) {
    throw new Error(
      'Não foi possível identificar o aluno.'
    )
  }

  const session =
    await obterSessao()

  const [
    salas,
    submissoes
  ] = await Promise.all([
    chamarApi(
      '/api/v1/classrooms/my-classes',
      session,
      'Não foi possível carregar suas salas.'
    ),

    chamarApi(
      '/api/v1/submissions',
      session,
      'Não foi possível carregar suas entregas.'
    )
  ])

  const atividadesPorSala =
    await Promise.all(
      salas.map(async (sala) => {
        const atividades =
          await chamarApi(
            `/api/v1/classrooms/${encodeURIComponent(
              sala.id
            )}/assignments`,
            session,
            `Não foi possível carregar as atividades de ${sala.name}.`
          )

        return {
          sala,
          atividades
        }
      })
    )

  const mapaSubmissoes =
    montarMapaSubmissoes(
      submissoes
    )

  const agora = new Date()

  const atividades =
    atividadesPorSala.flatMap(
      ({ sala, atividades }) =>
        atividades.map(
          (atividade) =>
            enriquecerAtividade(
              atividade,
              sala,
              mapaSubmissoes.get(
                atividade.id
              ),
              agora
            )
        )
    )

  const atrasadas =
    atividades
      .filter(
        (atividade) =>
          atividade.atrasada
      )
      .sort(ordenarAtrasadas)

  const proximas =
    atividades
      .filter(
        (atividade) =>
          atividade.pendente
      )
      .sort(ordenarPorPrazo)

  const entregues =
    atividades.filter(
      (atividade) =>
        atividade.entregue
    )

  return {
    aluno: {
      id: perfilAtual.id,
      nome:
        perfilAtual.full_name ||
        perfilAtual.email,
      email: perfilAtual.email,
      instituicao:
        perfilAtual.organization_name
    },

    indicadores: {
      salas: salas.length,
      pendentes: proximas.length,
      atrasadas: atrasadas.length,
      entregues: entregues.length
    },

    atrasadas:
      atrasadas.slice(0, 5),

    proximas:
      proximas.slice(0, 6),

    salas:
      salas.slice(0, 6)
  }
}
