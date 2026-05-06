/**
 * 画像ファイルをbase64に変換する。
 * canvasを使わずFileReaderで直接読む（iOS互換性が最も高い）。
 * iOSはファイルinput経由のカメラ写真を自動的にJPEGで渡す。
 */
export function fileToJpeg(file: File): Promise<{ base64: string; mediaType: 'image/jpeg' }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      const commaIdx = result.indexOf(',')
      if (commaIdx === -1) {
        reject(new Error('画像の読み込みに失敗しました'))
        return
      }
      resolve({ base64: result.slice(commaIdx + 1), mediaType: 'image/jpeg' })
    }
    reader.onerror = () => reject(new Error('画像ファイルを読み込めませんでした'))
    reader.readAsDataURL(file)
  })
}
