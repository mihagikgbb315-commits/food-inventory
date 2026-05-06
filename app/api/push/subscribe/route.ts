export const dynamic = 'force-dynamic'

import { getAdminDb } from '@/lib/firebase-admin'

export async function POST(request: Request) {
  const subscription = await request.json()
  const db = getAdminDb()

  await db.collection('push_subscriptions').doc(
    Buffer.from(subscription.endpoint).toString('base64').slice(0, 100)
  ).set({
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    updated_at: new Date().toISOString(),
  })

  return Response.json({ ok: true })
}

export async function DELETE(request: Request) {
  const { endpoint } = await request.json()
  const db = getAdminDb()
  const id = Buffer.from(endpoint).toString('base64').slice(0, 100)
  await db.collection('push_subscriptions').doc(id).delete()
  return Response.json({ ok: true })
}
