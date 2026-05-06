export const dynamic = 'force-dynamic'

import webpush from 'web-push'
import { getAdminDb } from '@/lib/firebase-admin'
import { format, addDays, parseISO, isAfter, isBefore } from 'date-fns'

export async function GET() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const db = getAdminDb()
  const today = new Date()
  const threeDaysLater = addDays(today, 3)

  const foodsSnap = await db.collection('foods').get()
  const expiring = foodsSnap.docs
    .map((d) => d.data())
    .filter((f) => {
      if (!f.expiry_date) return false
      const d = parseISO(f.expiry_date)
      return !isBefore(d, today) && !isAfter(d, threeDaysLater)
    })

  if (expiring.length === 0) return Response.json({ sent: 0 })

  const body = expiring
    .map((f) => `・${f.name}（${format(parseISO(f.expiry_date), 'M/d')}まで）`)
    .join('\n')

  const subsSnap = await db.collection('push_subscriptions').get()
  let sent = 0

  await Promise.allSettled(
    subsSnap.docs.map((d) => {
      const sub = d.data()
      return webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: '⚠️ もうすぐ期限切れの食材があります', body, tag: 'expiry' })
        )
        .then(() => sent++)
        .catch(async (err: { statusCode?: number }) => {
          if (err.statusCode === 410) await d.ref.delete()
        })
    })
  )

  return Response.json({ sent, items: expiring.length })
}
