'use client'

import { useRef, useState } from 'react'
import type { Category } from '@/lib/firebase'
import { fileToJpeg } from '@/lib/imageUtils'

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
      <p className="text-gray-400 text-sm text-center">
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

      {error && (
        <div className="w-full bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">AIが食材を識別中...</p>
        </div>
      ) : (
        <>
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98] transition-all"
          >
            📷 カメラで撮影 / 画像を選択
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 font-medium hover:border-gray-600 transition-colors"
          >
            キャンセル
          </button>
        </>
      )}
    </div>
  )
}
