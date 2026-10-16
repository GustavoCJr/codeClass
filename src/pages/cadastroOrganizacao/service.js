const apiUrl = import.meta.env.VITE_API_URL || ''

export async function registrarOrganizacao({
  nome,
  slug,
  responsavelNome,
  responsavelEmail,
  senha
}) {
  const nomeLimpo = nome?.trim()
  const slugLimpo = slug?.trim().toLowerCase()
  const responsavelNomeLimpo = responsavelNome?.trim()
  const responsavelEmailLimpo = responsavelEmail?.trim().toLowerCase()

  if (!nomeLimpo || nomeLimpo.length < 3) {
    throw new Error('Informe o nome da organização com no mínimo 3 caracteres.')
  }

  if (!slugLimpo || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugLimpo) || slugLimpo.length < 3 || slugLimpo.length > 100) {
    throw new Error('Informe um identificador válido: letras minúsculas, números e hífens (3–100 caracteres).')
  }

  if (!responsavelNomeLimpo || responsavelNomeLimpo.length < 2) {
    throw new Error('Informe o nome completo do responsável.')
  }

  if (!responsavelEmailLimpo) {
    throw new Error('Informe o e-mail institucional do responsável.')
  }

  if (!senha || senha.length < 6) {
    throw new Error('A senha deve conter no mínimo 6 caracteres.')
  }

  const payload = {
    name: nomeLimpo,
    slug: slugLimpo,
    owner: {
      full_name: responsavelNomeLimpo,
      email: responsavelEmailLimpo,
      password: senha
    }
  }

  let response
  try {
    response = await fetch(`${apiUrl}/api/v1/orgs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.')
  }

  let resultado = null
  try {
    resultado = await response.json()
  } catch {
    resultado = null
  }

  if (!response.ok) {
    const detalhe = resultado?.detail
    if (typeof detalhe === 'string') {
      throw new Error(detalhe)
    }
    if (Array.isArray(detalhe)) {
      const mensagens = detalhe.map(item => item?.msg).filter(Boolean)
      if (mensagens.length) throw new Error(mensagens.join(' | '))
    }
    if (response.status === 409) {
      throw new Error('Já existe uma organização com este identificador ou responsável com este e-mail.')
    }
    throw new Error('Não foi possível cadastrar a organização. Verifique as informações e tente novamente.')
  }

  return resultado
}
