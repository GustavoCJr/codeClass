<script setup>
import { inject } from 'vue'
import { routeLocationKey, onBeforeRouteLeave } from 'vue-router'
import { useProfessorNavigation } from '../../router/professorNavigation'
const props = defineProps({ embedded: { type: Boolean, default: false } })
const route = inject(routeLocationKey, null)
const navegar = useProfessorNavigation()
import { onMounted, ref } from 'vue'
import Dialog from 'primevue/dialog'
import SidebarLayout from 'primevue/sidebarlayout'
import SidebarMain from 'primevue/sidebarmain'
import SidebarProfessor from '../../components/sidebarProfessor.vue'
import { buscarAlunos, cadastrarAluno } from './service'
import '../atividade/estilos.css'
import '../atividade/aluno.css'
const alunos = ref([])
const busca = ref('')
const offset = ref(0)
const carregando = ref(false)
const erro = ref('')
const visible = ref(false)
const salvando = ref(false)
const erroCadastro = ref('')
const mensagem = ref('')
const nome = ref('')
const email = ref('')
const senha = ref('')
async function carregar(novaBusca = false, pagina = offset.value) {
  if (carregando.value) return
  carregando.value = true; erro.value = ''
  try { const proximoOffset = novaBusca ? 0 : pagina; alunos.value = await buscarAlunos(busca.value, proximoOffset); offset.value = proximoOffset }
  catch (error) { erro.value = error.message }
  finally { carregando.value = false }
}
function abrir() { nome.value = ''; email.value = ''; senha.value = ''; erroCadastro.value = ''; visible.value = true }
async function salvar() {
  if (salvando.value) return
  salvando.value = true; erroCadastro.value = ''
  try { const aluno = await cadastrarAluno({ full_name: nome.value, email: email.value, password: senha.value }); mensagem.value = `${aluno.full_name} cadastrado. Agora ele pode ser matriculado em uma sala.`; senha.value = ''; visible.value = false; await carregar(true) }
  catch (error) { erroCadastro.value = error.message }
  finally { salvando.value = false }
}
onMounted(() => carregar())
</script>
<template>
  <component :is="embedded ? 'div' : SidebarLayout"><SidebarProfessor v-if="!embedded" /><component :is="embedded ? 'div' : SidebarMain"><main class="assignment-page">
    <header class="assignment-header"><div><h1>Alunos da instituição</h1><p>Cadastre a conta antes de matricular o aluno em uma sala.</p></div><button type="button" class="student-submit-button" @click="abrir">Cadastrar aluno</button></header>
    <form class="student-filters" @submit.prevent="carregar(true)"><label>Buscar por nome ou e-mail<input v-model="busca" type="search"></label><button class="assignment-secondary-button" :disabled="carregando" type="submit">Buscar</button></form>
    <p v-if="carregando" role="status">Carregando alunos...</p><p v-if="erro" role="alert" class="student-assignment-error">{{ erro }}</p><p v-if="mensagem" role="status" class="student-assignment-notice">{{ mensagem }}</p>
    <div v-if="!carregando" class="assignment-question-list"><article v-for="aluno in alunos" :key="aluno.user_id" class="student-task-card"><h2>{{ aluno.full_name }}</h2><p>{{ aluno.email }} · {{ aluno.is_active ? 'Ativo' : 'Inativo' }}</p></article><p v-if="!alunos.length">Nenhum aluno encontrado.</p></div>
    <nav class="student-assignment-actions" aria-label="Páginas de alunos"><button type="button" :disabled="carregando || offset === 0" @click="carregar(false, Math.max(0, offset - 50))">Anterior</button><span>Página {{ offset / 50 + 1 }}</span><button type="button" :disabled="carregando || alunos.length < 50" @click="carregar(false, offset + 50)">Próxima</button></nav>
    <Dialog v-model:visible="visible" modal header="Cadastrar aluno" :closable="!salvando" :close-on-escape="!salvando" :style="{ width: 'min(92vw, 540px)' }" @after-hide="senha = ''">
      <form class="student-edit-form" @submit.prevent="salvar"><fieldset :disabled="salvando" class="student-edit-form student-question-fieldset"><label>Nome completo<input v-model="nome" required minlength="2" maxlength="255" autocomplete="off"></label><label>E-mail<input v-model="email" required type="email" autocomplete="off"></label><label>Senha inicial<input v-model="senha" type="password" required minlength="6" autocomplete="new-password"></label></fieldset><p>A conta será criada com a senha informada. Este cadastro não envia convite por e-mail.</p><p v-if="erroCadastro" role="alert" class="student-assignment-error">{{ erroCadastro }}</p><div class="student-assignment-actions"><button type="button" :disabled="salvando" @click="visible = false">Cancelar</button><button type="submit" class="student-submit-button" :disabled="salvando">{{ salvando ? 'Cadastrando...' : 'Cadastrar' }}</button></div></form>
    </Dialog>
  </main></component></component>
</template>
