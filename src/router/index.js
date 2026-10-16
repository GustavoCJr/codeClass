import { createRouter, createWebHashHistory } from 'vue-router'
import DashboardProfessor from '../pages/dashboardProfessor/dashboardProfessor.vue'
import SalasProfessor from '../pages/salasProfessor/salasProfessor.vue'
import CentralProfessor from '../pages/centralProfessor/centralProfessor.vue'
import Sala from '../pages/sala/sala.vue'
import Atividade from '../pages/atividade/atividade.vue'
import CriarTarefa from '../pages/criarTarefa/criarTarefa.vue'
import CorrigirEntrega from '../pages/corrigirEntrega/corrigirEntrega.vue'
import Alunos from '../pages/alunos/alunos.vue'
import { obterPerfilDaPagina } from '../config/auth'

export const router = createRouter({
  history: createWebHashHistory('/professor.html'),
  routes: [
    { path: '/', redirect: '/professor/dashboard' },
    { path: '/professor/dashboard', component: DashboardProfessor, props: { embedded: true } },
    { path: '/professor/salas', component: SalasProfessor, props: { embedded: true } },
    { path: '/professor/tarefas', component: CentralProfessor, props: { embedded: true, mode: 'tarefas' } },
    { path: '/professor/correcoes', component: CentralProfessor, props: { embedded: true, mode: 'correcoes' } },
    { path: '/professor/sala', component: Sala, props: { embedded: true } },
    { path: '/professor/atividade', component: Atividade, props: { embedded: true } },
    { path: '/professor/criar-tarefa', component: CriarTarefa, props: { embedded: true } },
    { path: '/professor/corrigir-entrega', component: CorrigirEntrega, props: { embedded: true } },
    { path: '/professor/alunos', component: Alunos, props: { embedded: true }, beforeEnter: () => ['owner', 'admin'].includes(obterPerfilDaPagina()?.role) || '/professor/dashboard' },
    { path: '/:pathMatch(.*)*', redirect: '/professor/dashboard' }
  ]
})
