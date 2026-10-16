import { api } from '../../config/api'
import { obterPerfilDaPagina } from '../../config/auth'
function base() {
  const perfil = obterPerfilDaPagina()
  if (!['admin', 'owner'].includes(perfil?.role) || !perfil.organization_id) throw new Error('Somente Admin/Owner pode cadastrar alunos.')
  return `/orgs/${encodeURIComponent(perfil.organization_id)}/members`
}
export function buscarAlunos(search = '', offset = 0) {
  return api(`${base()}?${new URLSearchParams({ role: 'student', search: search.trim(), limit: '50', offset: String(offset) })}`)
}
export function cadastrarAluno({ full_name, email, password }) {
  return api(base(), { method: 'POST', body: JSON.stringify({ full_name: full_name.trim(), email: email.trim(), password, role: 'student' }) })
}
