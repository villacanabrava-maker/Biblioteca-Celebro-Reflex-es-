import { AppShell } from '@/componentes/app-shell'
import { FormularioUploadBiblioteca } from '@/componentes/biblioteca/formulario-upload'

export default function AdicionarConteudoPage() {
  return (
    <AppShell
      ativo="biblioteca"
      titulo="Adicionar conteúdo"
      subtitulo="Preserve o original e registre a fonte no seu acervo"
    >
      <FormularioUploadBiblioteca />
    </AppShell>
  )
}
