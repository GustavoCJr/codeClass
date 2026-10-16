<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import Dialog from 'primevue/dialog'
import DatePicker from 'primevue/datepicker'
import { EllipsisH, Eye, Calendar, FileEdit, Trash } from '@primeicons/vue'
import { api } from '../../config/api'
import AssignmentManagement from './AssignmentManagement.vue'
import ConfirmAction from '../ConfirmAction.vue'

const props = defineProps({ assignment: { type: Object, required: true } })
const emit = defineEmits(['view', 'updated', 'deleted'])
const menuAberto = ref(false)
const container = ref(null)
const management = ref(null)
const confirmDelete = ref(null)
const prazoVisible = ref(false)
const prazoInput = ref(null)
const erro = ref('')
const carregando = ref(false)
const salvando = ref(false)
const editAssignment = ref(null)
const hasSubmissions = ref(false)

const prazoAtual = computed(() => props.assignment.deadline ? new Date(props.assignment.deadline) : null)
const prazoAtualTexto = computed(() => prazoAtual.value && !Number.isNaN(prazoAtual.value.getTime())
  ? prazoAtual.value.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Sem prazo')

function clicarFora(event) {
  if (menuAberto.value && container.value && !container.value.contains(event.target)) menuAberto.value = false
}
function fecharEsc(event) { if (event.key === 'Escape') menuAberto.value = false }
function alternarMenu() {
  menuAberto.value = !menuAberto.value
  if (menuAberto.value) {
    document.addEventListener('pointerdown', clicarFora)
    document.addEventListener('keydown', fecharEsc)
  } else liberarEventos()
}
function liberarEventos() {
  document.removeEventListener('pointerdown', clicarFora)
  document.removeEventListener('keydown', fecharEsc)
}
function fecharMenu() { menuAberto.value = false; liberarEventos() }
onBeforeUnmount(liberarEventos)
function visualizar() { fecharMenu(); emit('view') }
function abrirPrazo() {
  fecharMenu()
  erro.value = ''
  // Inicialmente propõe uma data futura, sem alterar nada até a confirmação.
  const base = prazoAtual.value && prazoAtual.value.getTime() > Date.now()
    ? new Date(prazoAtual.value.getTime() + 86400000)
    : new Date(Date.now() + 86400000)
  prazoInput.value = base
  prazoVisible.value = true
}
async function salvarPrazo() {
  if (salvando.value) return
  const novo = prazoInput.value instanceof Date ? prazoInput.value : null
  const agora = Date.now()
  if (!novo || Number.isNaN(novo.getTime())) { erro.value = 'Informe uma data e horário válidos.'; return }
  if (novo.getTime() <= agora) { erro.value = 'O novo prazo deve estar no futuro.'; return }
  if (prazoAtual.value && novo.getTime() <= prazoAtual.value.getTime()) { erro.value = 'O novo prazo deve ser posterior ao atual.'; return }
  salvando.value = true; erro.value = ''
  try {
    const atualizado = await api(`/assignments/${encodeURIComponent(props.assignment.id)}`, {
      method: 'PATCH', body: JSON.stringify({ deadline: novo.toISOString() })
    })
    emit('updated', atualizado)
    prazoVisible.value = false
  } catch (e) { erro.value = e instanceof Error ? e.message : 'Não foi possível prorrogar o prazo.' }
  finally { salvando.value = false }
}
async function editar() {
  fecharMenu()
  if (carregando.value) return
  carregando.value = true; erro.value = ''
  try {
    const [detalhe, entregas] = await Promise.all([
      api(`/assignments/${encodeURIComponent(props.assignment.id)}`),
      api(`/assignments/${encodeURIComponent(props.assignment.id)}/submissions`)
    ])
    editAssignment.value = detalhe
    hasSubmissions.value = Array.isArray(entregas) && entregas.length > 0
    // O diálogo de edição permanece no componente compartilhado já utilizado no detalhe.
    await nextTick()
    management.value?.abrir()
  } catch (e) { erro.value = e instanceof Error ? e.message : 'Não foi possível abrir a edição.' }
  finally { carregando.value = false }
}
function excluir() { fecharMenu(); confirmDelete.value?.abrirConfirmacao() }
function atualizado(atividade) { editAssignment.value = atividade; emit('updated', atividade) }
</script>

<template>
  <div ref="container" class="cc-assignment-quick-actions" @click.stop>
    <button type="button" class="cc-assignment-menu-trigger" :aria-expanded="menuAberto"
      aria-haspopup="menu" :aria-label="`Ações da atividade ${assignment.title}`" title="Ações da atividade"
      @click.stop="alternarMenu">
      <EllipsisH :size="20" aria-hidden="true" />
    </button>
    <div v-if="menuAberto" class="cc-assignment-menu" role="menu" aria-label="Ações da atividade">
      <button type="button" role="menuitem" @click="visualizar"><Eye :size="17" /> Visualizar atividade</button>
      <button type="button" role="menuitem" @click="abrirPrazo"><Calendar :size="17" /> Prorrogar prazo</button>
      <button type="button" role="menuitem" :disabled="carregando" @click="editar"><FileEdit :size="17" /> Editar atividade</button>
      <button type="button" role="menuitem" class="cc-assignment-delete" @click="excluir"><Trash :size="17" /> Excluir atividade</button>
    </div>
  </div>

  <p v-if="erro && !prazoVisible" class="cc-assignment-action-error" role="alert">{{ erro }}</p>
  <AssignmentManagement v-if="editAssignment" ref="management" :assignment="editAssignment"
    :has-submissions="hasSubmissions" :show-actions="false" @updated="atualizado" />
  <ConfirmAction ref="confirmDelete" :show-trigger="false" :endpoint="`/assignments/${encodeURIComponent(assignment.id)}`"
    label="Excluir atividade" message="Excluir esta atividade definitivamente? O sistema impede a exclusão de atividades com submissões." @completed="emit('deleted')" />

  <Dialog v-model:visible="prazoVisible" modal header="Prorrogar prazo" :closable="!salvando"
    :close-on-escape="!salvando" :style="{ width: 'min(94vw, 470px)' }">
    <form class="cc-extend-deadline" @submit.prevent="salvarPrazo">
      <p class="cc-extend-deadline-title">{{ assignment.title }}</p>
      <p><strong>Prazo atual:</strong> {{ prazoAtualTexto }}</p>
      <label for="cc-new-deadline">Nova data e horário</label>
      <DatePicker id="cc-new-deadline" v-model="prazoInput" show-time hour-format="24"
        show-icon icon-display="input" date-format="dd/mm/yy" :manual-input="false"
        :min-date="new Date()" placeholder="Selecione a data e o horário"
        :disabled="salvando" fluid required />
      <small>Somente o prazo será alterado. Questões, testes, notas e entregas permanecem intactos.</small>
      <p v-if="erro" role="alert" class="cc-assignment-action-error">{{ erro }}</p>
      <div class="cc-extend-deadline-actions">
        <button type="button" :disabled="salvando" @click="prazoVisible = false">Cancelar</button>
        <button type="submit" :disabled="salvando">{{ salvando ? 'Salvando...' : 'Confirmar novo prazo' }}</button>
      </div>
    </form>
  </Dialog>
</template>

<style>
.cc-assignment-quick-actions { position: absolute; top: .8rem; right: .8rem; z-index: 3; }
.cc-assignment-menu-trigger { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 9px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text); cursor: pointer; }
.cc-assignment-menu-trigger:hover, .cc-assignment-menu-trigger:focus-visible { background: var(--color-surface-hover); outline-offset: 2px; }
.cc-assignment-menu { position: absolute; right: 0; top: calc(100% + 5px); z-index: 10; min-width: 210px; border: 1px solid var(--color-border); border-radius: 10px; padding: .35rem; background: var(--color-surface); box-shadow: var(--shadow-md); }
.cc-assignment-menu button { display: flex; width: 100%; align-items: center; gap: .65rem; padding: .7rem; border: 0; border-radius: 7px; background: transparent; color: var(--color-text); font: inherit; font-size: .85rem; text-align: left; cursor: pointer; }
.cc-assignment-menu button:hover, .cc-assignment-menu button:focus-visible { background: var(--color-surface-hover); }
.cc-assignment-menu button.cc-assignment-delete { color: var(--color-danger); border-top: 1px solid var(--color-border); border-radius: 0 0 7px 7px; }
.cc-assignment-action-error { color: var(--color-danger); font-size: .85rem; }
.cc-extend-deadline { display: grid; gap: .85rem; }
.cc-extend-deadline-title { font-weight: 700; margin: 0; }
.cc-extend-deadline label { font-weight: 600; }
.cc-extend-deadline small { color: var(--color-text-secondary); }
.cc-extend-deadline-actions { display: flex; justify-content: flex-end; gap: .6rem; margin-top: .5rem; }
.cc-extend-deadline-actions button { padding: .65rem .9rem; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text); cursor: pointer; }
.cc-extend-deadline-actions button[type="submit"] { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
@media (max-width: 640px) { .cc-assignment-menu { right: 0; } }
</style>
