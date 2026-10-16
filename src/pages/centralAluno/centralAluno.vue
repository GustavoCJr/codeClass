<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import SidebarLayout from 'primevue/sidebarlayout'
import SidebarMain from 'primevue/sidebarmain'
import SidebarAluno from '../../components/sidebarAluno.vue'
import { buscarCentralAluno, statusAluno } from './service'
import '../atividade/estilos.css'
import '../atividade/aluno.css'

const resultados = window.location.pathname === '/resultadosAluno.html'
const dados = ref({ salas: [], atividades: [], avisos: [] })
const carregando = ref(true)
const erro = ref('')
const busca = ref('')
const sala = ref('')
const status = ref('')
const agora = ref(Date.now())
const labels = { open: 'Pendente', draft: 'Rascunho', late: 'Atrasada', pending: 'Em processamento', awaiting_review: 'Aguardando revisão', published: 'Resultado publicado' }
let timer
const lista = computed(() => dados.value.atividades.filter(item =>
  (!resultados || item.submissao?.status === 'published') &&
  (!sala.value || item.sala.id === sala.value) &&
  (!status.value || statusAluno(item, item.submissao, agora.value) === status.value) &&
  `${item.title} ${item.sala.name}`.toLocaleLowerCase('pt-BR').includes(busca.value.toLocaleLowerCase('pt-BR'))
).sort((a, b) => resultados
  ? new Date(b.submissao.submitted_at) - new Date(a.submissao.submitted_at)
  : (a.deadline ? new Date(a.deadline).getTime() : Infinity) - (b.deadline ? new Date(b.deadline).getTime() : Infinity)))
function data(valor) { return valor ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor)) : 'Sem prazo' }
async function carregar() {
  carregando.value = true; erro.value = ''
  try { dados.value = await buscarCentralAluno() } catch (error) { erro.value = error.message }
  finally { carregando.value = false }
}
onMounted(() => { carregar(); timer = window.setInterval(() => { agora.value = Date.now() }, 30000) })
onUnmounted(() => window.clearInterval(timer))
</script>
<template>
  <SidebarLayout><SidebarAluno /><SidebarMain>
    <main class="assignment-page student-assignment">
      <header class="assignment-header"><div><h1>{{ resultados ? 'Meus resultados' : 'Minhas tarefas' }}</h1><p>{{ resultados ? 'Consulte as notas e os feedbacks publicados.' : 'Acompanhe todas as atividades das suas salas.' }}</p></div><button class="assignment-secondary-button" :disabled="carregando" @click="carregar">Atualizar</button></header>
      <p v-if="carregando" role="status">Carregando...</p>
      <p v-else-if="erro" role="alert" class="student-assignment-error">{{ erro }}</p>
      <template v-else>
        <p v-for="aviso in dados.avisos" :key="aviso" role="alert" class="student-assignment-notice">{{ aviso }}</p>
        <div class="student-filters">
          <label>Buscar<input v-model="busca" type="search" placeholder="Atividade ou sala"></label>
          <label>Sala<select v-model="sala"><option value="">Todas as salas</option><option v-for="item in dados.salas" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
          <label v-if="!resultados">Status<select v-model="status"><option value="">Todos</option><option v-for="(label, value) in labels" :key="value" :value="value">{{ label }}</option></select></label>
        </div>
        <p role="status">{{ lista.length }} {{ resultados ? 'resultados' : 'atividades' }}</p>
        <div class="assignment-question-list">
          <a v-for="item in lista" :key="item.id" :href="`/atividade.html?id=${encodeURIComponent(item.id)}`" class="student-task-card">
            <span>{{ item.sala.name }} · {{ item.type === 'code' ? 'Código' : 'Questionário' }}</span><h2>{{ item.title }}</h2>
            <p>{{ labels[statusAluno(item, item.submissao, agora)] }}</p><p>Prazo: {{ data(item.deadline) }}</p>
            <strong v-if="resultados">Nota: {{ item.submissao.grade ?? '—' }} · Ver feedback</strong>
          </a>
        </div>
        <p v-if="!lista.length" class="assignment-empty">{{ resultados ? 'Nenhum resultado publicado corresponde aos filtros.' : 'Nenhuma atividade corresponde aos filtros.' }}</p>
      </template>
    </main>
  </SidebarMain></SidebarLayout>
</template>
