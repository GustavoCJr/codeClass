import { api } from '../../config/api'

let perfilAtual = null

export function definirContextoDashboardAluno(perfil) {
  perfilAtual = perfil
}

function ordenarPorPrazo(a, b) {
  const prazoA = a.deadline ? Date.parse(a.deadline) : Infinity
  const prazoB = b.deadline ? Date.parse(b.deadline) : Infinity
  const valorA = Number.isFinite(prazoA) ? prazoA : Infinity
  const valorB = Number.isFinite(prazoB) ? prazoB : Infinity
  return valorA - valorB
}

export async function buscarDashboardAluno() {
  if (!perfilAtual) {
    throw new Error('Não foi possível identificar o aluno.')
  }

  // Três consultas independentes da quantidade de salas:
  // o backend calcula o status das tarefas e os indicadores.
  const [resumo, tarefas, salas] = await Promise.all([
    api('/assignments/my-assignments/summary'),
    api('/assignments/my-assignments'),
    api('/classrooms/my-classes')
  ])

  if (!Array.isArray(tarefas) || !Array.isArray(salas)) {
    throw new Error('Resposta inesperada ao carregar o dashboard.')
  }

  const atividades = tarefas.map(tarefa => ({
    ...tarefa,
    salaId: tarefa.classroom_id,
    salaNome: tarefa.classroom_name,
    // Mantém o formato anterior utilizado pelos cards do dashboard.
    salaDescricao: '',
    submissao: tarefa.submission ?? null,
    entregue: ['submitted', 'graded'].includes(tarefa.student_status),
    atrasada: tarefa.student_status === 'overdue',
    pendente: tarefa.student_status === 'pending'
  }))

  return {
    aluno: {
      id: perfilAtual.id,
      nome: perfilAtual.full_name || perfilAtual.email,
      email: perfilAtual.email,
      instituicao: perfilAtual.organization_name
    },
    indicadores: {
      salas: salas.length,
      pendentes: resumo.pending,
      atrasadas: resumo.overdue,
      // 'graded' também representa uma tarefa formalmente entregue.
      entregues: resumo.submitted + resumo.graded
    },
    atrasadas: atividades.filter(atividade => atividade.atrasada).sort(ordenarPorPrazo).slice(0, 5),
    proximas: atividades.filter(atividade => atividade.pendente).sort(ordenarPorPrazo).slice(0, 6),
    salas: salas.slice(0, 6)
  }
}
