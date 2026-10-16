<script setup>
import { computed, onMounted, ref } from 'vue'
import SidebarLayout from 'primevue/sidebarlayout'
import SidebarMain from 'primevue/sidebarmain'
import SidebarAluno from '../../components/sidebarAluno.vue'
import { buscarCentralAluno, statusAluno } from './service'
import { useAlunoNavigation } from '../../router/alunoNavigation'
import { agruparTarefas } from './agrupamentoTarefas'
import { ExclamationTriangle, CalendarClock, Calendar, CheckCircle, Clock, Code, File, ArrowRight, Refresh, Inbox } from '@primeicons/vue'
import '../atividade/estilos.css'
import '../atividade/aluno.css'
import './tarefasPrioridades.css'

const props = defineProps({ embedded: { type: Boolean, default: false }, mode: { type: String, default: '' } })
const navegar = useAlunoNavigation()
const resultados = computed(() => props.mode ? props.mode === 'resultados' : window.location.pathname === '/resultadosAluno.html')
const dados = ref({ salas: [], atividades: [], avisos: [] })
const carregando = ref(true)
const erro = ref('')
const busca = ref('')
const sala = ref('')
const status = ref('')
const agora = ref(Date.now())
const grupos = computed(() => agruparTarefas(lista.value, agora.value))
const iconesGrupo = { atrasadas: ExclamationTriangle, semana: CalendarClock, futuras: Calendar, semPrazo: Clock, entregues: CheckCircle }
const labels = {
  pending: 'Pendente',
  overdue: 'Atrasada',
  submitted: 'Entregue',
  graded: 'Corrigida'
}
const lista = computed(() => dados.value.atividades.filter(item =>
  (!resultados.value || item.student_status === 'graded') &&
  (!sala.value || item.classroom_id === sala.value) &&
  (!status.value || statusAluno(item) === status.value) &&
  `${item.title} ${item.classroom_name}`.toLocaleLowerCase('pt-BR').includes(busca.value.toLocaleLowerCase('pt-BR'))
).sort((a, b) => resultados.value
  ? (Date.parse(b.submissao?.submitted_at) || 0) - (Date.parse(a.submissao?.submitted_at) || 0)
  : (a.deadline ? Date.parse(a.deadline) || Infinity : Infinity) - (b.deadline ? Date.parse(b.deadline) || Infinity : Infinity)))

function data(valor) {
  if (!valor) return 'Sem prazo'
  const parsed = new Date(valor)
  return Number.isNaN(parsed.getTime()) ? 'Prazo indisponível' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(parsed)
}
function abrirAtividade(item) {
  navegar(`/atividade.html?id=${encodeURIComponent(item.id)}`)
}
async function carregar() {
  carregando.value = true
  erro.value = ''
  try { dados.value = await buscarCentralAluno(); agora.value = Date.now() }
  catch (error) { erro.value = error.message }
  finally { carregando.value = false }
}
onMounted(carregar)
</script>

<template>
  <component :is="embedded ? 'div' : SidebarLayout"><SidebarAluno v-if="!embedded" /><component :is="embedded ? 'div' : SidebarMain">
    <main class="assignment-page student-assignment">
      <header class="assignment-header">
        <div><h1>{{ resultados ? 'Meus resultados' : 'Minhas tarefas' }}</h1><p>{{ resultados ? 'Consulte as notas e os feedbacks publicados.' : 'Acompanhe todas as atividades das suas salas.' }}</p></div>
        <button class="assignment-secondary-button" :disabled="carregando" @click="carregar">Atualizar</button>
      </header>
      <p v-if="carregando" role="status">Carregando...</p>
      <p v-else-if="erro" role="alert" class="student-assignment-error">{{ erro }}</p>
      <template v-else>
        <div class="student-filters">
          <label>Buscar<input v-model="busca" type="search" placeholder="Atividade ou sala"></label>
          <label>Sala<select v-model="sala"><option value="">Todas as salas</option><option v-for="item in dados.salas" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
          <label v-if="!resultados">Status<select v-model="status"><option value="">Todos</option><option v-for="(label, value) in labels" :key="value" :value="value">{{ label }}</option></select></label>
        </div>
        <p role="status" class="student-task-count">{{ lista.length }} {{ resultados ? 'resultados publicados' : 'tarefas encontradas' }}</p>
        <!-- Resultados mantém sua apresentação anterior; somente Tarefas recebe grupos. -->
        <template v-if="resultados">
          <div class="assignment-question-list">
            <a v-for="item in lista" :key="item.id" :href="`/atividade.html?id=${encodeURIComponent(item.id)}`" class="student-task-card" @click.prevent="abrirAtividade(item)">
              <span>{{ item.classroom_name }} · {{ item.type === 'code' ? 'Código' : 'Questionário' }}</span>
              <h2>{{ item.title }}</h2>
              <p>{{ labels[statusAluno(item)] }}</p>
              <p>Prazo: {{ data(item.deadline) }}</p>
              <strong>Nota: {{ item.submissao?.grade ?? '—' }} · Ver feedback</strong>
            </a>
          </div>
          <p v-if="!lista.length" class="assignment-empty">Nenhum resultado publicado corresponde aos filtros.</p>
        </template>
        <template v-else>
          <div class="student-priority-overview" aria-label="Resumo das tarefas por prioridade">
            <div v-for="grupo in grupos" :key="grupo.id" class="student-priority-counter" :class="`student-priority--${grupo.id}`">
              <component :is="iconesGrupo[grupo.id]" aria-hidden="true" />
              <strong>{{ grupo.items.length }}</strong>
              <span>{{ grupo.titulo }}</span>
            </div>
          </div>
          <div class="student-priority-groups">
            <details v-for="grupo in grupos" :key="grupo.id" class="student-priority-group" :class="`student-priority--${grupo.id}`" :open="grupo.id !== 'entregues' || undefined">
              <summary class="student-priority-heading">
                <span class="student-priority-heading-icon"><component :is="iconesGrupo[grupo.id]" aria-hidden="true" /></span>
                <span class="student-priority-title"><strong>{{ grupo.titulo }}</strong><small>{{ grupo.subtitulo }}</small></span>
                <span class="student-priority-total">{{ grupo.items.length }}</span>
                <span class="student-priority-chevron" aria-hidden="true">⌄</span>
              </summary>
              <div class="student-priority-content">
                <div v-if="grupo.items.length" class="student-priority-items">
                  <a v-for="item in grupo.items" :key="item.id" :href="`/atividade.html?id=${encodeURIComponent(item.id)}`" class="student-task-card student-priority-card" @click.prevent="abrirAtividade(item)">
                    <span class="student-priority-kind"><component :is="item.type === 'code' ? Code : File" aria-hidden="true" /> {{ item.type === 'code' ? 'Código' : 'Questionário' }} · {{ item.classroom_name }}</span>
                    <span class="student-priority-card-title">{{ item.title }}</span>
                    <span class="student-priority-meta"><component :is="grupo.id === 'entregues' ? CheckCircle : Calendar" aria-hidden="true" /> {{ grupo.id === 'entregues' ? (item.student_status === 'graded' ? 'Corrigida' : 'Entregue') : `Prazo: ${data(item.deadline)}` }}<span v-if="item.has_draft && item.student_status === 'pending'" class="student-priority-draft">Rascunho salvo</span></span>
                    <span class="student-priority-link">{{ grupo.id === 'entregues' ? 'Ver entrega' : item.has_draft ? 'Continuar' : 'Abrir atividade' }} <ArrowRight aria-hidden="true" /></span>
                  </a>
                </div>
                <div v-else class="student-priority-empty"><CheckCircle v-if="grupo.id === 'atrasadas'" aria-hidden="true" /><Inbox v-else aria-hidden="true" />{{ grupo.vazio }}</div>
              </div>
            </details>
          </div>
        </template>
      </template>
    </main>
  </component></component>
</template>
