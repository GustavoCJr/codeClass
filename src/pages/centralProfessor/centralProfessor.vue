<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import SidebarLayout from 'primevue/sidebarlayout'
import SidebarMain from 'primevue/sidebarmain'
import SidebarProfessor from '../../components/sidebarProfessor.vue'
import { buscarCentralProfessor } from './service'
import '../atividade/estilos.css'
import '../atividade/aluno.css'
const props = defineProps({
  embedded: { type: Boolean, default: false },
  mode: { type: String, default: '' }
})
const correcoes = computed(() => props.mode ? props.mode === 'correcoes' : window.location.pathname === '/correcoes.html')
const dados = ref({ salas: [], itens: [], avisos: [] })
const carregando = ref(true)
const erro = ref('')
const busca = ref('')
const sala = ref('')
const status = ref(correcoes.value ? 'awaiting_review' : '')
const labels = { pending: 'Em processamento', awaiting_review: 'Aguardando revisão', published: 'Publicado' }
const lista = computed(() => dados.value.itens.filter(item => {
  const salaId = correcoes.value ? item.assignment.classroom_id : item.classroom_id
  const texto = correcoes.value ? `${item.assignment.title} ${item.student.full_name} ${item.student.email}` : `${item.title} ${item.sala.name}`
  return (!sala.value || salaId === sala.value) && (!correcoes.value || !status.value || item.status === status.value) && texto.toLocaleLowerCase('pt-BR').includes(busca.value.toLocaleLowerCase('pt-BR'))
}).sort((a, b) => correcoes.value ? new Date(a.submitted_at) - new Date(b.submitted_at) : new Date(b.created_at) - new Date(a.created_at)))
function salaNome(item) { return dados.value.salas.find(s => s.id === item.assignment.classroom_id)?.name || 'Sala' }
async function carregar() {
  carregando.value = true; erro.value = ''
  try { dados.value = await buscarCentralProfessor(correcoes.value) } catch (error) { erro.value = error.message }
  finally { carregando.value = false }
}
onMounted(carregar)
watch(correcoes, () => {
  busca.value = ''
  sala.value = ''
  status.value = correcoes.value ? 'awaiting_review' : ''
  carregar()
})
</script>
<template>
  <component :is="embedded ? 'div' : SidebarLayout"><SidebarProfessor v-if="!embedded" /><component :is="embedded ? 'div' : SidebarMain"><main class="assignment-page">
    <header class="assignment-header"><div><h1>{{ correcoes ? 'Central de correções' : 'Minhas atividades' }}</h1><p>{{ correcoes ? 'Revise entregas e publique os resultados dos alunos.' : 'Consulte as atividades das suas salas.' }}</p></div><button type="button" class="assignment-secondary-button" :disabled="carregando" @click="carregar">Atualizar</button></header>
    <p v-if="carregando" role="status">Carregando...</p><p v-else-if="erro" role="alert" class="student-assignment-error">{{ erro }}</p>
    <template v-else>
      <p v-for="aviso in dados.avisos" :key="aviso" role="alert">{{ aviso }}</p>
      <div class="student-filters"><label>Buscar<input v-model="busca" type="search" :placeholder="correcoes ? 'Aluno, e-mail ou atividade' : 'Atividade ou sala'"></label><label>Sala<select v-model="sala"><option value="">Todas</option><option v-for="item in dados.salas" :key="item.id" :value="item.id">{{ item.name }}</option></select></label><label v-if="correcoes">Status<select v-model="status"><option value="">Todos</option><option v-for="(label, value) in labels" :key="value" :value="value">{{ label }}</option></select></label></div>
      <p role="status">{{ lista.length }} {{ correcoes ? 'entregas' : 'atividades' }}</p>
      <div class="assignment-question-list"><a v-for="item in lista" :key="item.id" class="student-task-card" :href="correcoes ? `/corrigirEntrega.html?id=${encodeURIComponent(item.id)}` : `/atividade.html?id=${encodeURIComponent(item.id)}`">
        <h2>{{ correcoes ? item.assignment.title : item.title }}</h2><p>{{ correcoes ? salaNome(item) : item.sala.name }}</p>
        <template v-if="correcoes"><p>{{ item.student.full_name }} · {{ labels[item.status] || item.status }}</p><p v-if="item.ai_insight_status === 'failed'">A análise de IA falhou. Você pode avaliar manualmente ou tentar novamente.</p></template>
      </a></div><p v-if="!lista.length" class="assignment-empty">Nenhum item corresponde aos filtros.</p>
    </template>
  </main></component></component>
</template>
