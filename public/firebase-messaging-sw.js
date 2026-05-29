// importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js');
// importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging.js');

// Firebase configuration
// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
// };

// firebase.initializeApp(firebaseConfig);
// const messaging = firebase.messaging();

// Handle background messages
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.notification?.body || 'Nova notificação',
      icon: data.notification?.icon || '/icon.png',
      badge: '/icon.png',
      tag: 'default-notification',
    };

    event.waitUntil(
      self.registration.showNotification(
        data.notification?.title || 'Notificação',
        options
      )
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
