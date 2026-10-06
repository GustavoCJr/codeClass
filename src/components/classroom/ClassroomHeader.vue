<script setup>
// v4: menu contextual com ícones nas ações da sala
import { reactive, ref, watch } from 'vue'

import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Menu from 'primevue/menu'

import {
  FileEdit,
  ListCheck,
  User
} from '@primeicons/vue'


import './ClassroomHeader.css'

const props = defineProps({
  sala: {
    type: Object,
    required: true
  },

  salvando: {
    type: Boolean,
    default: false
  },

  erro: {
    type: String,
    default: ''
  },

  editable: {
    type: Boolean,
    default: false
  },

  backHref: {
    type: String,
    default: '/salas.html'
  },

  backLabel: {
    type: String,
    default: 'Salas'
  }
})

const emit = defineEmits([
  'save',
  'new-assignment',
  'invite-students'
])

const editando = ref(false)
const nomeTocado = ref(false)
const actionMenu = ref(null)

const actionItems = [
  {
    label: 'Editar dados da sala',
    iconComponent: FileEdit,
    command: () => iniciarEdicao()
  },
  {
    label: 'Nova atividade',
    iconComponent: ListCheck,
    command: () => emit('new-assignment')
  },
  {
    label: 'Convidar alunos',
    iconComponent: User,
    command: () => emit('invite-students')
  }
]

const formulario = reactive({
  nome: '',
  descricao: ''
})

function preencherFormulario() {
  formulario.nome = props.sala?.nome ?? ''
  formulario.descricao = props.sala?.descricao ?? ''
  nomeTocado.value = false
}

watch(
  () => props.sala,
  () => preencherFormulario(),
  { immediate: true, deep: true }
)

function iniciarEdicao() {
  if (!props.editable) {
    return
  }

  preencherFormulario()
  editando.value = true
}

function cancelarEdicao() {
  preencherFormulario()
  editando.value = false
}

function toggleActionMenu(event) {
  actionMenu.value?.toggle(event)
}

function salvar() {
  nomeTocado.value = true

  if (!formulario.nome.trim() || props.salvando) {
    return
  }

  emit('save', {
    nome: formulario.nome.trim(),
    descricao: formulario.descricao.trim(),
    onSuccess: () => {
      editando.value = false
      nomeTocado.value = false
    }
  })
}

defineExpose({
  iniciarEdicao
})
</script>

<template>
  <header class="classroom-header">
    <div class="classroom-header-topline">
      <a
        class="classroom-header-back"
        :href="backHref"
      >
        <span aria-hidden="true">←</span>
        {{ backLabel }}
      </a>

      <span class="classroom-header-code">
        {{ sala.codigo }}
      </span>
    </div>

    <div
      v-if="!editando"
      class="classroom-header-view"
    >
      <div class="classroom-header-copy">
        <div class="classroom-header-title-row">
          <div>
            <span class="classroom-header-kicker">// SALA DE AULA</span>
            <h1>{{ sala.nome }}</h1>
          </div>

          <div
            v-if="editable"
            class="classroom-header-actions"
          >
            <button
              class="classroom-header-more"
              type="button"
              aria-label="Mais opções da sala"
              aria-haspopup="true"
              @click="toggleActionMenu"
            >
              <span aria-hidden="true">•••</span>
            </button>

            <Menu
              ref="actionMenu"
              :model="actionItems"
              popup
              class="classroom-header-menu"
            >
              <template #item="{ item, props: itemProps }">
                <a
                  v-bind="itemProps.action"
                  class="classroom-header-menu-link"
                >
                  <component
                    :is="item.iconComponent"
                    class="classroom-header-menu-icon"
                    size="16"
                    aria-hidden="true"
                  />
                  <span>{{ item.label }}</span>
                </a>
              </template>
            </Menu>
          </div>
        </div>

        <p class="classroom-header-description">
          {{ sala.descricao || 'Sem descrição cadastrada.' }}
        </p>

        <div class="classroom-header-meta">
          <span>
            <strong>{{ sala.alunos }}</strong>
            {{ sala.alunos === 1 ? 'aluno' : 'alunos' }}
          </span>

          <span aria-hidden="true">·</span>

          <span>
            <strong>{{ sala.atividadesAtivas }}</strong>
            {{ sala.atividadesAtivas === 1 ? 'atividade ativa' : 'atividades ativas' }}
          </span>
        </div>
      </div>
    </div>

    <form
      v-else-if="editable"
      class="classroom-header-editing"
      @submit.prevent="salvar"
    >
      <div class="classroom-header-edit-grid">
        <div class="classroom-header-field classroom-header-field--name">
          <label for="classroom-detail-name">
            Nome da sala
            <span aria-hidden="true">*</span>
          </label>

          <InputText
            id="classroom-detail-name"
            v-model="formulario.nome"
            :disabled="salvando"
            :invalid="nomeTocado && !formulario.nome.trim()"
            autocomplete="off"
            @blur="nomeTocado = true"
          />

          <small
            v-if="nomeTocado && !formulario.nome.trim()"
            class="classroom-header-field-error"
          >
            Informe o nome da sala.
          </small>
        </div>

        <div class="classroom-header-field">
          <label for="classroom-detail-description">
            Descrição
            <small>OPCIONAL</small>
          </label>

          <Textarea
            id="classroom-detail-description"
            v-model="formulario.descricao"
            :disabled="salvando"
            rows="3"
            auto-resize
            placeholder="Descreva brevemente a turma."
          />
        </div>
      </div>

      <div
        v-if="erro"
        class="classroom-header-save-error"
        role="alert"
      >
        {{ erro }}
      </div>

      <div class="classroom-header-edit-actions">
        <button
          class="classroom-header-action classroom-header-action--secondary"
          type="button"
          :disabled="salvando"
          @click="cancelarEdicao"
        >
          Cancelar
        </button>

        <button
          class="classroom-header-action classroom-header-action--primary"
          type="submit"
          :disabled="salvando || !formulario.nome.trim()"
        >
          {{ salvando ? 'Salvando...' : 'Salvar alterações' }}
        </button>
      </div>
    </form>
  </header>
</template>
