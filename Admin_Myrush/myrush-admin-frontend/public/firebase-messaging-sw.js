importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyBr8GPgNjb4otB0lR9G6jfmUKjzYjC43Yw",
    authDomain: "myrush-eba39.firebaseapp.com",
    projectId: "myrush-eba39",
    storageBucket: "myrush-eba39.firebasestorage.app",
    messagingSenderId: "126143878938",
    appId: "1:126143878938:web:740638e3239fa8c259fea3"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png', // Using existing Admin icon
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
