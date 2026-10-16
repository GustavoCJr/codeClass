<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

const props = defineProps({
  modelValue: { type: String, default: '' },
  language: { type: String, default: '' },
  readOnly: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])
const host = ref(null)
const pronto = ref(false)
const falhou = ref(false)
let editor = null
let monaco = null
let observer = null
let cancelado = false

function linguagemMonaco(nome) {
  const lang = String(nome || '').toLowerCase().trim()
  const alias = {
    'python3': 'python', 'py': 'python', 'node': 'javascript', 'nodejs': 'javascript',
    'js': 'javascript', 'ts': 'typescript', 'c++': 'cpp', 'cpp': 'cpp',
    'c#': 'csharp', 'csharp': 'csharp', 'golang': 'go', 'shell': 'shell',
    'bash': 'shell', 'sh': 'shell', 'postgresql': 'sql', 'plain': 'plaintext'
  }
  return alias[lang] || lang || 'plaintext'
}

function atualizarTema() {
  if (!monaco || !editor) return
  const escuro = document.documentElement.getAttribute('data-theme') === 'dark'
  monaco.editor.setTheme(escuro ? 'vs-dark' : 'vs')
}

onMounted(async () => {
  // Monaco só é carregado quando o editor de código realmente aparece.
  try {
    if (!window.MonacoEnvironment) {
      window.MonacoEnvironment = {
        getWorker(_moduleId, label) {
          if (label === 'json') return new JsonWorker()
          if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker()
          if (label === 'html' || label === 'handlebars' || label === 'razor') return new HtmlWorker()
          if (label === 'typescript' || label === 'javascript') return new TsWorker()
          return new EditorWorker()
        }
      }
    }
    const modulo = await import('monaco-editor')
    if (cancelado || !host.value) return
    monaco = modulo
    editor = monaco.editor.create(host.value, {
      value: props.modelValue,
      language: linguagemMonaco(props.language),
      theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'vs-dark' : 'vs',
      readOnly: props.readOnly || props.disabled,
      domReadOnly: props.readOnly || props.disabled,
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontFamily: '"IBM Plex Mono", Consolas, monospace',
      fontSize: 14,
      tabSize: 4,
      wordWrap: 'on',
      accessibilitySupport: 'auto'
    })
    editor.onDidChangeModelContent(() => {
      const valor = editor.getValue()
      if (valor !== props.modelValue) emit('update:modelValue', valor)
    })
    observer = new MutationObserver(atualizarTema)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    pronto.value = true
  } catch (error) {
    console.error('Não foi possível iniciar Monaco Editor. Editor simples disponível.', error)
    falhou.value = true
  }
})

watch(() => props.modelValue, valor => {
  if (editor && valor !== editor.getValue()) editor.setValue(valor ?? '')
})
watch(() => props.language, valor => {
  if (editor && monaco) monaco.editor.setModelLanguage(editor.getModel(), linguagemMonaco(valor))
})
watch(() => [props.readOnly, props.disabled], () => {
  editor?.updateOptions({ readOnly: props.readOnly || props.disabled, domReadOnly: props.readOnly || props.disabled })
})

onBeforeUnmount(() => {
  cancelado = true
  observer?.disconnect()
  editor?.dispose()
})
</script>

<template>
  <div class="codeclass-monaco-wrapper">
    <div ref="host" class="codeclass-monaco-host" :class="{ 'codeclass-monaco-host--loading': !pronto }" aria-label="Editor de código" />
    <div v-if="!pronto" class="codeclass-monaco-fallback">
      <p v-if="!falhou" role="status">Carregando editor de código...</p>
      <p v-else role="status">O editor avançado não carregou. Você pode continuar usando o editor simples.</p>
      <textarea
        :value="modelValue"
        class="student-open-answer student-code-editor"
        rows="18"
        aria-label="Código-fonte"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        autocorrect="off"
        :readonly="readOnly || disabled"
        @input="emit('update:modelValue', $event.target.value)"
      />
    </div>
  </div>
</template>

<style scoped>
.codeclass-monaco-wrapper { width: 100%; min-width: 0; }
.codeclass-monaco-host { height: min(58vh, 540px); min-height: 320px; border: 1px solid var(--color-border-strong); border-radius: 8px; overflow: hidden; }
.codeclass-monaco-host--loading { display: none; }
.codeclass-monaco-fallback p { color: var(--color-text-secondary); }
.codeclass-monaco-fallback textarea { width: 100%; box-sizing: border-box; }
@media (max-width: 650px) { .codeclass-monaco-host { min-height: 260px; height: 52vh; } }
</style>
