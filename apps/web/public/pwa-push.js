/* Web Push handler shared by the generated PWA service worker.
 * Keep this file dependency-free: Workbox loads it with importScripts(). */
self.addEventListener('push', function (event) {
  var payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = { notification: { body: event.data ? event.data.text() : '' } };
  }

  var notification = payload.notification || {};
  var data = payload.data || {};
  var title = notification.title || data.title || 'Site Pedagógico';
  var body = notification.body || data.body || 'Você tem uma novidade no Site Pedagógico.';
  var route = typeof data.route === 'string' && data.route.charAt(0) === '/' ? data.route : '/';

  event.waitUntil(self.registration.showNotification(title, {
    body: body,
    icon: '/favicon-192.png',
    badge: '/favicon-192.png',
    tag: data.tag || payload.messageId || 'site-pedagogico',
    renotify: true,
    data: { route: route },
  }));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var route = event.notification.data && event.notification.data.route;
  var destination = typeof route === 'string' && route.charAt(0) === '/' ? route : '/';

  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windows) {
    for (var i = 0; i < windows.length; i += 1) {
      var client = windows[i];
      if ('navigate' in client) client.navigate(destination);
      if ('focus' in client) return client.focus();
    }
    return self.clients.openWindow ? self.clients.openWindow(destination) : undefined;
  }));
});
