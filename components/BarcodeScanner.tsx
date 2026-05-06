'use client'

import { useEffect, useRef, useState } from 'react'

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
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-4 text-center">
        <p className="text-amber-400 text-sm font-medium">データベースに商品情報がありませんでした</p>
        <p className="text-gray-500 text-xs mt-1">商品パッケージのラベルをAIに読み取らせて商品名を取得できます</p>
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
        📷 商品ラベルを撮影して認識
      </button>

      <button
        onClick={() => onDetected('')}
        className="w-full py-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 font-medium hover:border-gray-600 transition-colors"
      >
        手動で商品名を入力する
      </button>

      <button onClick={onClose} className="w-full py-2 text-gray-600 text-sm">
        キャンセル
      </button>
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
      let w = img.naturalWidth, h = img.naturalHeight
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round((h * MAX) / w); w = MAX }
        else { w = Math.round((w * MAX) / h); h = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      resolve({ base64: dataUrl.split(',')[1], mediaType: 'image/jpeg' })
    }
    img.onerror = reject
    img.src = url
  })
}
