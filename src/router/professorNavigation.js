import { inject } from 'vue'
import { routerKey } from 'vue-router'

const paths = {
  '/dashboardProfessor.html': '/professor/dashboard',
  '/salas.html': '/professor/salas',
  '/sala.html': '/professor/sala',
  '/tarefas.html': '/professor/tarefas',
  '/correcoes.html': '/professor/correcoes',
  '/atividade.html': '/professor/atividade',
  '/criarTarefa.html': '/professor/criar-tarefa',
  '/corrigirEntrega.html': '/professor/corrigir-entrega',
  '/alunos.html': '/professor/alunos'
}
export function converterLinkProfessor(href) {
  const url = new URL(href, window.location.origin)
  if (url.origin !== window.location.origin || !paths[url.pathname]) return null
  return paths[url.pathname] + url.search + url.hash
}
export function useProfessorNavigation() {
  const router = inject(routerKey, null)
  return (href) => {
    const path = router && converterLinkProfessor(href)
    if (path) return router.push(path)
    window.location.assign(href)
  }
}
