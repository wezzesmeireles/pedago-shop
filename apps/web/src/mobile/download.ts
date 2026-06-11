import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { Browser } from '@capacitor/browser'

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const res = (reader.result as string) || ''
      // "data:application/pdf;base64,XXXX" → só o XXXX
      resolve(res.includes(',') ? res.split(',')[1] : res)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Salva o arquivo no aparelho e abre a folha nativa (Salvar em Arquivos / Abrir
// com / compartilhar). O WebView do Android NÃO baixa blob via <a download>,
// então fazemos o save de verdade pelo Filesystem + Share.
export async function saveAndOpenBlob(blob: Blob, filename: string): Promise<void> {
  const data = await blobToBase64(blob)
  const safeName = (filename || 'arquivo.pdf').replace(/[^\w.\-() ]+/g, '_')
  const written = await Filesystem.writeFile({
    path: safeName,
    data,
    directory: Directory.Cache,
  })
  try {
    await Share.share({ title: safeName, text: safeName, url: written.uri })
  } catch {
    // usuário fechou a folha — o arquivo já está salvo no app (cache)
  }
}

// Produto tipo "link": abre no navegador in-app (window.open não funciona no app).
export async function openUrl(url: string): Promise<void> {
  await Browser.open({ url })
}
