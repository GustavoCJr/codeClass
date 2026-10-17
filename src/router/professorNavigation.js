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
    const path = converterLinkProfessor(href)
    if (path) {
      // Na SPA, troca somente a rota; na página legada, entra na SPA correta.
      if (router && window.location.pathname.endsWith('/professor.html')) {
        return router.push(path)
      }
      window.location.assign(`/professor.html#${path}`)
      return
    }
    window.location.assign(href)
  }
}
