<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import ClassroomDialog from '../ClassroomDialog.vue'
import ActivityDialog from './ActivityDialog.vue'
import AddStudentDialog from './AddStudentDialog.vue'
import { api } from '../../config/api'
import { buscarAlunosOrganizacao, matricularAluno } from '../../pages/sala/service'
import { useProfessorNavigation } from '../../router/professorNavigation'
import { EllipsisH, UserPlus, Users, FileEdit, ListCheck, Pencil, Trash } from '@primeicons/vue'

const props = defineProps({ classroom: { type: Object, required: true } })
const emit = defineEmits(['updated', 'deleted', 'notice'])
const navegar = useProfessorNavigation()
const menuOpen = ref(false)
const menuRoot = ref(null)
const editVisible = ref(false)
const editBusy = ref(false)
const editError = ref('')
const deleteVisible = ref(false)
const deleteBusy = ref(false)
const deleteError = ref('')
const activityVisible = ref(false)
const enrollVisible = ref(false)
const candidates = ref([])
const enrolledIds = ref(new Set())
const membersLoaded = ref(false)
const search = ref('')
const searching = ref(false)
const candidateError = ref('')
const addingId = ref(null)
let searchTimer = null
let searchSequence = 0

function closeMenu() { menuOpen.value = false }
function onGlobalPointerDown(event) {
  if (menuOpen.value && !menuRoot.value?.contains(event.target)) closeMenu()
}
function onGlobalKeydown(event) { if (event.key === 'Escape') closeMenu() }
watch(menuOpen, (open) => {
  if (typeof document === 'undefined') return
  if (open) {
    document.addEventListener('pointerdown', onGlobalPointerDown)
    document.addEventListener('keydown', onGlobalKeydown)
  } else {
    document.removeEventListener('pointerdown', onGlobalPointerDown)
    document.removeEventListener('keydown', onGlobalKeydown)
  }
})
onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('pointerdown', onGlobalPointerDown)
    document.removeEventListener('keydown', onGlobalKeydown)
  }
  clearTimeout(searchTimer)
  searchSequence++
})
function go(tab) {
  closeMenu()
  navegar(`/sala.html?id=${encodeURIComponent(props.classroom.id)}&tab=${tab}`)
}
function openEdit() { closeMenu(); editError.value = ''; editVisible.value = true }
async function saveEdit(payload) {
  if (editBusy.value) return
  editBusy.value = true; editError.value = ''
  try {
    const updated = await api(`/classrooms/${encodeURIComponent(props.classroom.id)}`, {
      method: 'PATCH', body: JSON.stringify({ name: payload.nome, description: payload.descricao || null })
    })
    emit('updated', updated)
    editVisible.value = false
    emit('notice', 'Sala atualizada com sucesso.')
  } catch (error) { editError.value = error.message }
  finally { editBusy.value = false }
}
function openDelete() { closeMenu(); deleteError.value = ''; deleteVisible.value = true }
async function deleteClassroom() {
  if (deleteBusy.value) return
  deleteBusy.value = true; deleteError.value = ''
  try {
    await api(`/classrooms/${encodeURIComponent(props.classroom.id)}`, { method: 'DELETE' })
    deleteVisible.value = false
    emit('deleted', props.classroom.id)
    emit('notice', 'Sala excluída com sucesso.')
  } catch (error) { deleteError.value = error.message }
  finally { deleteBusy.value = false }
}
function openActivity() { closeMenu(); activityVisible.value = true }
function continueActivity(data) {
  sessionStorage.setItem('codeclass:nova-tarefa', JSON.stringify({ ...data, classroomId: props.classroom.id }))
  activityVisible.value = false
  navegar('/criarTarefa.html')
}
const studentsAvailable = computed(() => candidates.value.filter(candidate => !enrolledIds.value.has(candidate.user_id)))
async function fetchCandidates(term = search.value) {
  if (!enrollVisible.value || !membersLoaded.value) return
  const current = ++searchSequence
  searching.value = true; candidateError.value = ''
  try {
    const result = await buscarAlunosOrganizacao(term)
    if (current === searchSequence) candidates.value = Array.isArray(result) ? result : []
  } catch (error) { if (current === searchSequence) candidateError.value = error.message }
  finally { if (current === searchSequence) searching.value = false }
}
watch(search, (term) => {
  if (!enrollVisible.value || !membersLoaded.value) return
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchCandidates(term), 320)
})
watch(enrollVisible, (visible) => {
  if (visible) return
  ++searchSequence
  clearTimeout(searchTimer)
  membersLoaded.value = false
  candidates.value = []
})
async function openEnrollment() {
  closeMenu()
  search.value = ''
  candidates.value = []
  candidateError.value = ''
  enrolledIds.value = new Set()
  membersLoaded.value = false
  enrollVisible.value = true
  searching.value = true
  const current = ++searchSequence
  try {
    const members = await api(`/classrooms/${encodeURIComponent(props.classroom.id)}/members`)
    if (current !== searchSequence || !enrollVisible.value) return
    enrolledIds.value = new Set((members?.students || []).map(item => item.student_id))
    membersLoaded.value = true
    await fetchCandidates('')
  } catch (error) {
    if (current === searchSequence) candidateError.value = error.message
  } finally { if (current === searchSequence && !membersLoaded.value) searching.value = false }
}
async function addStudent(student) {
  if (!student?.user_id || addingId.value) return
  addingId.value = student.user_id
  candidateError.value = ''
  try {
    await matricularAluno(props.classroom.id, student.user_id)
    enrolledIds.value = new Set([...enrolledIds.value, student.user_id])
    enrollVisible.value = false
    emit('notice', `${student.full_name} matriculado(a) com sucesso.`)
  } catch (error) { candidateError.value = error.message }
  finally { addingId.value = null }
}
</script>

<template>
  <div ref="menuRoot" class="classroom-actions-root" @click.stop>
    <button type="button" class="classroom-actions-trigger" :aria-label="`Ações da sala ${classroom.name}`" :aria-expanded="menuOpen" aria-haspopup="true" @click="menuOpen = !menuOpen">
      <EllipsisH aria-hidden="true" />
    </button>
    <div v-if="menuOpen" class="classroom-actions-menu" role="group" :aria-label="`Ações para ${classroom.name}`">
      <button type="button" @click="openEnrollment"><UserPlus aria-hidden="true" /> Matricular alunos</button>
      <button type="button" @click="go('alunos')"><Users aria-hidden="true" /> Ver alunos</button>
      <button type="button" @click="openActivity"><FileEdit aria-hidden="true" /> Criar atividade</button>
      <button type="button" @click="go('atividades')"><ListCheck aria-hidden="true" /> Ver atividades</button>
      <div class="classroom-actions-divider" role="separator"></div>
      <button type="button" @click="openEdit"><Pencil aria-hidden="true" /> Editar sala</button>
      <div class="classroom-actions-divider" role="separator"></div>
      <button type="button" class="classroom-actions-danger" @click="openDelete"><Trash aria-hidden="true" /> Excluir sala</button>
    </div>
  </div>
  <ClassroomDialog v-model:visible="editVisible" mode="edit" :classroom="classroom" :saving="editBusy" :error="editError" @submit="saveEdit" />
  <ActivityDialog v-model:visible="activityVisible" @continue="continueActivity" />
  <AddStudentDialog v-model:visible="enrollVisible" v-model:search="search" :students="studentsAvailable" :loading="searching" :adding-id="addingId" :error="candidateError" @add="addStudent" />
  <Dialog v-model:visible="deleteVisible" modal header="Excluir sala" :closable="!deleteBusy" :close-on-escape="!deleteBusy" :style="{ width: 'min(92vw, 500px)' }">
    <p>Excluir a sala <strong>{{ classroom.name }}</strong>? A sala, suas matrículas, atividades e entregas associadas serão removidas. Esta ação não pode ser desfeita.</p>
    <p v-if="deleteError" class="classroom-actions-error" role="alert">{{ deleteError }}</p>
    <template #footer>
      <button type="button" class="assignment-secondary-button" :disabled="deleteBusy" @click="deleteVisible = false">Cancelar</button>
      <button type="button" class="cc-danger-button" :disabled="deleteBusy" @click="deleteClassroom">{{ deleteBusy ? 'Excluindo...' : 'Excluir sala' }}</button>
    </template>
  </Dialog>
</template>

<style>
.classroom-actions-root { position: absolute; top: 16px; right: 16px; z-index: 2; }
.classroom-actions-trigger { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border: 1px solid var(--color-border); border-radius: 9px; background: var(--color-surface); color: var(--color-text); cursor: pointer; }
.classroom-actions-trigger svg { width: 21px; height: 21px; }
.classroom-actions-trigger:hover { border-color: var(--color-primary); }
.classroom-actions-trigger:focus-visible, .classroom-actions-menu button:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.classroom-actions-menu { position: absolute; top: 43px; right: 0; width: max-content; min-width: 205px; max-width: min(85vw, 280px); padding: 6px; background: var(--color-surface); border: 1px solid var(--color-border-strong); border-radius: 12px; box-shadow: var(--shadow-lg, 0 12px 30px rgba(0,0,0,.18)); z-index: 5; }
.classroom-actions-menu button { width: 100%; display: flex; align-items: center; gap: 9px; text-align: left; padding: 10px; font: inherit; font-size: .84rem; border: 0; border-radius: 8px; color: var(--color-text); background: transparent; cursor: pointer; }
.classroom-actions-menu button:hover { background: var(--color-surface-secondary); }
.classroom-actions-menu svg { width: 17px; height: 17px; flex: 0 0 auto; }
.classroom-actions-divider { border-top: 1px solid var(--color-border); margin: 5px 4px; }
.classroom-actions-menu .classroom-actions-danger, .classroom-actions-error { color: var(--color-danger); }
.cc-danger-button { padding: .65rem .8rem; border: 1px solid var(--color-danger-border); background: var(--color-danger-soft); border-radius: 8px; color: var(--color-danger); font: inherit; cursor: pointer; }
@media (max-width: 650px) { .classroom-actions-menu { right: 0; } }
</style>
