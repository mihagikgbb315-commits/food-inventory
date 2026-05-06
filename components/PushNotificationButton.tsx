'use client'

import { useEffect, useState } from 'react'

export default function PushNotificationButton() {
  const [status, setStatus] = useState<'loading' | 'unsupported' | 'denied' | 'granted' | 'default'>('loading')
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported')
      return
    }
    setStatus(Notification.permission)
  }, [])

  const subscribe = async () => {
    setSubscribing(true)
    try {
      const permission = await Notification.requestPermission()
      setStatus(permission)
      if (permission !== 'granted') return

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })
    } catch (e) {
      console.error(e)
    } finally {
      setSubscribing(false)
    }
  }

  if (status === 'unsupported' || status === 'denied' || status === 'granted') return null

  return (
    <button
      onClick={subscribe}
      disabled={subscribing}
      className="w-full flex items-center gap-3 px-4 py-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-sm text-emerald-400 font-medium hover:bg-emerald-500/15 transition-colors disabled:opacity-50"
    >
      <span className="text-lg">🔔</span>
      <span>
        {subscribing
          ? '設定中...'
          : '消費期限の通知を受け取る（ホーム画面追加後に有効）'}
      </span>
    </button>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}
