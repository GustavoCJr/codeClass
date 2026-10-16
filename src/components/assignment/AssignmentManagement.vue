<script setup>
import { useProfessorNavigation } from '../../router/professorNavigation'
const navegar = useProfessorNavigation()
import { computed, ref } from 'vue'
import Dialog from 'primevue/dialog'
import ConfirmAction from '../ConfirmAction.vue'
import QuestionnaireForm from './QuestionnaireForm.vue'
import CodeAssignmentForm from './CodeAssignmentForm.vue'
import { api } from '../../config/api'
import '../../pages/atividade/aluno.css'
const props = defineProps({ assignment: Object, hasSubmissions: Boolean, showActions: { type: Boolean, default: true } })
const emit = defineEmits(['updated'])
const visible = ref(false)
const busy = ref(false)
const error = ref('')
const titulo = ref('')
const descricao = ref('')
const prazo = ref('')
const politica = ref('on_review')
const config = ref({})
const podeImediata = computed(() => props.assignment.type === 'questionnaire' && !config.value.questions?.some(item => item.type === 'open'))
function abrir() {
  titulo.value = props.assignment.title; descricao.value = props.assignment.description
  const date = props.assignment.deadline ? new Date(props.assignment.deadline) : null
  prazo.value = date ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''
  politica.value = props.assignment.release_policy
  config.value = JSON.parse(JSON.stringify(props.assignment.config))
  error.value = ''; visible.value = true
}
async function salvar() {
  if (busy.value) return
  if (!titulo.value.trim()) { error.value = 'Informe o título.'; return }
  busy.value = true; error.value = ''
  try {
    const payload = { title: titulo.value.trim(), description: descricao.value, deadline: prazo.value ? new Date(prazo.value).toISOString() : null, release_policy: podeImediata.value ? politica.value : 'on_review' }
    // Preservar os IDs/conteúdo já usados por entregas existentes.
    if (!props.hasSubmissions) payload.config = config.value
    const atividade = await api(`/assignments/${encodeURIComponent(props.assignment.id)}`, { method: 'PATCH', body: JSON.stringify(payload) })
    emit('updated', atividade); visible.value = false
  } catch (err) { error.value = err.message }
  finally { busy.value = false }
}
defineExpose({ abrir })
function voltar() { navegar(`/sala.html?id=${encodeURIComponent(props.assignment.classroom_id)}&tab=atividades`) }
</script>
<template>
  <div v-if="showActions" class="cc-management-actions">
    <button type="button" class="assignment-secondary-button" @click="abrir">Editar atividade</button>
    <ConfirmAction :endpoint="`/assignments/${encodeURIComponent(assignment.id)}`" label="Excluir atividade" message="Excluir esta atividade definitivamente? Atividades com submissões não podem ser excluídas pelo sistema." @completed="voltar" />
  </div>
  <Dialog v-model:visible="visible" modal header="Editar atividade" :closable="!busy" :close-on-escape="!busy" :style="{ width: 'min(96vw, 950px)' }">
    <form class="student-edit-form" @submit.prevent="salvar">
      <fieldset :disabled="busy" class="student-question-fieldset student-edit-form">
        <label>Título<input v-model="titulo" required maxlength="255"></label>
        <label>Descrição<textarea v-model="descricao" rows="4"></textarea></label>
        <label>Prazo<input v-model="prazo" type="datetime-local"></label>
        <label>Liberação do resultado<select v-model="politica"><option value="on_review">Após revisão</option><option v-if="podeImediata" value="immediate">Imediata</option></select></label>
        <p v-if="hasSubmissions">Já existem submissões. Você pode editar título, descrição, prazo e liberação; o conteúdo das questões e testes é preservado.</p>
        <template v-else-if="visible">
          <QuestionnaireForm v-if="assignment.type === 'questionnaire'" v-model="config" :initial-config="assignment.config" />
          <CodeAssignmentForm v-else v-model="config" :initial-config="assignment.config" />
        </template>
      </fieldset>
      <p v-if="error" role="alert" class="student-assignment-error">{{ error }}</p>
      <div class="student-assignment-actions"><button type="button" :disabled="busy" class="assignment-secondary-button" @click="visible = false">Cancelar</button><button type="submit" :disabled="busy" class="student-submit-button">{{ busy ? 'Salvando...' : 'Salvar alterações' }}</button></div>
    </form>
  </Dialog>
</template>
