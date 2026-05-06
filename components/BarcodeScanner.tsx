'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  onDetected: (name: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [looking, setLooking] = useState(false)
  const detectedRef = useRef(false)

  useEffect(() => {
    let stopped = false

    const start = async () => {
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const reader = new BrowserMultiFormatReader()
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        const backCamera = devices.find((d) => /back|rear|environment/i.test(d.label))
        const deviceId = backCamera?.deviceId ?? devices[0]?.deviceId

        if (!videoRef.current || stopped) return

        controlsRef.current = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          async (result) => {
            if (!result || detectedRef.current) return
            detectedRef.current = true
            controlsRef.current?.stop()
            setLooking(true)

            const code = result.getText()
            try {
              const res = await fetch(`/api/barcode?code=${encodeURIComponent(code)}`)
              const data = await res.json()
              onDetected(data.name || code)
            } catch {
              onDetected(code)
            }
          }
        )
      } catch (e) {
        if (!stopped) setError('カメラにアクセスできません。\nカメラの使用を許可してください。')
        console.error(e)
      }
    }

    start()
    return () => {
      stopped = true
      controlsRef.current?.stop()
    }
  }, [onDetected])

  return (
    <div className="flex flex-col items-center gap-4">
      {error ? (
        <div className="w-full text-center bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-6">
          <p className="text-red-400 text-sm whitespace-pre-line">{error}</p>
        </div>
      ) : looking ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">商品名を検索中...</p>
        </div>
      ) : (
        <>
          <p className="text-gray-400 text-sm">バーコードをカメラに向けてください</p>
          <div className="relative w-full max-w-sm aspect-video bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-4 border-emerald-400/60 rounded-2xl pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/4 h-0.5 bg-emerald-400/60" />
            </div>
          </div>
        </>
      )}
      {!looking && (
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 font-medium hover:border-gray-600 transition-colors"
        >
          キャンセル
        </button>
      )}
    </div>
  )
}
