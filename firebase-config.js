// Configurazione Firebase per CutCalendar
// Il progetto usa Firebase Compat Mode (firebase-app-compat.js)

const firebaseConfig = {
  apiKey: "AIzaSyC-CBD3JN83_vEsFku94mgkUdyfS4B0txQ",
  authDomain: "cutcalendar-408e5.firebaseapp.com",
  projectId: "cutcalendar-408e5",
  storageBucket: "cutcalendar-408e5.firebasestorage.app",
  messagingSenderId: "533119881410",
  appId: "1:533119881410:web:ebdd15f57faee614e8eb5b",
  measurementId: "G-T6VY0BGVE9"
};

// Inizializza Firebase (compat mode)
firebase.initializeApp(firebaseConfig);

// Inizializza servizi
const db = firebase.firestore();
const auth = firebase.auth();

// Helper per ottenere timestamp
const getTimestamp = () => firebase.firestore.Timestamp.now();

// Helper per convertire timestamp in Date
const timestampToDate = (timestamp) => {
    if (timestamp && timestamp.toDate) {
        return timestamp.toDate();
    }
    return new Date(timestamp);
};

