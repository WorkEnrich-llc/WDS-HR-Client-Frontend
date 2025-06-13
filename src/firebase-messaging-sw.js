
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC8t8ev-Gfm6CWg3Sd5kOVdcs-k_fr4Lig",
  authDomain: "workenrich-8292d.firebaseapp.com",
  projectId: "workenrich-8292d",
  storageBucket: "workenrich-8292d.firebasestorage.app",
  messagingSenderId: "793588708815",
  appId: "1:793588708815:web:0def7343231e72f99a8eba",
  measurementId: "G-F6B5YLEQT0"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
  });

  // console.log('[firebase-messaging-sw.js] Received background message ', payload);
});

self.addEventListener('notificationclick', function (event) {
  const baseURL = 'https://client.workenrich.com/';
  console.log('Notification data:', event.notification.data);
  const urlToOpen = baseURL + (event.notification.data?.url || '');
  console.log('Notification click received:', urlToOpen);
  
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let client of clientList) {
        // لو في نافذة مفتوحة على نفس الـ origin، نوجهها
        if (client.url.includes(self.location.origin)) {
          return client.focus().then(() => client.navigate(urlToOpen));
        }
      }
      // لو مفيش، نفتح نافذة جديدة
      return clients.openWindow(urlToOpen);
    })
  );
});
// onMessage(messaging, payload => {
//    self.registration.showNotification(payload.notification.title, {
//     body: payload.notification.body,
//   });
// });