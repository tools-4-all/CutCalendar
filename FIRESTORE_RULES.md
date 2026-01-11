# 🔒 Regole di Sicurezza Firestore per CutCalendar

## ⚠️ IMPORTANTE: Usa il file firestore.rules

Il file `firestore.rules` contiene le regole complete e aggiornate. Puoi:

1. **Opzione 1 (Consigliata)**: Usa Firebase CLI per deployare le regole
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Opzione 2**: Copia manualmente il contenuto di `firestore.rules` in Firebase Console
   - Vai su **Firebase Console** > **Firestore Database** > **Regole**
   - Incolla il contenuto del file `firestore.rules`
   - Clicca su **Pubblica**

## 📋 Regole Complete (per riferimento):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regole per le aziende (companies)
    match /companies/{companyId} {
      // Chiunque può leggere i dati pubblici dell'azienda (per la pagina pubblica)
      allow read: if true;
      // Solo l'azienda proprietaria può scrivere
      allow write: if request.auth != null && request.auth.uid == companyId;
    }
    
    // Regole per le prenotazioni (bookings)
    match /bookings/{bookingId} {
      // Permetti la creazione di prenotazioni pubbliche (senza auth) se hanno un companyId valido
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
      // Chiunque può leggere (per visualizzare profili clienti)
      allow read: if true;
      // Permetti la creazione di utenti senza autenticazione (per prenotazioni pubbliche)
      allow create: if true;
      // Permetti la modifica solo all'utente stesso o all'azienda
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
      // Solo l'azienda proprietaria può leggere e scrivere
      allow read, write: if request.auth != null && 
        resource.data.companyId == request.auth.uid;
    }
    
    // Regole per i servizi (services)
    match /services/{serviceId} {
      // Permetti lettura a tutti gli autenticati (filtriamo lato client per companyId)
      allow read: if request.auth != null;
      
      // Permetti creazione solo se l'utente è autenticato e il companyId corrisponde
      allow create: if request.auth != null && 
                    request.resource.data.companyId == request.auth.uid;
      
      // Permetti aggiornamento solo se l'utente è autenticato e il companyId corrisponde
      allow update: if request.auth != null && 
                    resource.data.companyId == request.auth.uid;
      
      // Permetti eliminazione solo se l'utente è autenticato e il companyId corrisponde
      allow delete: if request.auth != null && 
                    resource.data.companyId == request.auth.uid;
    }
  }
}
```

## 📝 Spiegazione delle Regole

### Prenotazioni (bookings)
- **create**: Permette la creazione di prenotazioni pubbliche (senza autenticazione) se hanno un `companyId` valido
- **read**: Solo l'azienda proprietaria può leggere le proprie prenotazioni
- **update/delete**: Solo l'azienda proprietaria può modificare/cancellare le proprie prenotazioni

### Utenti (users)
- **read**: Chiunque può leggere (necessario per visualizzare i profili clienti)
- **create**: Permette la creazione di utenti senza autenticazione (per le prenotazioni pubbliche)
- **update**: Solo l'utente stesso o l'azienda può modificare

### Aziende (companies)
- **read**: Chiunque può leggere (per la pagina pubblica di prenotazione)
- **write**: Solo l'azienda proprietaria può modificare

### Servizi (services)
- **read**: Tutti gli utenti autenticati possono leggere (filtriamo lato client per companyId)
- **create**: Solo l'azienda proprietaria può creare servizi (companyId deve corrispondere)
- **update**: Solo l'azienda proprietaria può modificare i propri servizi
- **delete**: Solo l'azienda proprietaria può eliminare i propri servizi

## 🔧 Come Applicare le Regole

1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Seleziona il tuo progetto
3. Vai su **Firestore Database** nel menu laterale
4. Clicca sulla tab **Regole** (Rules)
5. Incolla le regole sopra
6. Clicca su **Pubblica** (Publish)

## ⚠️ Note di Sicurezza

- Queste regole permettono la creazione di prenotazioni pubbliche senza autenticazione
- In produzione, potresti voler aggiungere validazioni aggiuntive (es: limitare il numero di prenotazioni per IP)
- Le prenotazioni possono essere lette solo dall'azienda proprietaria
- Gli utenti possono essere creati senza autenticazione, ma solo l'azienda può modificarli dopo la creazione

## 🐛 Risoluzione Problemi

### Errore: "Missing or insufficient permissions"
1. Verifica di aver copiato correttamente le regole
2. Assicurati di aver cliccato "Pubblica" dopo aver incollato le regole
3. Verifica che il `companyId` sia presente nei dati della prenotazione
4. Controlla la console del browser per errori più dettagliati

### Le prenotazioni pubbliche non funzionano
- Verifica che la regola `allow create` per bookings sia presente
- Verifica che `request.resource.data.companyId` sia presente nei dati

### Le prenotazioni dall'admin non funzionano
- Verifica di essere autenticato
- Verifica che `currentUser.uid` corrisponda al `companyId` della prenotazione

