self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title ?? '冷蔵庫管理'
  const options = {
    body: data.body ?? '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag ?? 'food-expiry',
    data: { url: data.url ?? '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
