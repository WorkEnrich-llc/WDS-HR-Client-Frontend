
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

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
});
