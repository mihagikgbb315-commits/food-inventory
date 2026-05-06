/**
 * ファイルをJPEG base64に変換する。
 * iOS SafariでHEICがcanvasに描画される前にnaturalWidth=0になる問題を
 * img.decode()で回避する。canvasが使えない場合はFileReaderにフォールバック。
 */
export async function fileToJpeg(file: File): Promise<{ base64: string; mediaType: 'image/jpeg' }> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode() // 完全にデコードされるまで待つ（naturalWidthが0にならない）

    const MAX = 1280
    let w = img.naturalWidth || 800
    let h = img.naturalHeight || 600
    if (w > MAX || h > MAX) {
      if (w > h) { h = Math.round((h * MAX) / w); w = MAX }
      else { w = Math.round((w * MAX) / h); h = MAX }
    }

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas unavailable')
    ctx.drawImage(img, 0, 0, w, h)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    const base64 = dataUrl.split(',')[1]
    if (!base64) throw new Error('empty canvas output')

    return { base64, mediaType: 'image/jpeg' }
  } catch {
    // canvas失敗時: FileReaderで読み直す（HEIC→JPEGはサーバー側でフォールバック）
    return await fileToBase64Fallback(file)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function fileToBase64Fallback(file: File): Promise<{ base64: string; mediaType: 'image/jpeg' }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      if (!base64) { reject(new Error('読み込み失敗')); return }
      resolve({ base64, mediaType: 'image/jpeg' })
    }
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'))
    reader.readAsDataURL(file)
  })
}
