'use client'

import { useEffect, useRef, useState } from 'react'
import { fileToJpeg } from '@/lib/imageUtils'

type Props = {
  onDetected: (name: string) => void
  onClose: () => void
}

type Phase =
  | 'scanning'      // バーコード読み取り中
  | 'looking'       // データベース検索中
  | 'not-found'     // データベースにない → ラベル撮影を促す
  | 'reading-label' // ラベル画像をAIが解析中

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const labelInputRef = useRef<HTMLInputElement>(null)
  const detectedRef = useRef(false)
  const [phase, setPhase] = useState<Phase>('scanning')
  const [cameraError, setCameraError] = useState(false)

  useEffect(() => {
    let stopped = false

    const start = async () => {
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const reader = new BrowserMultiFormatReader()
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        const back = devices.find((d) => /back|rear|environment/i.test(d.label))
        const deviceId = back?.deviceId ?? devices[0]?.deviceId

        if (!videoRef.current || stopped) return

        controlsRef.current = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          async (result) => {
            if (!result || detectedRef.current) return
            detectedRef.current = true
            controlsRef.current?.stop()
            setPhase('looking')

            try {
              const res = await fetch(`/api/barcode?code=${encodeURIComponent(result.getText())}`)
              const data = await res.json()
              if (data.name) {
                onDetected(data.name)
              } else {
                // データベースに商品なし → ラベル撮影へ
                setPhase('not-found')
              }
            } catch {
              setPhase('not-found')
            }
          }
        )
      } catch {
        if (!stopped) setCameraError(true)
      }
    }

    start()
    return () => {
      stopped = true
      controlsRef.current?.stop()
    }
  }, [onDetected])

  const handleLabelPhoto = async (file: File) => {
    setPhase('reading-label')
    try {
      const { base64, mediaType } = await fileToJpeg(file)
      const res = await fetch('/api/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType, mode: 'label' }),
      })
      const data = await res.json()
      if (data.name) {
        onDetected(data.name)
      } else {
        // AIでも読めなければ空文字で手動入力へ
        onDetected('')
      }
    } catch {
      onDetected('')
    }
  }

  if (cameraError) {
    return (
      <div className="flex flex-col gap-4">
        <div className="w-full text-center bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-6">
          <p className="text-red-400 text-sm">カメラにアクセスできません。<br />カメラの使用を許可してください。</p>
        </div>
        <button onClick={onClose} className="w-full py-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 font-medium">キャンセル</button>
      </div>
    )
  }

  if (phase === 'scanning') {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-gray-400 text-sm">バーコードをカメラに向けてください</p>
        <div className="relative w-full aspect-video bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
          <video ref={videoRef} className="w-full h-full object-cover" />
          <div className="absolute inset-0 border-4 border-emerald-400/60 rounded-2xl pointer-events-none" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3/4 h-0.5 bg-emerald-400/60" />
          </div>
        </div>
        <button onClick={onClose} className="w-full py-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 font-medium hover:border-gray-600 transition-colors">
          キャンセル
        </button>
      </div>
    )
  }

  if (phase === 'looking') {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">データベースで商品名を検索中...</p>
      </div>
    )
  }

  if (phase === 'reading-label') {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">AIがラベルを読み取り中...</p>
      </div>
    )
  }

  // not-found: ラベル撮影を促す
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-5 text-center">
        <p className="text-2xl mb-2">🔍</p>
        <p className="text-white text-sm font-semibold">バーコードは読み取れましたが、</p>
        <p className="text-white text-sm font-semibold">商品名のデータがありませんでした</p>
        <p className="text-gray-500 text-xs mt-2">
          次のどちらかで商品名を登録してください
        </p>
      </div>

      <input
        ref={labelInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleLabelPhoto(file)
        }}
      />

      <button
        onClick={() => labelInputRef.current?.click()}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98] transition-all"
      >
        📷 商品パッケージを撮影してAIに認識させる
      </button>

      <button
        onClick={() => onDetected('')}
        className="w-full py-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 font-medium hover:border-gray-600 transition-colors"
      >
        ✏️ 商品名を自分で入力する
      </button>

      <button onClick={onClose} className="w-full py-2 text-gray-600 text-sm">
        キャンセル
      </button>
    </div>
  )
}
