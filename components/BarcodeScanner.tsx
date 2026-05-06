'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  onDetected: (code: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let stopped = false
    let controls: { stop: () => void } | null = null

    const start = async () => {
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const reader = new BrowserMultiFormatReader()
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        const backCamera = devices.find((d) => /back|rear|environment/i.test(d.label))
        const deviceId = backCamera?.deviceId ?? devices[0]?.deviceId

        if (!videoRef.current || stopped) return

        controls = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result) => {
            if (result) onDetected(result.getText())
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
      controls?.stop()
    }
  }, [onDetected])

  return (
    <div className="flex flex-col items-center gap-4">
      {error ? (
        <p className="text-red-600 text-sm text-center">{error}</p>
      ) : (
        <>
          <p className="text-sm text-gray-600">バーコードをカメラに向けてください</p>
          <div className="relative w-full max-w-sm aspect-video bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-4 border-green-400 rounded-lg pointer-events-none" />
          </div>
        </>
      )}
      <button
        onClick={onClose}
        className="w-full py-2 rounded-lg border border-gray-300 text-gray-700"
      >
        キャンセル
      </button>
    </div>
  )
}
