<script setup>
import { computed, ref, watch } from 'vue'

import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import RadioButton from 'primevue/radiobutton'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'

const emit = defineEmits([
  'update:modelValue'
])
const props = defineProps({ initialConfig: { type: Object, default: null } })

const tiposQuestao = [
  {
    label: 'Múltipla escolha',
    value: 'choice'
  },
  {
    label: 'Questão aberta',
    value: 'open'
  }
]

const letrasDisponiveis = [
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j'
]

function criarQuestao(tipo = 'choice') {
  return {
    id: Date.now() + Math.random(),
    type: tipo,
    points: 10,
    statement: '',

    options: [
      {
        id: 'a',
        text: ''
      },
      {
        id: 'b',
        text: ''
      }
    ],
    correct_option_id: 'a',

    reference_answer: '',
    rubric: ''
  }
}

const questoes = ref([
  criarQuestao()
])
if (props.initialConfig?.questions) {
  questoes.value = JSON.parse(JSON.stringify(props.initialConfig.questions)).map(questao => ({
    ...criarQuestao(questao.type), ...questao
  }))
}

const totalPontos = computed(() => {
  return questoes.value.reduce(
    (total, questao) =>
      total + Number(questao.points || 0),
    0
  )
})

function normalizarQuestao(questao, index) {
  const base = {
    id: index + 1,
    type: questao.type,
    points: Number(questao.points || 0),
    statement: questao.statement.trim()
  }

  if (questao.type === 'choice') {
    return {
      ...base,

      options: questao.options.map(
        (alternativa) => ({
          id: alternativa.id,
          text: alternativa.text.trim()
        })
      ),

      correct_option_id:
        questao.correct_option_id
    }
  }

  return {
    ...base,

    reference_answer:
      questao.reference_answer.trim(),

    rubric:
      questao.rubric.trim()
  }
}

const config = computed(() => ({
  questions: questoes.value.map(
    normalizarQuestao
  )
}))

watch(
  config,
  (novoConfig) => {
    emit('update:modelValue', novoConfig)
  },
  {
    deep: true,
    immediate: true
  }
)

function adicionarQuestao() {
  questoes.value.push(
    criarQuestao('choice')
  )
}

function removerQuestao(index) {
  if (questoes.value.length <= 1) {
    return
  }

  questoes.value.splice(index, 1)
}

function alterarTipoQuestao(questao) {
  if (questao.type === 'choice') {
    if (
      !Array.isArray(questao.options) ||
      questao.options.length < 2
    ) {
      questao.options = [
        {
          id: 'a',
          text: ''
        },
        {
          id: 'b',
          text: ''
        }
      ]
    }

    if (!questao.correct_option_id) {
      questao.correct_option_id =
        questao.options[0]?.id || 'a'
    }
  }
}

function adicionarAlternativa(questao) {
  if (questao.options.length >= 10) {
    return
  }

  const proximaLetra =
    letrasDisponiveis[
      questao.options.length
    ]

  questao.options.push({
    id: proximaLetra,
    text: ''
  })
}

function removerAlternativa(
  questao,
  alternativaId
) {
  if (questao.options.length <= 2) {
    return
  }

  questao.options =
    questao.options.filter(
      (alternativa) =>
        alternativa.id !== alternativaId
    )

  const corretaAindaExiste =
    questao.options.some(
      (alternativa) =>
        alternativa.id ===
        questao.correct_option_id
    )

  if (!corretaAindaExiste) {
    questao.correct_option_id =
      questao.options[0]?.id || null
  }
}
</script>

<template>
  <section class="questionnaire-form">
    <header class="questionnaire-form-header">
      <div>
        <span class="questionnaire-form-kicker">
          // QUESTIONÁRIO
        </span>

        <h2>Questões</h2>

        <p>
          Adicione e configure as perguntas que
          serão respondidas pelos alunos.
        </p>
      </div>

      <div class="questionnaire-summary">
        <div>
          <strong>
            {{ questoes.length }}
          </strong>

          <span>
            {{
              questoes.length === 1
                ? 'QUESTÃO'
                : 'QUESTÕES'
            }}
          </span>
        </div>

        <div>
          <strong>
            {{ totalPontos }}
          </strong>

          <span>PONTOS</span>
        </div>
      </div>
    </header>

    <div class="questionnaire-question-list">
      <article
        v-for="(questao, index) in questoes"
        :key="questao.id"
        class="questionnaire-question"
      >
        <header class="questionnaire-question-header">
          <div class="questionnaire-question-number">
            <span>
              QUESTÃO
              {{
                String(index + 1).padStart(
                  2,
                  '0'
                )
              }}
            </span>

            <Select
              v-model="questao.type"
              :options="tiposQuestao"
              option-label="label"
              option-value="value"
              class="questionnaire-type-select"
              @change="
                alterarTipoQuestao(questao)
              "
            />
          </div>

          <div class="questionnaire-question-actions">
            <div class="questionnaire-points">
              <label
                :for="`question-points-${index}`"
              >
                Pontos
              </label>

              <InputNumber
                :id="`question-points-${index}`"
                v-model="questao.points"
                :min="0"
                :max-fraction-digits="2"
                :use-grouping="false"
              />
            </div>

            <Button
              type="button"
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              aria-label="Remover questão"
              :disabled="
                questoes.length <= 1
              "
              @click="
                removerQuestao(index)
              "
            />
          </div>
        </header>

        <div class="questionnaire-field">
          <label
            :for="`statement-${index}`"
          >
            Enunciado

            <span aria-hidden="true">
              *
            </span>
          </label>

          <Textarea
            :id="`statement-${index}`"
            v-model="questao.statement"
            rows="4"
            auto-resize
            placeholder="Digite o enunciado da questão..."
          />
        </div>

        <div
          v-if="questao.type === 'choice'"
          class="questionnaire-options"
        >
          <div class="questionnaire-options-heading">
            <div>
              <h3>Alternativas</h3>

              <p>
                Marque a alternativa que será
                considerada correta.
              </p>
            </div>

            <Button
              type="button"
              label="Adicionar alternativa"
              severity="secondary"
              outlined
              :disabled="
                questao.options.length >= 10
              "
              @click="
                adicionarAlternativa(questao)
              "
            />
          </div>

          <div class="questionnaire-option-list">
            <div
              v-for="
                alternativa in questao.options
              "
              :key="alternativa.id"
              class="questionnaire-option"
            >
              <RadioButton
                v-model="
                  questao.correct_option_id
                "
                :input-id="
                  `q${index}-${alternativa.id}`
                "
                :name="
                  `correct-option-${index}`
                "
                :value="alternativa.id"
              />

              <label
                class="questionnaire-option-letter"
                :for="
                  `q${index}-${alternativa.id}`
                "
              >
                {{
                  alternativa.id.toUpperCase()
                }}
              </label>

              <InputText
                v-model="alternativa.text"
                :placeholder="
                  `Alternativa ${alternativa.id.toUpperCase()}`
                "
                class="questionnaire-option-input"
              />

              <Button
                type="button"
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                aria-label="Remover alternativa"
                :disabled="
                  questao.options.length <= 2
                "
                @click="
                  removerAlternativa(
                    questao,
                    alternativa.id
                  )
                "
              />
            </div>
          </div>

          <small class="questionnaire-help">
            A alternativa selecionada será usada
            como gabarito da questão.
          </small>
        </div>

        <div
          v-else-if="
            questao.type === 'open'
          "
          class="questionnaire-open-fields"
        >
          <div class="questionnaire-field">
            <label
              :for="
                `reference-answer-${index}`
              "
            >
              Resposta de referência

              <small>OPCIONAL</small>
            </label>

            <Textarea
              :id="
                `reference-answer-${index}`
              "
              v-model="
                questao.reference_answer
              "
              rows="4"
              auto-resize
              placeholder="Informe uma resposta esperada para auxiliar na correção..."
            />
          </div>

          <div class="questionnaire-field">
            <label
              :for="`rubric-${index}`"
            >
              Critérios de correção

              <small>OPCIONAL</small>
            </label>

            <Textarea
              :id="`rubric-${index}`"
              v-model="questao.rubric"
              rows="4"
              auto-resize
              placeholder="Ex.: considerar clareza, domínio do conceito e uso de exemplos..."
            />
          </div>

          <small class="questionnaire-help">
            Questões abertas precisam de revisão
            antes da liberação do resultado.
          </small>
        </div>
      </article>
    </div>

    <button
      type="button"
      class="questionnaire-add-question"
      @click="adicionarQuestao"
    >
      <span aria-hidden="true">
        +
      </span>

      Adicionar questão
    </button>
  </section>
</template>

<style scoped>
.questionnaire-form {
  width: 100%;
}

.questionnaire-form-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.questionnaire-form-kicker {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.questionnaire-form-header h2 {
  margin: 0;
  font-size: 1.6rem;
}

.questionnaire-form-header p {
  margin: 0.5rem 0 0;
  opacity: 0.7;
}

.questionnaire-summary {
  display: flex;
  gap: 1.5rem;
}

.questionnaire-summary > div {
  display: flex;
  min-width: 76px;
  flex-direction: column;
  align-items: flex-end;
}

.questionnaire-summary strong {
  font-size: 1.75rem;
}

.questionnaire-summary span {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  opacity: 0.65;
}

.questionnaire-question-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.questionnaire-question {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  background: var(--color-surface);
}

.questionnaire-question-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.questionnaire-question-number {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.questionnaire-question-number > span {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  opacity: 0.6;
}

.questionnaire-type-select {
  width: 220px;
}

.questionnaire-question-actions {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
}

.questionnaire-points {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.questionnaire-points label {
  font-size: 0.8rem;
  font-weight: 600;
}

.questionnaire-points :deep(.p-inputnumber) {
  width: 90px;
}

.questionnaire-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.questionnaire-field label {
  font-weight: 600;
}

.questionnaire-field label small {
  margin-left: 0.4rem;
  font-size: 0.65rem;
  letter-spacing: 0.06em;
  opacity: 0.55;
}

.questionnaire-field :deep(.p-textarea) {
  width: 100%;
}

.questionnaire-options {
  margin-top: 1.75rem;
}

.questionnaire-options-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.questionnaire-options-heading h3 {
  margin: 0;
  font-size: 1rem;
}

.questionnaire-options-heading p {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  opacity: 0.65;
}

.questionnaire-option-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.questionnaire-option {
  display: grid;
  grid-template-columns:
    auto
    32px
    minmax(0, 1fr)
    auto;
  align-items: center;
  gap: 0.75rem;
}

.questionnaire-option-letter {
  display: flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border-strong);
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.questionnaire-option-input {
  width: 100%;
}

.questionnaire-open-fields {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1.75rem;
}

.questionnaire-help {
  display: block;
  margin-top: 1rem;
  opacity: 0.65;
}

.questionnaire-add-question {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin-top: 1.5rem;
  padding: 1rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: 12px;
  background: transparent;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.questionnaire-add-question:hover {
  border-color: var(--color-primary);
  background: var(--color-surface-secondary);
}

.questionnaire-add-question span {
  font-size: 1.25rem;
}

@media (max-width: 700px) {
  .questionnaire-form-header,
  .questionnaire-question-header,
  .questionnaire-options-heading {
    flex-direction: column;
    align-items: stretch;
  }

  .questionnaire-summary {
    justify-content: flex-start;
  }

  .questionnaire-summary > div {
    align-items: flex-start;
  }

  .questionnaire-question-actions {
    justify-content: space-between;
  }

  .questionnaire-type-select {
    width: 100%;
  }
}


/* UX / THEME */
.questionnaire-form {
  color: var(--color-text);
}

.questionnaire-form-kicker,
.questionnaire-question-number > span {
  color: var(--color-primary);
  opacity: 1;
}

.questionnaire-form-header p,
.questionnaire-options-heading p,
.questionnaire-help {
  color: var(--color-text-secondary);
  opacity: 1;
}

.questionnaire-summary > div {
  min-width: 88px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 0.7rem 0.8rem;
  background: var(--color-surface-secondary);
}

.questionnaire-summary strong {
  color: var(--color-text);
}

.questionnaire-summary span {
  color: var(--color-text-muted);
  opacity: 1;
}

.questionnaire-question {
  position: relative;
  border-left: 3px solid var(--color-primary-border-soft);
  box-shadow: var(--shadow-sm);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.questionnaire-question:focus-within {
  border-color: var(--color-primary-border-medium);
  box-shadow: var(--shadow-md);
}

.questionnaire-option {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 0.55rem 0.65rem;
  background: var(--color-surface-secondary);
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease;
}

.questionnaire-option:focus-within {
  border-color: var(--color-primary-border-medium);
  background: var(--color-primary-soft);
}

.questionnaire-option-letter {
  border-color: var(--color-border-strong);
  color: var(--color-text-secondary);
  background: var(--color-surface);
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease;
}

.questionnaire-option-letter:hover {
  border-color: var(--color-primary);
  color: var(--color-link);
  background: var(--color-primary-soft);
}

.questionnaire-add-question {
  color: var(--color-text);
  background: var(--color-surface-secondary);
}

.questionnaire-add-question:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-link);
}

.questionnaire-add-question:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
}

.questionnaire-form :deep(.p-inputtext),
.questionnaire-form :deep(.p-textarea),
.questionnaire-form :deep(.p-select),
.questionnaire-form :deep(.p-inputnumber-input) {
  color: var(--color-text);
  background: var(--input-background);
  border-color: var(--input-border);
}

.questionnaire-form :deep(.p-inputtext:hover),
.questionnaire-form :deep(.p-textarea:hover),
.questionnaire-form :deep(.p-select:hover),
.questionnaire-form :deep(.p-inputnumber-input:hover) {
  border-color: var(--color-border-strong);
}

.questionnaire-form :deep(.p-inputtext:focus),
.questionnaire-form :deep(.p-textarea:focus),
.questionnaire-form :deep(.p-select.p-focus),
.questionnaire-form :deep(.p-inputnumber-input:focus) {
  border-color: var(--input-border-focus);
  box-shadow: 0 0 0 3px var(--color-primary-border-soft);
}

.questionnaire-form :deep(.p-button-danger) {
  color: var(--color-danger);
}

.questionnaire-form :deep(.p-button-danger:hover) {
  background: var(--color-danger-soft);
}

.questionnaire-form :deep(.p-button-secondary.p-button-outlined) {
  color: var(--color-text-secondary);
  border-color: var(--color-border-strong);
}

.questionnaire-form :deep(.p-button-secondary.p-button-outlined:hover) {
  color: var(--color-link);
  border-color: var(--color-primary-border-medium);
  background: var(--color-primary-soft);
}

</style>
