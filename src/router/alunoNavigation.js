import { inject } from 'vue'
import { routerKey } from 'vue-router'

const paths = {
  '/dashboardAluno.html': '/aluno/dashboard',
  '/salas.html': '/aluno/salas',
  '/sala.html': '/aluno/sala',
  '/tarefasAluno.html': '/aluno/tarefas',
  '/resultadosAluno.html': '/aluno/resultados',
  '/atividade.html': '/aluno/atividade'
}
export function converterLinkAluno(href) {
  const url = new URL(href, window.location.origin)
  if (url.origin !== window.location.origin || !paths[url.pathname]) return null
  return paths[url.pathname] + url.search + url.hash
}
export function useAlunoNavigation() {
  const router = inject(routerKey, null)
  return href => {
    const destino = router && converterLinkAluno(href)
    return destino ? router.push(destino) : window.location.assign(href)
  }
}
