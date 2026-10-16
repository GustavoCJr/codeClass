<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { obterPerfilDaPagina } from '../../config/auth'
import { alterarNomePerfil, alterarSenhaPerfil } from './perfilService'
import { validarNomePerfil, validarSenhaPerfil } from './perfilValidacao'
import './perfilProfessor.css'

// O bootstrap da SPA já consultou /users/me. Reutilizamos o perfil autorizado
// em vez de repetir essa chamada ao entrar nesta rota.
const perfil = ref(obterPerfilDaPagina())
const nome = ref(perfil.value?.full_name ?? '')
const senha = ref('')
const confirmarSenha = ref('')
const mostrarSenha = ref(false)
const mostrarConfirmacao = ref(false)
const salvandoNome = ref(false)
const salvandoSenha = ref(false)
const erroNome = ref('')
const erroSenha = ref('')
const sucessoNome = ref('')
const sucessoSenha = ref('')

const iniciais = computed(() => {
  const palavras = String(perfil.value?.full_name || '?').trim().split(/\s+/)
  return palavras.slice(0, 2).map(parte => parte[0]?.toUpperCase()).join('')
})
const papel = computed(() => ({ teacher: 'Professor', admin: 'Administrador', owner: 'Responsável institucional' })[perfil.value?.role] || 'Usuário')
const dataCadastro = computed(() => {
  if (!perfil.value?.created_at) return 'Não informada'
  const data = new Date(perfil.value.created_at)
  if (Number.isNaN(data.getTime())) return 'Não informada'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(data)
})
const nomeAlterado = computed(() => nome.value.trim().replace(/\s+/g, ' ') !== (perfil.value?.full_name || ''))
const temSenhaPendente = computed(() => Boolean(senha.value || confirmarSenha.value))
const dadosPendentes = computed(() => nomeAlterado.value || temSenhaPendente.value)
const ocupado = computed(() => salvandoNome.value || salvandoSenha.value)

function confirmarSaida() {
  return !dadosPendentes.value || window.confirm('Você possui alterações não salvas. Deseja sair desta página?')
}
onBeforeRouteLeave(() => confirmarSaida())
function antesDeFechar(event) {
  if (!dadosPendentes.value) return
  event.preventDefault()
  event.returnValue = ''
}
onMounted(() => window.addEventListener('beforeunload', antesDeFechar))
onUnmounted(() => window.removeEventListener('beforeunload', antesDeFechar))

async function salvarNome() {
  erroNome.value = ''
  sucessoNome.value = ''
  if (ocupado.value || !perfil.value) return
  try {
    const valor = validarNomePerfil(nome.value)
    if (valor === perfil.value.full_name) return
    salvandoNome.value = true
    const atualizado = await alterarNomePerfil(valor)
    // Atualiza o objeto compartilhado pela SPA, sem outra requisição de perfil.
    Object.assign(perfil.value, atualizado)
    nome.value = atualizado.full_name
    sucessoNome.value = 'Nome atualizado com sucesso.'
  } catch (error) {
    erroNome.value = error?.message || 'Não foi possível atualizar o nome.'
  } finally {
    salvandoNome.value = false
  }
}

async function salvarSenha() {
  erroSenha.value = ''
  sucessoSenha.value = ''
  if (ocupado.value || !perfil.value) return
  try {
    validarSenhaPerfil(senha.value, confirmarSenha.value)
    salvandoSenha.value = true
    await alterarSenhaPerfil(senha.value, confirmarSenha.value)
    senha.value = ''
    confirmarSenha.value = ''
    mostrarSenha.value = false
    mostrarConfirmacao.value = false
    sucessoSenha.value = 'Senha alterada com sucesso.'
  } catch (error) {
    erroSenha.value = error?.message || 'Não foi possível alterar sua senha.'
  } finally {
    salvandoSenha.value = false
  }
}
</script>

<template>
  <main class="cc-perfil-page">
    <header class="cc-perfil-heading">
      <div class="cc-perfil-eyebrow">// CONTA / PERFIL</div>
      <h1>Meu <span>perfil.</span></h1>
      <p>Consulte seus dados institucionais e mantenha as informações da sua conta atualizadas.</p>
    </header>

    <div v-if="!perfil" class="cc-perfil-card" role="alert">
      Não foi possível carregar seu perfil. Volte ao início e entre novamente.
    </div>
    <template v-else>
      <section class="cc-perfil-identity cc-perfil-card" aria-label="Resumo da conta">
        <div class="cc-perfil-avatar" aria-hidden="true">{{ iniciais }}</div>
        <div class="cc-perfil-identity-info">
          <h2>{{ perfil.full_name }}</h2>
          <p>{{ perfil.email }}</p>
          <div class="cc-perfil-chips">
            <span class="cc-perfil-chip cc-perfil-chip--role">{{ papel }}</span>
            <span class="cc-perfil-chip">{{ perfil.organization_name }}</span>
          </div>
        </div>
      </section>

      <div class="cc-perfil-columns">
        <div class="cc-perfil-form-column">
          <section class="cc-perfil-card" aria-labelledby="cc-perfil-nome-heading">
            <div class="cc-perfil-section-title">
              <div class="cc-perfil-section-number">01</div>
              <div>
                <h2 id="cc-perfil-nome-heading">Dados pessoais</h2>
                <p>Edite o nome exibido para professores e alunos.</p>
              </div>
            </div>
            <form class="cc-perfil-form" @submit.prevent="salvarNome">
              <label for="cc-perfil-nome">Nome completo</label>
              <input
                id="cc-perfil-nome"
                v-model="nome"
                type="text"
                autocomplete="name"
                minlength="2"
                maxlength="255"
                required
                :disabled="ocupado"
                @input="erroNome = ''; sucessoNome = ''"
              />
              <p v-if="erroNome" class="cc-perfil-feedback cc-perfil-feedback--error" role="alert">{{ erroNome }}</p>
              <p v-if="sucessoNome" class="cc-perfil-feedback cc-perfil-feedback--success" role="status">{{ sucessoNome }}</p>
              <div class="cc-perfil-actions">
                <button class="cc-perfil-primary" type="submit" :disabled="ocupado || !nomeAlterado">
                  {{ salvandoNome ? 'Salvando...' : 'Salvar alterações' }}
                </button>
              </div>
            </form>
          </section>

          <section class="cc-perfil-card" aria-labelledby="cc-perfil-senha-heading">
            <div class="cc-perfil-section-title">
              <div class="cc-perfil-section-number">02</div>
              <div>
                <h2 id="cc-perfil-senha-heading">Segurança da conta</h2>
                <p>Defina uma nova senha de acesso ao CodeClass.</p>
              </div>
            </div>
            <form class="cc-perfil-form" @submit.prevent="salvarSenha">
              <label for="cc-perfil-senha">Nova senha</label>
              <div class="cc-perfil-password">
                <input
                  id="cc-perfil-senha"
                  v-model="senha"
                  :type="mostrarSenha ? 'text' : 'password'"
                  autocomplete="new-password"
                  minlength="6"
                  placeholder="Mínimo de 6 caracteres"
                  :disabled="ocupado"
                  @input="erroSenha = ''; sucessoSenha = ''"
                />
                <button type="button" :disabled="ocupado" :aria-label="mostrarSenha ? 'Ocultar nova senha' : 'Mostrar nova senha'" @click="mostrarSenha = !mostrarSenha">{{ mostrarSenha ? 'Ocultar' : 'Mostrar' }}</button>
              </div>
              <label for="cc-perfil-senha-confirmar">Confirmar nova senha</label>
              <div class="cc-perfil-password">
                <input
                  id="cc-perfil-senha-confirmar"
                  v-model="confirmarSenha"
                  :type="mostrarConfirmacao ? 'text' : 'password'"
                  autocomplete="new-password"
                  minlength="6"
                  placeholder="Repita a nova senha"
                  :disabled="ocupado"
                  @input="erroSenha = ''; sucessoSenha = ''"
                />
                <button type="button" :disabled="ocupado" :aria-label="mostrarConfirmacao ? 'Ocultar confirmação' : 'Mostrar confirmação'" @click="mostrarConfirmacao = !mostrarConfirmacao">{{ mostrarConfirmacao ? 'Ocultar' : 'Mostrar' }}</button>
              </div>
              <p class="cc-perfil-help">Use uma senha exclusiva para sua conta. Ao salvar, os campos serão limpos.</p>
              <p v-if="erroSenha" class="cc-perfil-feedback cc-perfil-feedback--error" role="alert">{{ erroSenha }}</p>
              <p v-if="sucessoSenha" class="cc-perfil-feedback cc-perfil-feedback--success" role="status">{{ sucessoSenha }}</p>
              <div class="cc-perfil-actions">
                <button class="cc-perfil-primary" type="submit" :disabled="ocupado || !temSenhaPendente">
                  {{ salvandoSenha ? 'Atualizando senha...' : 'Alterar senha' }}
                </button>
              </div>
            </form>
          </section>
        </div>

        <aside class="cc-perfil-form-column" aria-label="Dados institucionais">
          <section class="cc-perfil-card" aria-labelledby="cc-perfil-conta-heading">
            <div class="cc-perfil-section-title">
              <div class="cc-perfil-section-number">03</div>
              <div>
                <h2 id="cc-perfil-conta-heading">Informações da conta</h2>
                <p>Dados vinculados à sua organização.</p>
              </div>
            </div>
            <dl class="cc-perfil-details">
              <div><dt>E-mail</dt><dd>{{ perfil.email }}</dd></div>
              <div><dt>Perfil de acesso</dt><dd>{{ papel }}</dd></div>
              <div><dt>Instituição</dt><dd>{{ perfil.organization_name }}</dd></div>
              <div><dt>Identificador da instituição</dt><dd>{{ perfil.organization_slug }}</dd></div>
              <div><dt>Conta criada em</dt><dd>{{ dataCadastro }}</dd></div>
            </dl>
            <p class="cc-perfil-readonly">E-mail, papel de acesso e vínculo institucional são definidos pela organização e não podem ser alterados nesta página.</p>
          </section>
        </aside>
      </div>
    </template>
  </main>
</template>
