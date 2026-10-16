import { createRouter, createWebHashHistory } from 'vue-router'
import DashboardAluno from '../pages/dashboardAluno/dashboardAluno.vue'
import SalasProfessor from '../pages/salasProfessor/salasProfessor.vue'
import Sala from '../pages/sala/sala.vue'
import CentralAluno from '../pages/centralAluno/centralAluno.vue'
import AtividadeAluno from '../pages/atividade/atividadeAluno.vue'

export const alunoRouter = createRouter({
  history: createWebHashHistory('/aluno.html'),
  routes: [
    { path: '/', redirect: '/aluno/dashboard' },
    { path: '/aluno/dashboard', component: DashboardAluno, props: { embedded: true } },
    { path: '/aluno/salas', component: SalasProfessor, props: { embedded: true } },
    { path: '/aluno/sala', component: Sala, props: { embedded: true } },
    { path: '/aluno/tarefas', component: CentralAluno, props: { embedded: true, mode: 'tarefas' } },
    { path: '/aluno/resultados', component: CentralAluno, props: { embedded: true, mode: 'resultados' } },
    { path: '/aluno/atividade', component: AtividadeAluno, props: { embedded: true } },
    { path: '/:pathMatch(.*)*', redirect: '/aluno/dashboard' }
  ]
})
