<script setup>
import { ref, onBeforeUnmount } from 'vue'
import Dialog from 'primevue/dialog'
import ClassroomDialog from '../ClassroomDialog.vue'
import { api } from '../../config/api'
import { useProfessorNavigation } from '../../router/professorNavigation'
import { EllipsisH, Pencil, Trash } from '@primeicons/vue'

const props = defineProps({ classroom: { type: Object, required: true } })
const emit = defineEmits(['updated'])
const navegar = useProfessorNavigation()
const menuOpen = ref(false)
const root = ref(null)
const editVisible = ref(false)
const busy = ref(false)
const error = ref('')
const deleteVisible = ref(false)
const deleting = ref(false)
const deleteError = ref('')

function closeMenu() { menuOpen.value = false }
function onPointer(event) {
  if (menuOpen.value && !root.value?.contains(event.target)) closeMenu()
}
function onKey(event) { if (event.key === 'Escape') closeMenu() }
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', onPointer)
  document.addEventListener('keydown', onKey)
}
onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('pointerdown', onPointer)
    document.removeEventListener('keydown', onKey)
  }
})
function openEdit() { closeMenu(); error.value = ''; editVisible.value = true }
function openDelete() { closeMenu(); deleteError.value = ''; deleteVisible.value = true }
async function salvar(payload) {
  if (busy.value) return
  busy.value = true; error.value = ''
  try {
    const sala = await api(`/classrooms/${encodeURIComponent(props.classroom.id)}`, {
      method: 'PATCH', body: JSON.stringify({ name: payload.nome, description: payload.descricao || null })
    })
    emit('updated', sala)
    editVisible.value = false
  } catch (err) { error.value = err.message || 'Não foi possível editar a sala.' }
  finally { busy.value = false }
}
async function excluir() {
  if (deleting.value) return
  deleting.value = true; deleteError.value = ''
  try {
    await api(`/classrooms/${encodeURIComponent(props.classroom.id)}`, { method: 'DELETE' })
    deleteVisible.value = false
    navegar('/salas.html')
  } catch (err) { deleteError.value = err.message || 'Não foi possível excluir a sala.' }
  finally { deleting.value = false }
}
</script>

<template>
  <div ref="root" class="classroom-actions-menu">
    <button type="button" class="classroom-menu-trigger" aria-label="Ações da sala" aria-haspopup="menu" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen">
      <EllipsisH :size="22" aria-hidden="true" />
    </button>
    <div v-if="menuOpen" class="classroom-actions-dropdown" role="menu" aria-label="Ações da sala">
      <button type="button" role="menuitem" @click="openEdit"><Pencil :size="17" aria-hidden="true" /> Editar sala</button>
      <button type="button" role="menuitem" class="classroom-delete-option" @click="openDelete"><Trash :size="17" aria-hidden="true" /> Excluir sala</button>
    </div>
  </div>
  <ClassroomDialog v-model:visible="editVisible" mode="edit" :classroom="classroom" :saving="busy" :error="error" @submit="salvar" />
  <Dialog v-model:visible="deleteVisible" modal header="Excluir sala" :closable="!deleting" :close-on-escape="!deleting" :style="{ width: 'min(92vw, 500px)' }">
    <p>Excluir a sala <strong>{{ classroom.name }}</strong>? A sala, as matrículas, atividades e entregas associadas serão removidas. Esta ação não pode ser desfeita.</p>
    <p v-if="deleteError" role="alert" class="classroom-delete-error">{{ deleteError }}</p>
    <template #footer>
      <button type="button" class="classroom-secondary-button" :disabled="deleting" @click="deleteVisible = false">Cancelar</button>
      <button type="button" class="classroom-confirm-delete" :disabled="deleting" @click="excluir">{{ deleting ? 'Excluindo...' : 'Excluir sala' }}</button>
    </template>
  </Dialog>
</template>
