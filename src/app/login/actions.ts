'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/infraestrutura/supabase/server'

const credenciaisSchema = z.object({
  email: z.string().trim().email(),
  senha: z.string().min(8).max(128),
})

function lerCredenciais(formData: FormData) {
  return credenciaisSchema.safeParse({
    email: formData.get('email'),
    senha: formData.get('senha'),
  })
}

export async function entrar(formData: FormData) {
  const credenciais = lerCredenciais(formData)

  if (!credenciais.success) {
    redirect('/login?erro=dados')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: credenciais.data.email,
    password: credenciais.data.senha,
  })

  if (error) {
    redirect('/login?erro=credenciais')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function criarConta(formData: FormData) {
  const credenciais = lerCredenciais(formData)

  if (!credenciais.success) {
    redirect('/login?erro=dados')
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: credenciais.data.email,
    password: credenciais.data.senha,
  })

  if (error) {
    redirect('/login?erro=cadastro')
  }

  revalidatePath('/', 'layout')

  if (data.session) {
    redirect('/')
  }

  redirect('/login?status=confirmacao')
}
