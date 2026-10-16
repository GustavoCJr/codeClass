<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Comments, Send, Pencil, Trash, ChevronUp, Check, Times, Refresh, Wifi, ExclamationTriangle, User, ArrowDown } from '@primeicons/vue'
import { buscarMensagens, enviarMensagem, editarMensagem, excluirMensagem } from '../../pages/sala/chatService'
import { criarConexaoChat } from '../../pages/sala/chatSocket'
import {
  CHAT_CONTENT_MAX,
  CHAT_PAGE_SIZE,
  mesclarMensagens,
  marcarMensagemExcluida,
  podeEditarMensagem,
  podeExcluirMensagem,
  processarEventoChat
} from '../../pages/sala/chatUtils'
import './classroomChat.css'

const props = defineProps({
  classroomId: { type: String, required: true },
  classroomName: { type: String, default: '' },
  userId: { type: String, required: true },
  isModerator: { type: Boolean, default: false }
})

const mensagens = ref([])
const carregando = ref(true)
const carregandoAnteriores = ref(false)
const existeHistoricoAnterior = ref(false)
const erro = ref('')
const erroAcao = ref('')
const texto = ref('')
const enviando = ref(false)
const statusSocket = ref('connecting')
const edicaoId = ref(null)
const edicaoTexto = ref('')
const salvandoId = ref(null)
const confirmacaoId = ref(null)
const excluindoId = ref(null)
const listaEl = ref(null)
const mensagensNaoVistas = ref(0)
const agora = ref(Date.now())

let pararSocket = null
let timerRelogio = null
let vivo = true
let sequencia = 0

const podeEnviar = computed(() => !carregando.value && !enviando.value &&
  texto.value.trim().length > 0 && texto.value.trim().length <= CHAT_CONTENT_MAX)
const statusDescricao = computed(() => ({
  connected: 'Conectado em tempo real',
  connecting: 'Conectando ao chat...',
  reconnecting: 'Reconectando...',
  'auth-error': 'Conexão em tempo real indisponível'
})[statusSocket.value] || 'Conectando...')

function nomeRemetente(msg) { return msg.sender?.full_name || 'Participante' }
function iniciais(nome) {
  const partes = String(nome || '').trim().split(/\s+/).filter(Boolean)
  return partes.slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || '?'
}
function papel(msg) {
  return ({ teacher: 'Professor', student: 'Aluno', owner: 'Owner', admin: 'Admin' })[msg.sender?.role] || 'Participante'
}
function formatarData(data) {
  const valor = new Date(data)
  if (Number.isNaN(valor.getTime())) return 'Horário indisponível'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(valor)
}
function pertoDoFim() {
  const el = listaEl.value
  return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 110
}
async function rolarAoFim() {
  await nextTick()
  if (listaEl.value) listaEl.value.scrollTop = listaEl.value.scrollHeight
  mensagensNaoVistas.value = 0
}
function conferirRolagem() {
  if (pertoDoFim()) mensagensNaoVistas.value = 0
}
function receberEvento(evento) {
  const finalDaLista = pertoDoFim()
  const quantidadeAntes = mensagens.value.length
  mensagens.value = processarEventoChat(mensagens.value, evento, props.classroomId)
  if (evento?.type === 'new_message' && mensagens.value.length > quantidadeAntes) {
    if (finalDaLista || evento.data?.sender?.id === props.userId) rolarAoFim()
    else mensagensNaoVistas.value += 1
  }
}
async function carregarRecentes({ inicial = false } = {}) {
  const idCarga = ++sequencia
  if (inicial) carregando.value = true
  erro.value = ''
  try {
    const response = await buscarMensagens(props.classroomId, { limit: CHAT_PAGE_SIZE })
    if (!vivo || idCarga !== sequencia) return
    mensagens.value = mesclarMensagens(mensagens.value, Array.isArray(response) ? response : [])
    existeHistoricoAnterior.value = Array.isArray(response) && response.length === CHAT_PAGE_SIZE
    if (inicial) await rolarAoFim()
  } catch (e) {
    if (!vivo || idCarga !== sequencia) return
    erro.value = e?.message || 'Não foi possível carregar o histórico do chat.'
  } finally {
    if (vivo && idCarga === sequencia) carregando.value = false
  }
}
async function carregarAnteriores() {
  const primeiro = mensagens.value[0]
  if (!primeiro || !existeHistoricoAnterior.value || carregandoAnteriores.value) return
  carregandoAnteriores.value = true
  erro.value = ''
  const el = listaEl.value
  const alturaAnterior = el?.scrollHeight || 0
  const scrollAnterior = el?.scrollTop || 0
  try {
    const response = await buscarMensagens(props.classroomId, { limit: CHAT_PAGE_SIZE, before: primeiro.created_at })
    if (!vivo) return
    mensagens.value = mesclarMensagens(mensagens.value, Array.isArray(response) ? response : [])
    existeHistoricoAnterior.value = Array.isArray(response) && response.length === CHAT_PAGE_SIZE
    await nextTick()
    if (el) el.scrollTop = el.scrollHeight - alturaAnterior + scrollAnterior
  } catch (e) {
    if (vivo) erro.value = e?.message || 'Falha ao carregar mensagens anteriores.'
  } finally {
    if (vivo) carregandoAnteriores.value = false
  }
}
async function enviar() {
  const content = texto.value.trim()
  if (!podeEnviar.value) return
  enviando.value = true
  erroAcao.value = ''
  try {
    const mensagem = await enviarMensagem(props.classroomId, content)
    if (!vivo) return
    mensagens.value = mesclarMensagens(mensagens.value, [mensagem])
    texto.value = ''
    await rolarAoFim()
  } catch (e) {
    if (vivo) erroAcao.value = e?.message || 'Não foi possível enviar a mensagem.'
  } finally {
    if (vivo) enviando.value = false
  }
}
function iniciarEdicao(msg) {
  edicaoId.value = msg.id
  edicaoTexto.value = msg.content
  confirmacaoId.value = null
  erroAcao.value = ''
}
function cancelarEdicao() { edicaoId.value = null; edicaoTexto.value = '' }
async function salvarEdicao(msg) {
  const content = edicaoTexto.value.trim()
  if (!content || content.length > CHAT_CONTENT_MAX || salvandoId.value) return
  salvandoId.value = msg.id
  erroAcao.value = ''
  try {
    const editada = await editarMensagem(props.classroomId, msg.id, content)
    if (!vivo) return
    mensagens.value = mesclarMensagens(mensagens.value, [editada])
    cancelarEdicao()
  } catch (e) {
    if (vivo) erroAcao.value = e?.message || 'Não foi possível editar a mensagem.'
  } finally {
    if (vivo) salvandoId.value = null
  }
}
async function removerMensagem(msg) {
  if (excluindoId.value) return
  excluindoId.value = msg.id
  erroAcao.value = ''
  try {
    await excluirMensagem(props.classroomId, msg.id)
    if (!vivo) return
    mensagens.value = marcarMensagemExcluida(mensagens.value, msg.id)
    confirmacaoId.value = null
  } catch (e) {
    if (vivo) erroAcao.value = e?.message || 'Não foi possível remover a mensagem.'
  } finally {
    if (vivo) excluindoId.value = null
  }
}
function teclasMensagem(evento) {
  if (evento.key === 'Enter' && !evento.shiftKey && !evento.isComposing) {
    evento.preventDefault()
    enviar()
  }
}

onMounted(() => {
  vivo = true
  carregarRecentes({ inicial: true })
  pararSocket = criarConexaoChat({
    classroomId: props.classroomId,
    onEvent: receberEvento,
    onStatus: status => { if (vivo) statusSocket.value = status },
    onOpen: reconectou => { if (reconectou && vivo) carregarRecentes() }
  })
  timerRelogio = window.setInterval(() => { agora.value = Date.now() }, 30000)
})
onBeforeUnmount(() => {
  vivo = false
  sequencia += 1
  pararSocket?.()
  if (timerRelogio) window.clearInterval(timerRelogio)
})
</script>

<template>
  <section class="cc-chat" aria-label="Chat da turma">
    <div class="cc-chat-head">
      <div class="cc-chat-heading">
        <span class="cc-chat-symbol"><Comments :size="22" aria-hidden="true" /></span>
        <div>
          <span class="cc-chat-kicker">// CONVERSA DA TURMA</span>
          <h2>Chat da sala</h2>
          <p>{{ classroomName || 'Mensagens da sua turma' }}</p>
        </div>
      </div>
      <div class="cc-chat-connection" :class="`cc-chat-connection--${statusSocket}`" :title="statusDescricao" role="status">
        <Wifi :size="15" aria-hidden="true" /> {{ statusDescricao }}
      </div>
    </div>

    <div v-if="erro" class="cc-chat-feedback cc-chat-feedback--error" role="alert">
      <ExclamationTriangle :size="17" aria-hidden="true" />
      <span>{{ erro }}</span>
      <button type="button" @click="carregarRecentes({ inicial: !mensagens.length })"><Refresh :size="15" aria-hidden="true" /> Tentar novamente</button>
    </div>
    <div v-if="erroAcao" class="cc-chat-feedback cc-chat-feedback--error" role="alert">
      <ExclamationTriangle :size="17" aria-hidden="true" /> {{ erroAcao }}
    </div>

    <div ref="listaEl" class="cc-chat-history" role="log" aria-label="Mensagens da sala" aria-live="polite" @scroll="conferirRolagem">
      <div v-if="carregando && !mensagens.length" class="cc-chat-empty"><Refresh :size="24" aria-hidden="true" /><p>Carregando conversa...</p></div>
      <template v-else>
        <div v-if="existeHistoricoAnterior" class="cc-chat-older">
          <button type="button" :disabled="carregandoAnteriores" @click="carregarAnteriores">
            <ChevronUp :size="16" aria-hidden="true" /> {{ carregandoAnteriores ? 'Carregando...' : 'Carregar mensagens anteriores' }}
          </button>
        </div>
        <div v-if="!mensagens.length" class="cc-chat-empty">
          <Comments :size="30" aria-hidden="true" />
          <h3>Comece a conversa</h3>
          <p>As mensagens desta sala aparecerão aqui.</p>
        </div>
        <article v-for="msg in mensagens" :key="msg.id" class="cc-chat-message" :class="{ 'cc-chat-message--mine': msg.sender?.id === userId, 'cc-chat-message--deleted': msg.is_deleted }">
          <div class="cc-chat-avatar" aria-hidden="true">{{ iniciais(nomeRemetente(msg)) }}</div>
          <div class="cc-chat-bubble">
            <div class="cc-chat-meta">
              <strong>{{ nomeRemetente(msg) }}</strong>
              <span class="cc-chat-role">{{ papel(msg) }}</span>
              <time :datetime="msg.created_at">{{ formatarData(msg.created_at) }}</time>
            </div>
            <template v-if="edicaoId === msg.id && !msg.is_deleted">
              <textarea v-model="edicaoTexto" class="cc-chat-edit" maxlength="5000" rows="3" aria-label="Editar mensagem" :disabled="salvandoId === msg.id"></textarea>
              <div class="cc-chat-inline-actions">
                <button type="button" :disabled="!edicaoTexto.trim() || !!salvandoId" @click="salvarEdicao(msg)"><Check :size="15" aria-hidden="true" /> Salvar</button>
                <button type="button" :disabled="!!salvandoId" @click="cancelarEdicao"><Times :size="15" aria-hidden="true" /> Cancelar</button>
              </div>
            </template>
            <template v-else>
              <p class="cc-chat-content">{{ msg.content }}</p>
              <small v-if="msg.is_edited && !msg.is_deleted" class="cc-chat-edited">editada</small>
              <div v-if="!msg.is_deleted && (podeEditarMensagem(msg, userId, agora) || podeExcluirMensagem(msg, userId, isModerator, agora))" class="cc-chat-actions">
                <button v-if="podeEditarMensagem(msg, userId, agora)" type="button" @click="iniciarEdicao(msg)"><Pencil :size="14" aria-hidden="true" /> Editar</button>
                <button v-if="podeExcluirMensagem(msg, userId, isModerator, agora)" type="button" @click="confirmacaoId = msg.id; cancelarEdicao()"><Trash :size="14" aria-hidden="true" /> Remover</button>
              </div>
              <div v-if="confirmacaoId === msg.id" class="cc-chat-confirm" role="group" aria-label="Confirmar exclusão">
                <span>Remover esta mensagem?</span>
                <button type="button" :disabled="!!excluindoId" @click="removerMensagem(msg)">Sim, remover</button>
                <button type="button" :disabled="!!excluindoId" @click="confirmacaoId = null">Cancelar</button>
              </div>
            </template>
          </div>
        </article>
      </template>
    </div>
    <div v-if="mensagensNaoVistas" class="cc-chat-unread">
      <button type="button" @click="rolarAoFim"><ArrowDown :size="15" aria-hidden="true" /> {{ mensagensNaoVistas }} {{ mensagensNaoVistas === 1 ? 'nova mensagem' : 'novas mensagens' }}</button>
    </div>
    <form class="cc-chat-composer" @submit.prevent="enviar">
      <label for="cc-chat-texto"><User :size="16" aria-hidden="true" /> Sua mensagem</label>
      <div class="cc-chat-compose-row">
        <textarea id="cc-chat-texto" v-model="texto" maxlength="5000" rows="2" placeholder="Escreva para a turma... (Enter envia, Shift+Enter pula linha)" :disabled="enviando || carregando" @keydown="teclasMensagem"></textarea>
        <button type="submit" :disabled="!podeEnviar"><Send :size="18" aria-hidden="true" /> {{ enviando ? 'Enviando...' : 'Enviar' }}</button>
      </div>
      <div class="cc-chat-footer"><span>Somente participantes autorizados podem acessar a conversa.</span><span>{{ texto.length }}/{{ CHAT_CONTENT_MAX }}</span></div>
    </form>
  </section>
</template>
