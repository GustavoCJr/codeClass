<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { EllipsisH, Trash } from '@primeicons/vue'
import ConfirmAction from '../ConfirmAction.vue'

const props = defineProps({ classroomId: { type: String, required: true }, student: { type: Object, required: true } })
const emit = defineEmits(['removed'])
const open = ref(false)
const root = ref(null)
const confirmation = ref(null)

function outside(event) {
  if (open.value && !root.value?.contains(event.target)) open.value = false
}
function escape(event) { if (event.key === 'Escape') open.value = false }
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', outside)
  document.addEventListener('keydown', escape)
}
onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('pointerdown', outside)
    document.removeEventListener('keydown', escape)
  }
})
function remover() {
  open.value = false
  confirmation.value?.abrirConfirmacao()
}
</script>

<template>
  <div ref="root" class="classroom-student-actions">
    <button type="button" class="classroom-student-menu-trigger" aria-label="Ações do aluno" aria-haspopup="menu" :aria-expanded="open" @click="open = !open">
      <EllipsisH :size="21" aria-hidden="true" />
    </button>
    <div v-if="open" class="classroom-student-dropdown" role="menu" aria-label="Ações do aluno">
      <button type="button" role="menuitem" @click="remover">
        <Trash :size="17" aria-hidden="true" /> Remover da sala
      </button>
    </div>
    <ConfirmAction
      ref="confirmation"
      :show-trigger="false"
      :endpoint="`/classrooms/${encodeURIComponent(classroomId)}/students/${encodeURIComponent(student.student_id)}`"
      label="Remover da sala"
      :message="`Remover ${student.full_name} desta sala? A conta institucional do aluno será mantida.`"
      @completed="emit('removed', student.student_id)"
    />
  </div>
</template>
