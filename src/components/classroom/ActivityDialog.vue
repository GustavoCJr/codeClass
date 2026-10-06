<script setup>
// CODECLASS - ACTIVITY DIALOG
// Etapa inicial da criação de tarefa

import { computed, ref, watch } from 'vue'

import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'

import {
  FileEdit,
  ListCheck
} from '@primeicons/vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:visible',
  'continue'
])

const titulo = ref('')
const descricao = ref('')
const tipo = ref('code')

const tituloTocado = ref(false)

const modelVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const tituloInvalido = computed(() => {
  return tituloTocado.value && !titulo.value.trim()
})

const podeContinuar = computed(() => {
  return Boolean(titulo.value.trim())
})

function limparFormulario() {
  titulo.value = ''
  descricao.value = ''
  tipo.value = 'code'
  tituloTocado.value = false
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      limparFormulario()
    }
  }
)

function cancelar() {
  modelVisible.value = false
}

function selecionarTipo(novoTipo) {
  tipo.value = novoTipo
}

function continuar() {
  tituloTocado.value = true

  if (!podeContinuar.value) {
    return
  }

  emit('continue', {
    titulo: titulo.value.trim(),
    descricao: descricao.value.trim(),
    tipo: tipo.value
  })
}
</script>

<template>
  <Dialog
    v-model:visible="modelVisible"
    modal
    :draggable="false"
    class="activity-dialog"
    :style="{ width: 'min(92vw, 620px)' }"
  >
    <template #header>
      <div class="activity-dialog-header">
        <span class="activity-dialog-kicker">
          // NOVA TAREFA
        </span>

        <div>
          <h2>Criar nova tarefa</h2>

          <p>
            Defina as informações iniciais. Na próxima etapa,
            você poderá configurar o conteúdo da tarefa.
          </p>
        </div>
      </div>
    </template>

    <form
      class="activity-dialog-form"
      @submit.prevent="continuar"
    >
      <div class="activity-dialog-field">
        <label for="activity-title">
          Título da tarefa
          <span aria-hidden="true">*</span>
        </label>

        <InputText
          id="activity-title"
          v-model="titulo"
          :invalid="tituloInvalido"
          autocomplete="off"
          placeholder="Ex.: Árvores binárias de busca"
          @blur="tituloTocado = true"
        />

        <small
          v-if="tituloInvalido"
          class="activity-dialog-field-error"
        >
          Informe o título da tarefa.
        </small>
      </div>

      <fieldset class="activity-dialog-type-group">
        <legend>
          Tipo da tarefa
          <span aria-hidden="true">*</span>
        </legend>

        <div class="activity-dialog-type-options">
          <button
            type="button"
            class="activity-dialog-type"
            :class="{
              'activity-dialog-type--active':
                tipo === 'code'
            }"
            :aria-pressed="tipo === 'code'"
            @click="selecionarTipo('code')"
          >
            <span class="activity-dialog-type-icon">
              <FileEdit
                size="18"
                aria-hidden="true"
              />
            </span>

            <span>
              <strong>Código</strong>

              <small>
                Atividade prática de programação.
              </small>
            </span>
          </button>

          <button
            type="button"
            class="activity-dialog-type"
            :class="{
              'activity-dialog-type--active':
                tipo === 'questionnaire'
            }"
            :aria-pressed="tipo === 'questionnaire'"
            @click="selecionarTipo('questionnaire')"
          >
            <span class="activity-dialog-type-icon">
              <ListCheck
                size="18"
                aria-hidden="true"
              />
            </span>

            <span>
              <strong>Questionário</strong>

              <small>
                Atividade com perguntas e respostas.
              </small>
            </span>
          </button>
        </div>
      </fieldset>

      <div class="activity-dialog-field">
        <label for="activity-description">
          Descrição
          <small>OPCIONAL</small>
        </label>

        <Textarea
          id="activity-description"
          v-model="descricao"
          rows="4"
          auto-resize
          placeholder="Descreva brevemente a proposta da tarefa."
        />
      </div>

      <div class="activity-dialog-actions">
        <button
          type="button"
          class="activity-dialog-button activity-dialog-button--secondary"
          @click="cancelar"
        >
          Cancelar
        </button>

        <button
          type="submit"
          class="activity-dialog-button activity-dialog-button--primary"
          :disabled="!podeContinuar"
        >
          Continuar
        </button>
      </div>
    </form>
  </Dialog>
</template>

<style src="./ActivityDialog.css"></style>