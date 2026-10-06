<script setup>
import {
  computed,
  onMounted,
  ref,
  watch
} from 'vue'

import SidebarLayout from 'primevue/sidebarlayout'
import SidebarMain from 'primevue/sidebarmain'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'

import SidebarProfessor from '../../components/sidebarProfessor.vue'
import CodeAssignmentForm from '../../components/assignment/CodeAssignmentForm.vue'
import QuestionnaireForm from '../../components/assignment/QuestionnaireForm.vue'

import {
  buscarSalasParaTarefa,
  criarTarefa
} from './service'

function carregarDadosIniciais() {
  try {
    return JSON.parse(
      sessionStorage.getItem('codeclass:nova-tarefa') ||
        'null'
    )
  } catch {
    return null
  }
}

const dadosIniciais = carregarDadosIniciais()

if (!dadosIniciais) {
  window.location.href = '/dashboardProfessor.html'
}

const salas = ref([])

const salaSelecionada = ref(
  dadosIniciais?.classroomId || null
)

const prazo = ref(null)
const politicaLiberacao = ref('on_review')

const configTarefa = ref({})

const carregandoSalas = ref(true)
const erroSalas = ref('')

const salvando = ref(false)
const erroCriacao = ref('')

const tipoFormatado = computed(() => {
  if (dadosIniciais?.tipo === 'code') {
    return 'Código'
  }

  if (dadosIniciais?.tipo === 'questionnaire') {
    return 'Questionário'
  }

  return 'Tarefa'
})

const questionarioTemQuestaoAberta = computed(() => {
  if (dadosIniciais?.tipo !== 'questionnaire') {
    return false
  }

  return configTarefa.value.questions?.some(
    (questao) => questao.type === 'open'
  ) || false
})

const politicasLiberacao = computed(() => {
  if (dadosIniciais?.tipo === 'code') {
    return [
      {
        label: 'Após revisão do professor',
        value: 'on_review'
      }
    ]
  }

  if (questionarioTemQuestaoAberta.value) {
    return [
      {
        label: 'Após revisão do professor',
        value: 'on_review'
      }
    ]
  }

  return [
    {
      label: 'Após revisão do professor',
      value: 'on_review'
    },
    {
      label: 'Imediatamente após a entrega',
      value: 'immediate'
    }
  ]
})

watch(
  questionarioTemQuestaoAberta,
  (temQuestaoAberta) => {
    if (
      temQuestaoAberta &&
      politicaLiberacao.value === 'immediate'
    ) {
      politicaLiberacao.value = 'on_review'
    }
  }
)

const questionarioValido = computed(() => {
  if (dadosIniciais?.tipo !== 'questionnaire') {
    return true
  }

  const questoes =
    configTarefa.value.questions || []

  if (questoes.length === 0) {
    return false
  }

  return questoes.every((questao) => {
    if (!questao.statement?.trim()) {
      return false
    }

    if (
      questao.points === null ||
      questao.points === undefined ||
      Number(questao.points) < 0
    ) {
      return false
    }

    if (questao.type === 'choice') {
      if (
        !Array.isArray(questao.options) ||
        questao.options.length < 2
      ) {
        return false
      }

      const temAlternativaVazia =
        questao.options.some(
          (alternativa) =>
            !alternativa.text?.trim()
        )

      if (temAlternativaVazia) {
        return false
      }

      const respostaCorretaExiste =
        questao.options.some(
          (alternativa) =>
            alternativa.id ===
            questao.correct_option_id
        )

      if (!respostaCorretaExiste) {
        return false
      }
    }

    return true
  })
})

const codigoValido = computed(() => {
  if (dadosIniciais?.tipo !== 'code') {
    return true
  }

  const config = configTarefa.value

  if (
    !Array.isArray(config.languages) ||
    config.languages.length === 0
  ) {
    return false
  }

  const linguagensValidas =
    config.languages.every((linguagem) => {
      const nome = linguagem?.name?.trim()

      return Boolean(
        nome &&
        nome.length <= 50 &&
        typeof linguagem.starter_code === 'string'
      )
    })

  if (!linguagensValidas) {
    return false
  }

  const tempo =
    Number(config.time_limit_sec)

  if (
    !Number.isFinite(tempo) ||
    tempo <= 0 ||
    tempo > 60
  ) {
    return false
  }

  const memoria =
    Number(config.memory_limit_mb)

  if (
    !Number.isInteger(memoria) ||
    memoria <= 0 ||
    memoria > 1024
  ) {
    return false
  }

  if (
    config.rubric !== undefined &&
    typeof config.rubric !== 'string'
  ) {
    return false
  }

  const casos =
    config.test_cases || []

  if (!Array.isArray(casos)) {
    return false
  }

  return casos.every((caso, index) => {
    return (
      caso.id === index + 1 &&
      typeof caso.input === 'string' &&
      typeof caso.expected_output === 'string'
    )
  })
})

const podeCriarTarefa = computed(() => {
  if (!salaSelecionada.value) {
    return false
  }

  if (dadosIniciais?.tipo === 'questionnaire') {
    return questionarioValido.value
  }

  if (dadosIniciais?.tipo === 'code') {
    return codigoValido.value
  }

  return false
})

onMounted(async () => {
  try {
    salas.value = await buscarSalasParaTarefa()
  } catch (error) {
    console.error(error)

    erroSalas.value =
      'Não foi possível carregar suas salas.'
  } finally {
    carregandoSalas.value = false
  }
})

async function salvarTarefa() {
  if (!podeCriarTarefa.value) {
    return
  }

  salvando.value = true
  erroCriacao.value = ''

  try {
    const payload = {
      title: dadosIniciais.titulo,
      description:
        dadosIniciais.descricao || '',
      type: dadosIniciais.tipo,
      release_policy:
        politicaLiberacao.value,

      deadline: prazo.value
        ? prazo.value.toISOString()
        : null,

      config: configTarefa.value
    }

    console.log(
      'Payload enviado:',
      payload
    )

    const tarefaCriada =
      await criarTarefa(
        salaSelecionada.value,
        payload
      )

    console.log(
      'Tarefa criada:',
      tarefaCriada
    )

    sessionStorage.removeItem(
      'codeclass:nova-tarefa'
    )

    alert('Tarefa criada com sucesso!')

    window.location.href =
      `/sala.html?id=${encodeURIComponent(
        salaSelecionada.value
      )}&tab=atividades`
  } catch (error) {
    console.error(error)

    erroCriacao.value =
      error.message ||
      'Não foi possível criar a tarefa.'
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <SidebarLayout class="criar-tarefa-layout">
    <SidebarProfessor />

    <SidebarMain>
      <main class="criar-tarefa-page">
        <header class="criar-tarefa-header">
          <span>
            // NOVA TAREFA
          </span>

          <h1>
            {{ dadosIniciais?.titulo }}
          </h1>

          <p>
            {{ tipoFormatado }}
          </p>

          <p
            v-if="dadosIniciais?.descricao"
            class="criar-tarefa-description"
          >
            {{ dadosIniciais.descricao }}
          </p>
        </header>

        <section class="criar-tarefa-settings">
          <span>
            // CONFIGURAÇÕES
          </span>

          <h2>
            Informações da tarefa
          </h2>

          <div class="criar-tarefa-field">
            <label for="classroom">
              Sala
            </label>

            <p v-if="carregandoSalas">
              Carregando salas...
            </p>

            <p
              v-else-if="erroSalas"
              class="criar-tarefa-error"
            >
              {{ erroSalas }}
            </p>

            <Select
              v-else
              id="classroom"
              v-model="salaSelecionada"
              :options="salas"
              option-label="name"
              option-value="id"
              placeholder="Selecione uma sala"
              class="criar-tarefa-control"
            />
          </div>

          <div class="criar-tarefa-field">
            <label for="deadline">
              Prazo
            </label>

            <DatePicker
              id="deadline"
              v-model="prazo"
              show-time
              hour-format="24"
              show-icon
              placeholder="Selecione data e horário"
              class="criar-tarefa-control"
            />
          </div>

          <div class="criar-tarefa-field">
            <label for="release-policy">
              Quando liberar o resultado?
            </label>

            <Select
              id="release-policy"
              v-model="politicaLiberacao"
              :options="politicasLiberacao"
              option-label="label"
              option-value="value"
              class="criar-tarefa-control"
            />

            <small
              v-if="
                dadosIniciais?.tipo ===
                  'questionnaire' &&
                questionarioTemQuestaoAberta
              "
              class="criar-tarefa-help"
            >
              Questionários com questão aberta são
              liberados após revisão do professor.
            </small>

            <small
              v-if="dadosIniciais?.tipo === 'code'"
              class="criar-tarefa-help"
            >
              Atividades de código são liberadas após
              revisão do professor.
            </small>
          </div>
        </section>

        <hr class="criar-tarefa-divider" />

        <CodeAssignmentForm
          v-if="dadosIniciais?.tipo === 'code'"
          v-model="configTarefa"
        />

        <QuestionnaireForm
          v-else-if="
            dadosIniciais?.tipo === 'questionnaire'
          "
          v-model="configTarefa"
        />

        <div
          v-if="
            dadosIniciais?.tipo === 'questionnaire' ||
            dadosIniciais?.tipo === 'code'
          "
          class="criar-tarefa-actions"
        >
          <p
            v-if="erroCriacao"
            class="criar-tarefa-error"
          >
            {{ erroCriacao }}
          </p>

          <button
            type="button"
            :disabled="
              !podeCriarTarefa ||
              salvando
            "
            class="criar-tarefa-submit"
            @click="salvarTarefa"
          >
            {{
              salvando
                ? 'Criando...'
                : 'Criar tarefa'
            }}
          </button>
        </div>
      </main>
    </SidebarMain>
  </SidebarLayout>
</template>

<style src="./estilos.css"></style>
