import { api } from '../../config/api'

let perfilDashboard = null

export function definirPerfilDashboard(perfil) {
  perfilDashboard = perfil
}

export async function buscarDashboardProfessor() {
  if (!perfilDashboard) throw new Error('Perfil do usuário não carregado.')

  // Duas consultas independentes: uma falha não oculta os dados da outra.
  const [salasResultado, correcoesResultado] = await Promise.allSettled([
    api('/classrooms/my-classes'),
    api('/submissions?status=awaiting_review')
  ])

  if (salasResultado.status === 'rejected' && correcoesResultado.status === 'rejected') {
    throw new Error('Não foi possível carregar salas e correções.')
  }

  const salasDisponiveis = salasResultado.status === 'fulfilled'
  const correcoesDisponiveis = correcoesResultado.status === 'fulfilled'
  const salas = salasDisponiveis ? salasResultado.value : []
  const submissoes = correcoesDisponiveis ? correcoesResultado.value : []
  const nomesSalas = new Map(salas.map(sala => [sala.id, sala.name]))

  const salasRecentes = [...salas]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 4)
    .map((sala, index) => ({
      id: sala.id,
      codigo: `SALA ${String(index + 1).padStart(2, '0')}`,
      nome: sala.name,
      descricao: sala.description || 'Sem descrição',
      href: `/sala.html?id=${encodeURIComponent(sala.id)}`
    }))

  const grupos = new Map()
  for (const submissao of submissoes) {
    const atividade = submissao.assignment
    if (!atividade?.id) continue
    if (!grupos.has(atividade.id)) {
      grupos.set(atividade.id, {
        id: atividade.id,
        atividade: atividade.title || 'Atividade',
        sala: nomesSalas.get(atividade.classroom_id) || 'Sala',
        quantidade: 0,
        href: '/correcoes.html'
      })
    }
    grupos.get(atividade.id).quantidade += 1
  }

  const correcoesPendentes = [...grupos.values()].sort((a, b) => b.quantidade - a.quantidade)
  const prioridade = correcoesPendentes[0]
  const focoPrincipal = prioridade
    ? {
        tipo: 'correcao',
        atividade: prioridade.atividade,
        sala: prioridade.sala,
        quantidade: prioridade.quantidade,
        descricao: 'atividade com maior fila de correção',
        href: '/correcoes.html'
      }
    : {
        tipo: 'sem-correcao',
        atividade: correcoesDisponiveis ? 'Nenhuma correção pendente' : 'Correções indisponíveis',
        sala: correcoesDisponiveis ? 'Tudo em dia' : 'Tente novamente mais tarde',
        quantidade: 0,
        descricao: correcoesDisponiveis ? 'não há entregas aguardando avaliação' : 'não foi possível consultar as entregas',
        href: '/tarefas.html'
      }

  return {
    professor: {
      id: perfilDashboard.id,
      nome: perfilDashboard.full_name || perfilDashboard.email
    },
    indicadores: {
      salasAtivas: salasDisponiveis ? salas.length : null,
      correcoesPendentes: correcoesDisponiveis ? submissoes.length : null
    },
    avisos: [
      ...(!salasDisponiveis ? ['Não foi possível carregar as salas.'] : []),
      ...(!correcoesDisponiveis ? ['Não foi possível carregar as correções.'] : [])
    ],
    focoPrincipal,
    salasRecentes,
    correcoesPendentes,
    links: {
      todasSalas: '/salas.html',
      todasTarefas: '/tarefas.html',
      criarTarefa: '/criarTarefa.html'
    }
  }
}
