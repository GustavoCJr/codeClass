<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import {
  Download, File, FilePdf, FileWord, FolderOpen, Search,
  Spinner, Sync, Trash, Upload, Times, ExclamationTriangle
} from '@primeicons/vue'
import {
  listarMateriais, enviarMaterial, obterLinkMaterial, excluirMaterial
} from '../../pages/sala/materiaisService'
import {
  arquivoExistente, categoriaMaterial, nomeMaterial, ordenarMateriais,
  tamanhoMaterial, validarArquivoMaterial, validarUrlMaterial
} from '../../pages/sala/materiaisUtils'
import './classroomMaterials.css'

const props = defineProps({
  classroomId: { type: String, required: true },
  canManage: { type: Boolean, default: false }
})

const materiais = ref([])
const carregando = ref(true)
const erroLista = ref('')
const erroAcao = ref('')
const sucesso = ref('')
const busca = ref('')
const enviando = ref(false)
const removendoNome = ref('')
const baixandoNome = ref('')
const arquivoSelecionado = ref(null)
const confirmarSubstituicao = ref(false)
const confirmandoExclusao = ref('')
const linkAlternativo = ref('')
const inputArquivo = ref(null)
let vivo = true

const ocupado = computed(() => enviando.value || Boolean(removendoNome.value))
const materiaisOrdenados = computed(() => ordenarMateriais(materiais.value))
const materiaisFiltrados = computed(() => {
  const termo = String(busca.value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  if (!termo) return materiaisOrdenados.value
  return materiaisOrdenados.value.filter((item) =>
    `${item.file_name} ${categoriaMaterial(item)}`.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(termo)
  )
})

function dataMaterial(data) {
  if (!data) return 'Data indisponível'
  const horario = new Date(data)
  if (Number.isNaN(horario.getTime())) return 'Data indisponível'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(horario)
}
function iconeArquivo(item) {
  const categoria = categoriaMaterial(item)
  return categoria === 'PDF' ? FilePdf : categoria === 'Documento' ? FileWord : File
}
function limparAvisos() {
  erroAcao.value = ''
  sucesso.value = ''
  linkAlternativo.value = ''
}
async function atualizarLista({ inicial = false } = {}) {
  if (inicial) carregando.value = true
  erroLista.value = ''
  try {
    const resposta = await listarMateriais(props.classroomId)
    if (!vivo) return false
    if (!Array.isArray(resposta)) throw new Error('A lista de materiais retornou um formato inesperado.')
    materiais.value = resposta
    return true
  } catch (error) {
    if (vivo) erroLista.value = error?.message || 'Não foi possível consultar os materiais.'
    return false
  } finally {
    if (vivo) carregando.value = false
  }
}
function abrirSeletor() {
  if (!props.canManage || ocupado.value || erroLista.value || carregando.value) return
  inputArquivo.value?.click()
}
function cancelarSubstituicao() {
  arquivoSelecionado.value = null
  confirmarSubstituicao.value = false
}
async function selecionarArquivo(evento) {
  if (!props.canManage || ocupado.value) return
  const arquivo = evento.target.files?.[0]
  // Permite selecionar o mesmo arquivo novamente após cancelar ou enviar.
  evento.target.value = ''
  limparAvisos()
  cancelarSubstituicao()
  if (!arquivo) return
  const erroValidacao = validarArquivoMaterial(arquivo)
  if (erroValidacao) {
    erroAcao.value = erroValidacao
    return
  }
  arquivoSelecionado.value = arquivo
  if (arquivoExistente(materiais.value, nomeMaterial(arquivo.name))) {
    confirmarSubstituicao.value = true
    return
  }
  await confirmarEnvio()
}
async function confirmarEnvio() {
  if (!props.canManage || !arquivoSelecionado.value || ocupado.value) return
  limparAvisos()
  const arquivo = arquivoSelecionado.value
  const nome = nomeMaterial(arquivo.name)
  confirmarSubstituicao.value = false
  enviando.value = true
  try {
    await enviarMaterial(props.classroomId, arquivo)
    if (!vivo) return
    cancelarSubstituicao()
    const atualizado = await atualizarLista()
    if (vivo) {
      sucesso.value = atualizado
        ? `Material "${nome}" enviado com sucesso.`
        : `Material "${nome}" enviado, mas não foi possível atualizar a lista. Tente recarregar.`
    }
  } catch (error) {
    if (vivo) erroAcao.value = error?.message || 'Não foi possível enviar o arquivo.'
  } finally {
    if (vivo) enviando.value = false
  }
}
function pedirExclusao(nome) {
  if (!props.canManage || ocupado.value) return
  limparAvisos()
  confirmandoExclusao.value = nome
}
async function confirmarExclusao(nome) {
  if (!props.canManage || ocupado.value || confirmandoExclusao.value !== nome) return
  limparAvisos()
  removendoNome.value = nome
  try {
    await excluirMaterial(props.classroomId, nome)
    if (!vivo) return
    confirmandoExclusao.value = ''
    materiais.value = materiais.value.filter((item) => item.file_name !== nome)
    sucesso.value = `Material "${nome}" excluído.`
  } catch (error) {
    if (vivo) erroAcao.value = error?.message || 'Não foi possível excluir o arquivo.'
  } finally {
    if (vivo) removendoNome.value = ''
  }
}
async function baixarMaterial(nome) {
  if (baixandoNome.value) return
  limparAvisos()
  baixandoNome.value = nome
  // A abertura ocorre no clique para evitar o bloqueador de pop-ups após o await.
  const janela = window.open('about:blank', '_blank')
  try {
    const dados = await obterLinkMaterial(props.classroomId, nome)
    if (!vivo) { janela?.close(); return }
    const url = validarUrlMaterial(dados?.download_url)
    if (!url) throw new Error('O servidor não retornou um link válido para este material.')
    if (janela && !janela.closed) {
      janela.opener = null
      janela.location.replace(url)
    } else {
      // Em navegadores que bloqueiam novas abas, o usuário abre o link manualmente.
      linkAlternativo.value = url
    }
  } catch (error) {
    janela?.close()
    if (vivo) erroAcao.value = error?.message || 'Não foi possível abrir o material.'
  } finally {
    if (vivo) baixandoNome.value = ''
  }
}

onMounted(() => atualizarLista({ inicial: true }))
onBeforeUnmount(() => { vivo = false })
</script>

<template>
  <div class="cc-materials" aria-label="Materiais de aula">
    <header class="cc-materials-header">
      <div>
        <span class="cc-materials-eyebrow">// BIBLIOTECA DA TURMA</span>
        <h2>Materiais de aula</h2>
        <p>Arquivos compartilhados com os participantes desta sala.</p>
      </div>
      <button v-if="canManage" type="button" class="cc-materials-upload" :disabled="ocupado || carregando || !!erroLista" @click="abrirSeletor">
        <Spinner v-if="enviando" :size="17" class="cc-materials-spin" aria-hidden="true" />
        <Upload v-else :size="17" aria-hidden="true" />
        {{ enviando ? 'Enviando...' : 'Enviar arquivo' }}
      </button>
      <input v-if="canManage" ref="inputArquivo" class="cc-materials-file-input" type="file" aria-label="Selecionar material para enviar" :disabled="ocupado" @change="selecionarArquivo" />
    </header>

    <div v-if="canManage" class="cc-materials-hint">Tamanho máximo: 30 MB por arquivo. Um novo envio com o mesmo nome substitui o anterior.</div>

    <div v-if="confirmarSubstituicao && arquivoSelecionado" class="cc-materials-confirm" role="alert">
      <ExclamationTriangle :size="20" aria-hidden="true" />
      <div class="cc-materials-confirm-copy">
        <strong>Já existe um arquivo com esse nome.</strong>
        <p>Deseja substituir “{{ nomeMaterial(arquivoSelecionado.name) }}”? Os alunos passarão a acessar a nova versão.</p>
        <div class="cc-materials-actions">
          <button type="button" class="cc-materials-danger" :disabled="ocupado" @click="confirmarEnvio">Sim, substituir</button>
          <button type="button" class="cc-materials-plain" @click="cancelarSubstituicao">Cancelar</button>
        </div>
      </div>
    </div>

    <p v-if="erroAcao" class="cc-materials-feedback cc-materials-feedback--error" role="alert">{{ erroAcao }}</p>
    <p v-if="sucesso" class="cc-materials-feedback cc-materials-feedback--success" role="status">{{ sucesso }}</p>
    <p v-if="linkAlternativo" class="cc-materials-feedback" role="status">
      Seu navegador bloqueou a nova aba.
      <a :href="linkAlternativo" target="_blank" rel="noopener noreferrer">Abrir material manualmente</a>
    </p>

    <div class="cc-materials-toolbar">
      <span class="cc-materials-count">{{ materiais.length }} {{ materiais.length === 1 ? 'arquivo' : 'arquivos' }}</span>
      <label class="cc-materials-search">
        <Search :size="16" aria-hidden="true" />
        <span class="cc-materials-sr-only">Pesquisar materiais</span>
        <input v-model="busca" type="search" placeholder="Buscar material..." :disabled="carregando" />
      </label>
      <button type="button" class="cc-materials-refresh" :disabled="carregando || ocupado" title="Atualizar materiais" aria-label="Atualizar materiais" @click="atualizarLista()">
        <Sync :size="16" aria-hidden="true" />
      </button>
    </div>

    <div v-if="carregando" class="cc-materials-state" role="status">
      <Spinner :size="22" class="cc-materials-spin" aria-hidden="true" /> Carregando materiais...
    </div>
    <div v-else-if="erroLista" class="cc-materials-state cc-materials-state--error" role="alert">
      <ExclamationTriangle :size="22" aria-hidden="true" />
      <p>{{ erroLista }}</p>
      <button type="button" class="cc-materials-plain" @click="atualizarLista()">Tentar novamente</button>
    </div>
    <div v-else-if="!materiais.length" class="cc-materials-state">
      <FolderOpen :size="32" aria-hidden="true" />
      <h3>Nenhum material disponível</h3>
      <p>{{ canManage ? 'Envie o primeiro arquivo para compartilhar com a turma.' : 'O professor ainda não compartilhou materiais nesta sala.' }}</p>
    </div>
    <div v-else-if="!materiaisFiltrados.length" class="cc-materials-state">
      <Search :size="28" aria-hidden="true" />
      <h3>Nenhum resultado</h3>
      <p>Tente pesquisar usando outro nome ou tipo de arquivo.</p>
    </div>
    <ul v-else class="cc-materials-list" aria-label="Arquivos disponíveis">
      <li v-for="item in materiaisFiltrados" :key="item.file_name" class="cc-materials-card">
        <div class="cc-materials-card-row">
          <span class="cc-materials-file-icon"><component :is="iconeArquivo(item)" :size="23" aria-hidden="true" /></span>
          <div class="cc-materials-info">
            <strong :title="item.file_name">{{ item.file_name }}</strong>
            <span>{{ categoriaMaterial(item) }} · {{ tamanhoMaterial(item.size_bytes) }} · {{ dataMaterial(item.uploaded_at) }}</span>
          </div>
          <div class="cc-materials-card-actions">
            <button type="button" class="cc-materials-open" :disabled="!!baixandoNome" :aria-label="`Abrir ou baixar ${item.file_name}`" @click="baixarMaterial(item.file_name)">
              <Spinner v-if="baixandoNome === item.file_name" :size="16" class="cc-materials-spin" aria-hidden="true" />
              <Download v-else :size="16" aria-hidden="true" />
              <span>{{ baixandoNome === item.file_name ? 'Abrindo...' : 'Abrir / baixar' }}</span>
            </button>
            <button v-if="canManage" type="button" class="cc-materials-remove" :disabled="ocupado" :aria-label="`Excluir ${item.file_name}`" title="Excluir arquivo" @click="pedirExclusao(item.file_name)">
              <Trash :size="17" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div v-if="confirmandoExclusao === item.file_name" class="cc-materials-remove-confirm">
          <span>Excluir “{{ item.file_name }}” para todos da sala?</span>
          <div class="cc-materials-actions">
            <button type="button" class="cc-materials-danger" :disabled="ocupado" @click="confirmarExclusao(item.file_name)">Excluir</button>
            <button type="button" class="cc-materials-plain" :disabled="ocupado" @click="confirmandoExclusao = ''"><Times :size="13" aria-hidden="true" /> Cancelar</button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
