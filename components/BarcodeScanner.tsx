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
        if (!stopped) setError('カメラにアクセスできません。カメラの使用を許可してください。')
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
        <p className="text-red-600 text-sm text-center">{error}</p>
      ) : looking ? (
        <div className="flex flex-col items-center gap-2 py-4">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-600">商品名を検索中...</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600">バーコードをカメラに向けてください</p>
          <div className="relative w-full max-w-sm aspect-video bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-4 border-green-400 rounded-lg pointer-events-none" />
          </div>
        </>
      )}
      {!looking && (
        <button
          onClick={onClose}
          className="w-full py-2 rounded-lg border border-gray-300 text-gray-700"
        >
          キャンセル
        </button>
      )}
    </div>
  )
}
