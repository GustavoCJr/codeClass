import { supabase } from '../../config/supabase'

const apiUrl = import.meta.env.VITE_API_URL

let perfilDashboard = null

export function definirPerfilDashboard(perfil) {
  perfilDashboard = perfil
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

function formatarTempoRelativo(dataIso) {
  const agora = new Date()
  const data = new Date(dataIso)

  const diferencaMs = Math.max(0, agora - data)
  const minutos = Math.floor(diferencaMs / 60000)

  if (minutos < 1) {
    return 'agora'
  }

  if (minutos < 60) {
    return `há ${minutos} min`
  }

  const horas = Math.floor(minutos / 60)

  if (horas < 24) {
    return `há ${horas} h`
  }

  const dias = Math.floor(horas / 24)

  return `há ${dias} d`
}

function atividadeEstaPendente(atividade) {
  if (!atividade.deadline) {
    return true
  }

  return new Date(atividade.deadline) >= new Date()
}

export async function buscarDashboardProfessor() {
  const session = await obterSessao()

  if (!perfilDashboard) {
    throw new Error('Perfil do usuário não carregado.')
  }

  const token = session.access_token

  // =========================
  // SALAS
  // =========================

  const responseSalas = await fetch(
    `${apiUrl}/api/v1/classrooms/my-classes`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  if (!responseSalas.ok) {
    throw new Error('Não foi possível carregar as salas.')
  }

  const salas = await responseSalas.json()

  /*
   * Para cada sala, buscamos:
   * - detalhes da sala;
   * - atividades da sala.
   *
   * As duas requisições são feitas juntas.
   */
  const salasComDados = await Promise.all(
    salas.map(async (sala, index) => {
      const [
        responseDetalhes,
        responseAtividades
      ] = await Promise.all([
        fetch(
          `${apiUrl}/api/v1/classrooms/${sala.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        ),

        fetch(
          `${apiUrl}/api/v1/classrooms/${sala.id}/assignments`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
      ])

      if (!responseDetalhes.ok) {
        throw new Error(
          `Não foi possível carregar os detalhes da sala ${sala.name}.`
        )
      }

      if (!responseAtividades.ok) {
        throw new Error(
          `Não foi possível carregar as atividades da sala ${sala.name}.`
        )
      }

      const detalhes = await responseDetalhes.json()
      const atividades = await responseAtividades.json()

      const atividadesPendentes = atividades.filter(
        atividadeEstaPendente
      ).length

      return {
        id: sala.id,
        codigo: `SALA ${String(index + 1).padStart(2, '0')}`,
        nome: sala.name,
        descricao: sala.description || 'Sem descrição',
        alunos: detalhes.total_students ?? 0,
        atividadesPendentes,
        href: `/sala.html?id=${encodeURIComponent(sala.id)}`,

        // Guardamos para reutilizar nos prazos
        atividades
      }
    })
  )

  // Dashboard mostra no máximo 4 salas
  const salasRecentes = salasComDados
    .slice(0, 4)
    .map((sala) => ({
      id: sala.id,
      codigo: sala.codigo,
      nome: sala.nome,
      descricao: sala.descricao,
      alunos: sala.alunos,
      atividadesPendentes: sala.atividadesPendentes,
      href: sala.href
    }))

  // Soma os alunos de todas as salas
  const totalAlunos = salasComDados.reduce(
    (total, sala) => total + sala.alunos,
    0
  )

  // =========================
  // SUBMISSÕES
  // =========================

  const [
    responseCorrecoes,
    responseSubmissoes
  ] = await Promise.all([
    fetch(
      `${apiUrl}/api/v1/submissions?status=awaiting_review`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ),

    fetch(
      `${apiUrl}/api/v1/submissions`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
  ])

  if (!responseCorrecoes.ok) {
    throw new Error(
      'Não foi possível carregar as correções pendentes.'
    )
  }

  if (!responseSubmissoes.ok) {
    throw new Error(
      'Não foi possível carregar as entregas.'
    )
  }

  const submissoesAguardandoRevisao =
    await responseCorrecoes.json()

  const submissoes =
    await responseSubmissoes.json()

  const entregas = submissoes
    .filter(
      (submissao) =>
        submissao.status !== 'draft' &&
        submissao.submitted_at
    )
    .sort(
      (a, b) =>
        new Date(b.submitted_at) -
        new Date(a.submitted_at)
    )

  // =========================
  // ENTREGAS HOJE
  // =========================

  const hoje = new Date()

  const entregasHoje = entregas.filter(
    (submissao) => {
      const dataEntrega =
        new Date(submissao.submitted_at)

      return (
        dataEntrega.getFullYear() ===
          hoje.getFullYear() &&
        dataEntrega.getMonth() ===
          hoje.getMonth() &&
        dataEntrega.getDate() ===
          hoje.getDate()
      )
    }
  ).length

  // =========================
  // ENTREGAS RECENTES
  // =========================

  const entregasRecentes = entregas
    .slice(0, 4)
    .map((submissao) => {
      const sala = salas.find(
        (item) =>
          item.id ===
          submissao.assignment.classroom_id
      )

      return {
        id: submissao.id,
        aluno:
          submissao.student?.full_name ||
          submissao.student?.email ||
          'Aluno',
        atividade:
          submissao.assignment.title,
        sala: sala?.name || 'Sala',
        enviadoEm: submissao.submitted_at,
        tempo: formatarTempoRelativo(
          submissao.submitted_at
        )
      }
    })

  // =========================
  // CORREÇÕES PENDENTES
  // =========================

  const correcoesPendentes = Object.values(
    submissoesAguardandoRevisao.reduce(
      (grupos, submissao) => {
        const atividade = submissao.assignment

        const sala = salas.find(
          (item) =>
            item.id === atividade.classroom_id
        )

        if (!grupos[atividade.id]) {
          grupos[atividade.id] = {
            id: atividade.id,
            atividade: atividade.title,
            sala: sala?.name || 'Sala',
            quantidade: 0,
            href: '/corrigirEntrega.html'
          }
        }

        grupos[atividade.id].quantidade += 1

        return grupos
      },
      {}
    )
  )

  // =========================
  // FOCO PRINCIPAL
  // =========================

  const correcaoPrioritaria =
    correcoesPendentes.reduce(
      (prioridade, correcao) => {
        if (
          !prioridade ||
          correcao.quantidade >
            prioridade.quantidade
        ) {
          return correcao
        }

        return prioridade
      },
      null
    )

  const focoPrincipal = correcaoPrioritaria
    ? {
        tipo: 'correcao',
        atividade:
          correcaoPrioritaria.atividade,
        sala:
          correcaoPrioritaria.sala,
        quantidade:
          correcaoPrioritaria.quantidade,
        descricao:
          'atividade com maior fila de correção',
        href:
          correcaoPrioritaria.href
      }
    : {
        tipo: 'sem-correcao',
        atividade:
          'Nenhuma correção pendente',
        sala: 'Tudo em dia',
        quantidade: 0,
        descricao:
          'não há entregas aguardando avaliação',
        href: '/tarefas.html'
      }

  // =========================
  // PRÓXIMOS PRAZOS
  // =========================

  const atividades = salasComDados.flatMap(
    (sala) =>
      sala.atividades.map((atividade) => ({
        ...atividade,
        nomeSala: sala.nome
      }))
  )

  const agora = new Date()

  const proximosPrazos = atividades
    .filter((atividade) => {
      if (!atividade.deadline) {
        return false
      }

      return (
        new Date(atividade.deadline) >= agora
      )
    })
    .sort(
      (a, b) =>
        new Date(a.deadline) -
        new Date(b.deadline)
    )
    .slice(0, 3)
    .map((atividade) => {
      const dataPrazo =
        new Date(atividade.deadline)

      const inicioHoje = new Date(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate()
      )

      const inicioPrazo = new Date(
        dataPrazo.getFullYear(),
        dataPrazo.getMonth(),
        dataPrazo.getDate()
      )

      const diferencaDias = Math.round(
        (inicioPrazo - inicioHoje) /
          86400000
      )

      let status =
        `Em ${diferencaDias} dias`

      if (diferencaDias === 0) {
        status = 'Hoje'
      }

      if (diferencaDias === 1) {
        status = 'Amanhã'
      }

      const dataCurta = dataPrazo
        .toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short'
        })
        .replace('.', '')
        .toUpperCase()

      const hora =
        dataPrazo.toLocaleTimeString(
          'pt-BR',
          {
            hour: '2-digit',
            minute: '2-digit'
          }
        )

      return {
        id: atividade.id,
        atividade: atividade.title,
        sala: atividade.nomeSala,
        prazo: atividade.deadline,
        dataCurta,
        hora,
        status,
        urgente: diferencaDias <= 1
      }
    })

  // =========================
  // RETORNO
  // =========================

  return {
    professor: {
      id: perfilDashboard.id,
      nome:
        perfilDashboard.full_name ||
        perfilDashboard.email
    },

    indicadores: {
      salasAtivas: salas.length,
      totalAlunos,
      correcoesPendentes:
        submissoesAguardandoRevisao.length,
      entregasHoje
    },

    focoPrincipal,

    salasRecentes,

    correcoesPendentes,

    entregasRecentes,

    proximosPrazos,

    links: {
      todasSalas: '/salas.html',
      todasTarefas: '/tarefas.html',
      criarTarefa: '/criarTarefa.html'
    }
  }
}