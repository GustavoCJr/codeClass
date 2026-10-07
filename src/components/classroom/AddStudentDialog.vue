<script setup>
import { computed } from 'vue'

import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },

  search: {
    type: String,
    default: ''
  },

  students: {
    type: Array,
    default: () => []
  },

  loading: {
    type: Boolean,
    default: false
  },

  addingId: {
    type: String,
    default: null
  },

  error: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'update:visible',
  'update:search',
  'add'
])

const modelVisible = computed({
  get: () => props.visible,
  set: (value) => {
    if (!props.addingId) {
      emit('update:visible', value)
    }
  }
})

const modelSearch = computed({
  get: () => props.search,
  set: (value) =>
    emit('update:search', value)
})

const adicionando = computed(() =>
  Boolean(props.addingId)
)

function iniciais(nome) {
  return String(nome || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()
}

function adicionar(aluno) {
  if (
    adicionando.value ||
    !aluno?.user_id
  ) {
    return
  }

  emit('add', aluno)
}
</script>

<template>
  <Dialog
    v-model:visible="modelVisible"
    modal
    :draggable="false"
    :closable="!adicionando"
    :dismissable-mask="!adicionando"
    class="add-student-dialog"
  >
    <template #header>
      <div class="add-student-dialog-header">
        <span>
          // ADICIONAR ALUNO
        </span>

        <h2>Matricular na sala</h2>

        <p>
          Busque um aluno já cadastrado na
          instituição e adicione à turma.
        </p>
      </div>
    </template>

    <div class="add-student-dialog-body">
      <div class="add-student-search">
        <label for="add-student-search">
          Buscar por nome ou e-mail
        </label>

        <InputText
          id="add-student-search"
          v-model="modelSearch"
          type="search"
          autocomplete="off"
          placeholder="Ex.: João ou joao@email.com"
          :disabled="adicionando"
        />

        <small>
          A busca considera apenas alunos ativos
          da instituição.
        </small>
      </div>

      <div
        v-if="error"
        class="add-student-error"
        role="alert"
      >
        {{ error }}
      </div>

      <div
        v-if="loading"
        class="add-student-state"
      >
        <span>// BUSCANDO</span>
        <strong>
          Procurando alunos...
        </strong>
      </div>

      <div
        v-else-if="students.length"
        class="add-student-list"
      >
        <article
          v-for="aluno in students"
          :key="aluno.user_id"
          class="add-student-item"
        >
          <div
            class="add-student-avatar"
            aria-hidden="true"
          >
            {{ iniciais(aluno.full_name) }}
          </div>

          <div class="add-student-copy">
            <strong>
              {{ aluno.full_name }}
            </strong>

            <span>
              {{ aluno.email }}
            </span>
          </div>

          <button
            type="button"
            class="add-student-button"
            :disabled="adicionando"
            @click="adicionar(aluno)"
          >
            {{
              addingId === aluno.user_id
                ? 'Adicionando...'
                : 'Adicionar'
            }}
          </button>
        </article>
      </div>

      <div
        v-else
        class="add-student-state"
      >
        <span>
          // NENHUM ALUNO DISPONÍVEL
        </span>

        <strong>
          Nenhum aluno encontrado.
        </strong>

        <p>
          O aluno precisa estar cadastrado e
          ativo na instituição antes de entrar
          na sala.
        </p>
      </div>
    </div>
  </Dialog>
</template>

<style src="./AddStudentDialog.css"></style>
