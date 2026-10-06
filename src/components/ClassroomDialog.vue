<script setup>
import { computed, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },

  mode: {
    type: String,
    default: 'create',
    validator: (value) => ['create', 'edit'].includes(value)
  },

  classroom: {
    type: Object,
    default: null
  },

  saving: {
    type: Boolean,
    default: false
  },

  error: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'update:visible',
  'submit'
])

const nome = ref('')
const descricao = ref('')
const nomeTocado = ref(false)

const titulo = computed(() => {
  return props.mode === 'edit' ? 'Editar sala' : 'Nova sala'
})

const descricaoTitulo = computed(() => {
  return props.mode === 'edit'
    ? 'Atualize as informações principais da turma.'
    : 'Crie uma nova turma para organizar alunos e atividades.'
})

const textoAcao = computed(() => {
  if (props.saving) {
    return props.mode === 'edit' ? 'Salvando...' : 'Criando...'
  }

  return props.mode === 'edit' ? 'Salvar alterações' : 'Criar sala'
})

const nomeInvalido = computed(() => {
  return nomeTocado.value && !nome.value.trim()
})

const podeSalvar = computed(() => {
  return Boolean(nome.value.trim()) && !props.saving
})

const modelVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

function preencherFormulario() {
  nome.value = props.classroom?.nome ?? props.classroom?.name ?? ''
  descricao.value = props.classroom?.descricao ?? props.classroom?.description ?? ''
  nomeTocado.value = false
}

watch(
  () => [props.visible, props.classroom, props.mode],
  ([visible]) => {
    if (visible) {
      preencherFormulario()
    }
  },
  { immediate: true }
)

function cancelar() {
  if (props.saving) {
    return
  }

  modelVisible.value = false
}

function enviarFormulario() {
  nomeTocado.value = true

  if (!podeSalvar.value) {
    return
  }

  emit('submit', {
    id: props.classroom?.id ?? null,
    nome: nome.value.trim(),
    descricao: descricao.value.trim()
  })
}
</script>

<template>
  <Dialog
    v-model:visible="modelVisible"
    modal
    :draggable="false"
    :closable="!saving"
    :dismissable-mask="!saving"
    class="classroom-dialog"
    :style="{ width: 'min(92vw, 560px)' }"
  >
    <template #header>
      <div class="classroom-dialog-header">
        <span class="classroom-dialog-kicker">
          {{ mode === 'edit' ? '// EDITAR TURMA' : '// NOVA TURMA' }}
        </span>

        <div>
          <h2>{{ titulo }}</h2>
          <p>{{ descricaoTitulo }}</p>
        </div>
      </div>
    </template>

    <form
      class="classroom-dialog-form"
      @submit.prevent="enviarFormulario"
    >
      <div class="classroom-dialog-field">
        <label for="classroom-name">
          Nome da sala
          <span aria-hidden="true">*</span>
        </label>

        <InputText
          id="classroom-name"
          v-model="nome"
          :disabled="saving"
          :invalid="nomeInvalido"
          autocomplete="off"
          placeholder="Ex.: Estrutura de Dados"
          @blur="nomeTocado = true"
        />

        <small
          v-if="nomeInvalido"
          class="classroom-dialog-field-error"
        >
          Informe o nome da sala.
        </small>
      </div>

      <div class="classroom-dialog-field">
        <label for="classroom-description">
          Descrição
          <small>OPCIONAL</small>
        </label>

        <Textarea
          id="classroom-description"
          v-model="descricao"
          :disabled="saving"
          rows="5"
          auto-resize
          placeholder="Descreva brevemente o objetivo ou contexto desta turma."
        />
      </div>

      <div
        v-if="error"
        class="classroom-dialog-error"
        role="alert"
      >
        {{ error }}
      </div>

      <div class="classroom-dialog-actions">
        <button
          type="button"
          class="classroom-dialog-button classroom-dialog-button--secondary"
          :disabled="saving"
          @click="cancelar"
        >
          Cancelar
        </button>

        <button
          type="submit"
          class="classroom-dialog-button classroom-dialog-button--primary"
          :disabled="!podeSalvar"
        >
          {{ textoAcao }}
        </button>
      </div>
    </form>
  </Dialog>
</template>

<style src="./ClassroomDialog.css"></style>
