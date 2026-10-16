<script setup>
import { computed, ref, watch } from 'vue'

import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'

const emit = defineEmits([
  'update:modelValue'
])
const props = defineProps({ initialConfig: { type: Object, default: null } })

const linguagensDisponiveis = [
  { label: 'Python 3', value: 'python3' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'C', value: 'c' },
  { label: 'C++', value: 'cpp' },
  { label: 'Java', value: 'java' },
  { label: 'C#', value: 'csharp' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' }
]

let proximoUid = 1

function gerarUid() {
  const uid = proximoUid
  proximoUid += 1
  return uid
}

function criarLinguagem(nome = 'python3') {
  return {
    uid: gerarUid(),
    name: nome,
    starter_code: ''
  }
}

function criarCasoTeste() {
  return {
    uid: gerarUid(),
    input: '',
    expected_output: ''
  }
}

const linguagens = ref([
  criarLinguagem()
])

const limiteTempo = ref(2)
const limiteMemoria = ref(128)
const rubrica = ref('')

const casosTeste = ref([
  criarCasoTeste()
])
if (props.initialConfig) {
  linguagens.value = props.initialConfig.languages.map(item => ({ ...item, uid: gerarUid() }))
  limiteTempo.value = props.initialConfig.time_limit_sec
  limiteMemoria.value = props.initialConfig.memory_limit_mb
  rubrica.value = props.initialConfig.rubric || ''
  casosTeste.value = props.initialConfig.test_cases.map(item => ({ ...item, uid: gerarUid() }))
}

const podeAdicionarLinguagem = computed(() => {
  return linguagens.value.length < linguagensDisponiveis.length
})

function opcoesParaLinguagem(linguagemAtual) {
  const usadas = new Set(
    linguagens.value
      .filter((linguagem) => linguagem.uid !== linguagemAtual.uid)
      .map((linguagem) => linguagem.name)
  )

  return linguagensDisponiveis.map((opcao) => ({
    ...opcao,
    disabled: usadas.has(opcao.value)
  }))
}

function adicionarLinguagem() {
  if (!podeAdicionarLinguagem.value) {
    return
  }

  const usadas = new Set(
    linguagens.value.map((linguagem) => linguagem.name)
  )

  const proxima = linguagensDisponiveis.find(
    (opcao) => !usadas.has(opcao.value)
  )

  if (!proxima) {
    return
  }

  linguagens.value.push(
    criarLinguagem(proxima.value)
  )
}

function removerLinguagem(index) {
  if (linguagens.value.length <= 1) {
    return
  }

  linguagens.value.splice(index, 1)
}

function adicionarCasoTeste() {
  casosTeste.value.push(
    criarCasoTeste()
  )
}

function removerCasoTeste(index) {
  casosTeste.value.splice(index, 1)
}

const config = computed(() => ({
  languages: linguagens.value.map((linguagem) => ({
    name: linguagem.name.trim(),
    starter_code: linguagem.starter_code
  })),

  time_limit_sec: Number(limiteTempo.value),
  memory_limit_mb: Number(limiteMemoria.value),

  rubric: rubrica.value.trim(),

  test_cases: casosTeste.value.map((caso, index) => ({
    id: index + 1,
    input: caso.input,
    expected_output: caso.expected_output
  }))
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
</script>

<template>
  <section class="code-assignment-form">
    <header class="code-assignment-header">
      <div>
        <span class="code-assignment-kicker">
          // ATIVIDADE DE CÓDIGO
        </span>

        <h2>Configuração do exercício</h2>

        <p>
          Configure as linguagens disponíveis, limites de execução
          e os casos de teste da atividade.
        </p>
      </div>
    </header>

    <div class="code-assignment-section">
      <div class="code-assignment-section-heading">
        <div>
          <h3>Linguagens</h3>

          <p>
            Escolha em quais linguagens o aluno poderá entregar a solução.
          </p>
        </div>

        <Button
          type="button"
          label="Adicionar linguagem"
          severity="secondary"
          outlined
          :disabled="!podeAdicionarLinguagem"
          @click="adicionarLinguagem"
        />
      </div>

      <div class="code-language-list">
        <article
          v-for="(linguagem, index) in linguagens"
          :key="linguagem.uid"
          class="code-language-card"
        >
          <header class="code-language-card-header">
            <strong>
              Linguagem {{ String(index + 1).padStart(2, '0') }}
            </strong>

            <Button
              type="button"
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              aria-label="Remover linguagem"
              :disabled="linguagens.length <= 1"
              @click="removerLinguagem(index)"
            />
          </header>

          <div class="code-field">
            <label :for="`language-${linguagem.uid}`">
              Linguagem
              <span aria-hidden="true">*</span>
            </label>

            <Select
              :id="`language-${linguagem.uid}`"
              v-model="linguagem.name"
              :options="opcoesParaLinguagem(linguagem)"
              option-label="label"
              option-value="value"
              option-disabled="disabled"
              style="width: 100%"
            />
          </div>

          <div class="code-field">
            <label :for="`starter-code-${linguagem.uid}`">
              Código inicial
              <small>OPCIONAL</small>
            </label>

            <Textarea
              :id="`starter-code-${linguagem.uid}`"
              v-model="linguagem.starter_code"
              rows="8"
              auto-resize
              placeholder="Código que aparecerá inicialmente para o aluno..."
              class="code-textarea"
            />
          </div>
        </article>
      </div>
    </div>

    <div class="code-assignment-section">
      <div class="code-assignment-section-heading">
        <div>
          <h3>Limites de execução</h3>

          <p>
            Defina os limites usados durante a execução do código.
          </p>
        </div>
      </div>

      <div class="code-limits-grid">
        <div class="code-field">
          <label for="time-limit">
            Tempo máximo
          </label>

          <div class="code-number-field">
            <InputNumber
              id="time-limit"
              v-model="limiteTempo"
              :min="0.01"
              :max="60"
              :max-fraction-digits="2"
              :use-grouping="false"
            />

            <span>segundos</span>
          </div>

          <small>
            Valor maior que 0 e no máximo 60 segundos.
          </small>
        </div>

        <div class="code-field">
          <label for="memory-limit">
            Memória máxima
          </label>

          <div class="code-number-field">
            <InputNumber
              id="memory-limit"
              v-model="limiteMemoria"
              :min="1"
              :max="1024"
              :max-fraction-digits="0"
              :use-grouping="false"
            />

            <span>MB</span>
          </div>

          <small>
            Valor entre 1 e 1024 MB.
          </small>
        </div>
      </div>
    </div>

    <div class="code-assignment-section">
      <div class="code-field">
        <label for="code-rubric">
          Critérios de correção
          <small>OPCIONAL</small>
        </label>

        <Textarea
          id="code-rubric"
          v-model="rubrica"
          rows="5"
          auto-resize
          placeholder="Ex.: considerar organização, clareza, eficiência e uso correto dos conceitos..."
          class="code-textarea"
        />
      </div>
    </div>

    <div class="code-assignment-section">
      <div class="code-assignment-section-heading">
        <div>
          <h3>Casos de teste</h3>

          <p>
            Informe entradas e saídas esperadas para validar a solução.
            Os casos de teste são opcionais.
          </p>
        </div>

        <Button
          type="button"
          label="Adicionar caso de teste"
          severity="secondary"
          outlined
          @click="adicionarCasoTeste"
        />
      </div>

      <div
        v-if="casosTeste.length"
        class="code-test-list"
      >
        <article
          v-for="(caso, index) in casosTeste"
          :key="caso.uid"
          class="code-test-card"
        >
          <header class="code-test-card-header">
            <div>
              <span>
                CASO DE TESTE
                {{ String(index + 1).padStart(2, '0') }}
              </span>
            </div>

            <Button
              type="button"
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              aria-label="Remover caso de teste"
              @click="removerCasoTeste(index)"
            />
          </header>

          <div class="code-test-grid">
            <div class="code-field">
              <label :for="`test-input-${caso.uid}`">
                Entrada
              </label>

              <Textarea
                :id="`test-input-${caso.uid}`"
                v-model="caso.input"
                rows="5"
                auto-resize
                placeholder="Ex.: 2 3"
                class="code-textarea"
              />
            </div>

            <div class="code-field">
              <label :for="`test-output-${caso.uid}`">
                Saída esperada
              </label>

              <Textarea
                :id="`test-output-${caso.uid}`"
                v-model="caso.expected_output"
                rows="5"
                auto-resize
                placeholder="Ex.: 5"
                class="code-textarea"
              />
            </div>
          </div>
        </article>
      </div>

      <div
        v-else
        class="code-empty-tests"
      >
        Nenhum caso de teste adicionado.
      </div>
    </div>
  </section>
</template>

<style scoped>
.code-assignment-form {
  width: 100%;
}

.code-assignment-header {
  margin-bottom: 1.5rem;
}

.code-assignment-kicker {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.code-assignment-header h2 {
  margin: 0;
  font-size: 1.6rem;
}

.code-assignment-header p {
  margin: 0.5rem 0 0;
  max-width: 720px;
  opacity: 0.7;
}

.code-assignment-section {
  margin-top: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  background: var(--color-surface);
}

.code-assignment-section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.code-assignment-section-heading h3 {
  margin: 0;
  font-size: 1rem;
}

.code-assignment-section-heading p {
  margin: 0.3rem 0 0;
  font-size: 0.85rem;
  opacity: 0.65;
}

.code-language-list,
.code-test-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.code-language-card,
.code-test-card {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1.25rem;
}

.code-language-card-header,
.code-test-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.code-test-card-header span {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  opacity: 0.6;
}

.code-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.code-field + .code-field {
  margin-top: 1rem;
}

.code-field label {
  font-weight: 600;
}

.code-field label small {
  margin-left: 0.4rem;
  font-size: 0.65rem;
  letter-spacing: 0.06em;
  opacity: 0.55;
}

.code-field > small {
  opacity: 0.65;
}

.code-textarea {
  width: 100%;
  font-family: 'IBM Plex Mono', monospace;
}

.code-limits-grid,
.code-test-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;
}

.code-number-field {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.code-number-field :deep(.p-inputnumber) {
  width: 140px;
}

.code-number-field span {
  font-size: 0.85rem;
  opacity: 0.7;
}

.code-empty-tests {
  padding: 1rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: 10px;
  text-align: center;
  opacity: 0.65;
}

@media (max-width: 760px) {
  .code-assignment-section-heading {
    flex-direction: column;
    align-items: stretch;
  }

  .code-limits-grid,
  .code-test-grid {
    grid-template-columns: 1fr;
  }
}


/* UX / THEME */
.code-assignment-form {
  color: var(--color-text);
}

.code-assignment-kicker,
.code-test-card-header span {
  color: var(--color-primary);
  opacity: 1;
}

.code-assignment-header p,
.code-assignment-section-heading p,
.code-field > small {
  color: var(--color-text-secondary);
  opacity: 1;
}

.code-assignment-section {
  box-shadow: var(--shadow-sm);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.code-assignment-section:focus-within {
  border-color: var(--color-primary-border-medium);
  box-shadow: var(--shadow-md);
}

.code-language-card,
.code-test-card {
  background: var(--color-surface-secondary);
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease;
}

.code-language-card:focus-within,
.code-test-card:focus-within {
  border-color: var(--color-primary-border-medium);
  background: var(--color-primary-soft);
}

.code-empty-tests {
  color: var(--color-text-secondary);
  background: var(--color-surface-secondary);
}

.code-assignment-form :deep(.p-inputtext),
.code-assignment-form :deep(.p-textarea),
.code-assignment-form :deep(.p-inputnumber-input) {
  color: var(--color-text);
  background: var(--input-background);
  border-color: var(--input-border);
}

.code-assignment-form :deep(.p-inputtext:hover),
.code-assignment-form :deep(.p-textarea:hover),
.code-assignment-form :deep(.p-inputnumber-input:hover) {
  border-color: var(--color-border-strong);
}

.code-assignment-form :deep(.p-inputtext:focus),
.code-assignment-form :deep(.p-textarea:focus),
.code-assignment-form :deep(.p-inputnumber-input:focus) {
  border-color: var(--input-border-focus);
  box-shadow: 0 0 0 3px var(--color-primary-border-soft);
}

.code-assignment-form :deep(.p-button-danger) {
  color: var(--color-danger);
}

.code-assignment-form :deep(.p-button-danger:hover) {
  background: var(--color-danger-soft);
}

.code-assignment-form :deep(.p-button-secondary.p-button-outlined) {
  color: var(--color-text-secondary);
  border-color: var(--color-border-strong);
}

.code-assignment-form :deep(.p-button-secondary.p-button-outlined:hover) {
  color: var(--color-link);
  border-color: var(--color-primary-border-medium);
  background: var(--color-primary-soft);
}

</style>
