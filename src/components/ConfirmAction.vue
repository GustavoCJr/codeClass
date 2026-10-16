<script setup>
import { ref } from 'vue'
import Dialog from 'primevue/dialog'
import { api } from '../config/api'
const props = defineProps({ endpoint: String, label: String, message: String, showTrigger: { type: Boolean, default: true } })
function abrirConfirmacao() { error.value = ''; visible.value = true }
defineExpose({ abrirConfirmacao })
const emit = defineEmits(['completed'])
const visible = ref(false)
const busy = ref(false)
const error = ref('')
async function executar() {
  if (busy.value) return
  busy.value = true; error.value = ''
  try { await api(props.endpoint, { method: 'DELETE' }); visible.value = false; emit('completed') }
  catch (err) { error.value = err.message }
  finally { busy.value = false }
}
</script>
<template>
  <button v-if="showTrigger" type="button" class="cc-danger-button" @click="abrirConfirmacao">{{ label }}</button>
  <Dialog v-model:visible="visible" modal :header="label" :closable="!busy" :close-on-escape="!busy" :style="{ width: 'min(92vw, 500px)' }">
    <p>{{ message }}</p><p v-if="error" role="alert">{{ error }}</p>
    <template #footer><button type="button" :disabled="busy" class="assignment-secondary-button" @click="visible = false">Cancelar</button><button type="button" :disabled="busy" class="cc-danger-button" @click="executar">{{ busy ? 'Processando...' : label }}</button></template>
  </Dialog>
</template>
<style>
.cc-danger-button { padding: 0.65rem 0.8rem; border: 1px solid var(--color-danger-border); color: var(--color-danger); background: var(--color-danger-soft); border-radius: 8px; font: inherit; cursor: pointer; }
.cc-danger-button:focus-visible { outline: 2px solid var(--color-danger); outline-offset: 3px; }
.cc-danger-button:disabled { opacity: 0.6; cursor: default; }
.cc-management-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 1rem 0; }
</style>
