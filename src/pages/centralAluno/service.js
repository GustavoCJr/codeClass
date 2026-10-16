import { api } from '../../config/api'

// A situação é calculada pelo backend. Rascunho é uma indicação adicional,
// não um status de entrega formal.
export function statusAluno(atividade) {
  return atividade.student_status || 'pending'
}

export async function buscarCentralAluno() {
  const tarefas = await api('/assignments/my-assignments')
  if (!Array.isArray(tarefas)) {
    throw new Error('Resposta inesperada ao carregar suas atividades.')
  }

  const salasMap = new Map()
  const atividades = tarefas.map(tarefa => {
    const sala = { id: tarefa.classroom_id, name: tarefa.classroom_name }
    if (!salasMap.has(sala.id)) salasMap.set(sala.id, sala)
    return {
      ...tarefa,
      sala,
      // O retorno novo utiliza `submission` no singular.
      submissao: tarefa.submission ?? null
    }
  })

  return { salas: [...salasMap.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')), atividades, avisos: [] }
}
