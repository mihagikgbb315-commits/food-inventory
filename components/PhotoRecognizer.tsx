'use client'

import { useRef, useState } from 'react'
import type { Category } from '@/lib/firebase'

type RecognizedFood = {
  name: string
  category: Category
  quantity: number
  unit: string
}

type Props = {
  onRecognized: (foods: RecognizedFood[]) => void
  onClose: () => void
}

export default function PhotoRecognizer({ onRecognized, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      const { base64, mediaType } = await fileToJpeg(file)
      const res = await fetch('/api/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '認識に失敗しました')
      onRecognized(data.foods)
    } catch (e) {
      setError(e instanceof Error ? e.message : '認識に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-gray-600">
        食材の写真を撮影またはアップロードしてください
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}

      {loading ? (
        <div className="flex flex-col items-center gap-2 py-4">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-600">AIが食材を識別中...</p>
        </div>
      ) : (
        <>
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full py-3 rounded-lg bg-green-600 text-white font-medium"
          >
            📷 カメラで撮影 / 画像を選択
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg border border-gray-300 text-gray-700"
          >
            キャンセル
          </button>
        </>
      )}
    </div>
  )
}

function fileToJpeg(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 1280
      let w = img.naturalWidth
      let h = img.naturalHeight
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round((h * MAX) / w); w = MAX }
        else { w = Math.round((w * MAX) / h); h = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      resolve({ base64: dataUrl.split(',')[1], mediaType: 'image/jpeg' })
    }
    img.onerror = reject
    img.src = url
  })
}
