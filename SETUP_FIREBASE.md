# 🔥 Guida Completa alla Configurazione Firebase

Questa guida ti aiuterà a configurare Firebase per CutCalendar passo dopo passo.

## 📋 Prerequisiti

- Un account Google (per accedere a Firebase Console)
- Un browser web moderno

## 🚀 Passo 1: Crea un Progetto Firebase

1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Clicca su **"Aggiungi progetto"** o **"Create a project"**
3. Inserisci un nome per il progetto (es: "CutCalendar")
4. Accetta i termini e clicca **"Continua"**
5. (Opzionale) Disabilita Google Analytics se non lo vuoi
6. Clicca **"Crea progetto"**
7. Attendi che il progetto venga creato (30-60 secondi)
8. Clicca **"Continua"**

## 🔐 Passo 2: Abilita Authentication (Email/Password)

1. Nel menu laterale, clicca su **"Authentication"** (Autenticazione)
2. Clicca su **"Inizia"** o **"Get started"**
3. Vai alla tab **"Sign-in method"** (Metodi di accesso)
4. Clicca su **"Email/Password"**
5. Attiva il toggle **"Abilita"** o **"Enable"**
6. Clicca **"Salva"** o **"Save"**

## 💾 Passo 3: Crea il Database Firestore

1. Nel menu laterale, clicca su **"Firestore Database"**
2. Clicca su **"Crea database"** o **"Create database"**
3. Scegli **"Inizia in modalità test"** per iniziare (puoi cambiare le regole dopo)
4. Seleziona una **location** (regione) per il database (es: `europe-west` per l'Europa)
5. Clicca **"Abilita"** o **"Enable"**

### Configura le Regole di Sicurezza Firestore

Dopo aver creato il database, vai alla tab **"Regole"** o **"Rules"** e sostituisci le regole con queste:

**📋 Vedi il file `FIRESTORE_RULES.md` per le regole complete e dettagliate!**

Regole essenziali:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regole per le aziende (companies)
    match /companies/{companyId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == companyId;
    }
    
    // Regole per le prenotazioni (bookings)
    match /bookings/{bookingId} {
      // Permetti la creazione di prenotazioni pubbliche (senza auth)
      allow create: if request.resource.data.companyId != null;
      // Permetti la lettura solo all'azienda proprietaria
      allow read: if request.auth != null && 
        resource.data.companyId == request.auth.uid;
      // Permetti la modifica/cancellazione solo all'azienda proprietaria
      allow update, delete: if request.auth != null && 
        resource.data.companyId == request.auth.uid;
    }
    
    // Regole per gli utenti (users)
    match /users/{userId} {
      allow read: if true;
      allow create: if true; // Per prenotazioni pubbliche
      allow update: if request.auth != null && 
        (request.auth.uid == userId || 
         resource.data.companyId == request.auth.uid ||
         request.resource.data.companyId == request.auth.uid);
    }
    
    // Regole per gli operatori (operators)
    match /operators/{operatorId} {
      // Permetti la lettura agli utenti autenticati (filtriamo lato client per companyId)
      allow read: if request.auth != null;
      // Permetti la creazione se l'utente è autenticato e il companyId corrisponde
      allow create: if request.auth != null && 
        request.resource.data.companyId == request.auth.uid;
      // Permetti la modifica/cancellazione solo all'azienda proprietaria
      allow update, delete: if request.auth != null && 
        resource.data.companyId == request.auth.uid;
    }
    
    // Regole per gli abbonamenti (subscriptions)
    match /subscriptions/{subscriptionId} {
      allow read, write: if request.auth != null && 
        resource.data.companyId == request.auth.uid;
    }
  }
}
```

**⚠️ IMPORTANTE**: 
- Copia le regole COMPLETE dal file `FIRESTORE_RULES.md`
- Assicurati di cliccare **"Pubblica"** dopo aver incollato le regole
- Le regole devono essere esattamente come mostrato sopra

## 📱 Passo 4: Aggiungi un'App Web

1. Nel menu laterale, clicca sull'icona **⚙️** (Impostazioni progetto)
2. Scorri verso il basso e clicca su **"Aggiungi app"** o **"Add app"**
3. Seleziona l'icona **"Web"** (`</>`)
4. Inserisci un nickname per l'app (es: "CutCalendar Web")
5. (Opzionale) Seleziona anche "Configura anche Firebase Hosting"
6. Clicca **"Registra app"** o **"Register app"**

## 🔑 Passo 5: Ottieni le Credenziali

Dopo aver registrato l'app, vedrai una schermata con il codice di configurazione. Copia i seguenti valori:

- **apiKey**: La chiave API (inizia con "AIza...")
- **authDomain**: Il dominio di autenticazione (es: "tuo-progetto.firebaseapp.com")
- **projectId**: L'ID del progetto
- **storageBucket**: Il bucket di storage (es: "tuo-progetto.appspot.com")
- **messagingSenderId**: L'ID del mittente messaggi
- **appId**: L'ID dell'app (inizia con "1:")

## ✏️ Passo 6: Configura firebase-config.js

1. Apri il file `firebase-config.js` nel progetto
2. Sostituisci ogni valore placeholder con le credenziali copiate:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSy...", // La tua API key
    authDomain: "tuo-progetto.firebaseapp.com",
    projectId: "tuo-progetto",
    storageBucket: "tuo-progetto.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};
```

3. Salva il file

## ✅ Passo 7: Verifica la Configurazione

1. Apri `index.html` in un browser (usa un server HTTP locale, non file://)
2. Apri la console del browser (F12)
3. Dovresti vedere messaggi di log che confermano il caricamento di Firebase
4. Prova a registrare un nuovo account

## 🛠️ Setup Server Locale (IMPORTANTE)

Firebase **NON funziona** con `file://`. Devi usare un server HTTP locale.

### Opzione 1: Python (Consigliato)

```bash
# Python 3
python3 -m http.server 8000

# Poi apri: http://localhost:8000
```

### Opzione 2: Node.js

```bash
# Installa http-server globalmente
npm install -g http-server

# Avvia il server
http-server -p 8000

# Poi apri: http://localhost:8000
```

### Opzione 3: PHP

```bash
php -S localhost:8000
```

### Opzione 4: VS Code Live Server

1. Installa l'estensione "Live Server" in VS Code
2. Clicca destro su `index.html`
3. Seleziona "Open with Live Server"

## 🔒 Sicurezza Aggiuntiva (Opzionale)

### Configurare domini autorizzati per Authentication

1. Vai su **Authentication** > **Settings** > **Authorized domains**
2. Aggiungi il tuo dominio di produzione quando sei pronto

### Configurare CORS (se necessario)

Se hai problemi con CORS, configura le impostazioni nel progetto Firebase.

## 📚 Risorse Utili

- [Documentazione Firebase](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

## ❓ Risoluzione Problemi

### Errore: "Firebase non è stato caricato correttamente"
- Verifica di usare un server HTTP (non file://)
- Controlla che gli script Firebase siano caricati in `index.html`
- Verifica la connessione internet

### Errore: "auth non è definito"
- Verifica che `firebase-config.js` sia presente
- Controlla che le credenziali siano corrette
- Verifica l'ordine di caricamento degli script

### Errore: "Permission denied" in Firestore
- Verifica le regole di sicurezza Firestore
- Assicurati che l'utente sia autenticato quando necessario

## 🎉 Completato!

Una volta completati tutti i passaggi, CutCalendar sarà pronto per l'uso!

