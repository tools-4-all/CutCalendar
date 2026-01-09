# CutCalendar - Sistema di Prenotazioni per Parrucchieri ed Estetisti

Sistema completo di prenotazioni online per saloni di bellezza, parrucchieri ed estetisti. Sito statico sviluppato con HTML, CSS e JavaScript, integrato con Firebase Firestore.

## 💇 Funzionalità

### Per i Clienti:
- ✅ **Calendario interattivo** per visualizzare e prenotare appuntamenti
- ✅ **Prenotazioni online** - Prenota servizi di bellezza in modo semplice
- ✅ **Pagamento online o in presenza** - Scegli come pagare
- ✅ **Visualizzazione prenotazioni** - Vedi tutte le tue prenotazioni passate e future

### Per i Saloni:
- ✅ **Agenda giornaliera** - Visualizza tutte le prenotazioni del giorno
- ✅ **Calendario completo** - Vista mensile, settimanale e giornaliera
- ✅ **Gestione prenotazioni** - Conferma, completa o annulla prenotazioni
- ✅ **Statistiche** - Visualizza prenotazioni del giorno, in attesa e completate
- ✅ **Dettagli completi** - Accesso a tutte le informazioni su clienti
- ✅ **Link prenotazione pubblica** - Condividi un link con i clienti per prenotazioni dirette
- ✅ **Sistema di abbonamenti** - Sottoscrivi piani PRO mensili o annuali
- ✅ **Gestione fatturazione** - Visualizza e gestisci il tuo abbonamento

### Sistema di Notifiche:
- ✅ **Promemoria automatici** via email
- ✅ **Notifiche di conferma** prenotazione
- ✅ **Notifiche cambio stato** (confermata, completata, annullata)

## 🚀 Setup e Installazione

### 1. Configurazione Firebase

1. Crea un progetto su [Firebase Console](https://console.firebase.google.com/)
2. Abilita **Authentication** (Email/Password)
3. Crea un database **Firestore**
4. Configura le regole di sicurezza Firestore (vedi esempio nel README originale)
5. Copia le credenziali Firebase in `firebase-config.js`

### 2. Configurazione EmailJS (Notifiche)

1. Crea un account su [EmailJS](https://www.emailjs.com/)
2. Configura un servizio email (Gmail, Outlook, etc.)
3. Crea template email per:
   - Nuova prenotazione
   - Cambio stato prenotazione
   - Promemoria
4. Aggiungi le credenziali in `notifications.js`

### 3. Configurazione Stripe (Abbonamenti e Pagamenti)

CutCalendar supporta abbonamenti ricorrenti tramite Stripe:
- **PRO Mensile**: €19,99/mese
- **PRO Annuale**: €119,99/anno

#### Setup Base

1. Crea un account su [Stripe](https://stripe.com/)
2. Ottieni la chiave pubblica API (Publishable key)
3. Aggiungi la chiave in `payment.js`

### 4. Deploy

1. Pusha il codice su GitHub
2. Vai su Settings > Pages del repository
3. Seleziona il branch `main` e la cartella `/root`
4. Il sito sarà disponibile su `https://tuousername.github.io/CutCalendar/`

## 📁 Struttura File

```
CutCalendar/
├── index.html          # Pagina principale per saloni
├── admin.html          # Pagina admin per gestione
├── booking.html        # Pagina pubblica per prenotazioni clienti
├── styles.css          # Stili CSS
├── firebase-config.js  # Configurazione Firebase
├── app.js              # Logica applicazione (se necessario)
├── admin.js            # Logica applicazione admin
├── booking.js          # Logica prenotazioni pubbliche
├── notifications.js    # Sistema notifiche
├── payment.js          # Sistema pagamenti e abbonamenti Stripe
└── README.md           # Questo file
```

## 🎨 Servizi Disponibili

I servizi predefiniti includono:
- Taglio Capelli
- Piega
- Colore
- Meches
- Taglio e Piega
- Trattamento Viso
- Manicure
- Pedicure
- Massaggio
- Ceretta
- Altro

Puoi personalizzare i servizi modificando i file `booking.html`, `admin.html` e i relativi file JavaScript.

## 🎨 Personalizzazione

### Colori
Modifica le variabili CSS in `styles.css`:

```css
:root {
    --primary-color: #d946ef; /* Purple-pink elegante */
    --secondary-color: #ec4899; /* Pink */
    /* ... */
}
```

### Prezzi Servizi
Modifica i prezzi in `payment.js`:

```javascript
const SERVICE_PRICES = {
    'taglio-capelli': 3000, // €30.00
    'piega': 2500, // €25.00
    // ...
};
```

## 🔒 Sicurezza

- Le regole Firestore proteggono i dati degli utenti
- L'autenticazione Firebase gestisce login sicuro
- I pagamenti passano attraverso Stripe (PCI compliant)

## 📱 Responsive

Il sito è completamente responsive e funziona su:
- Desktop
- Tablet
- Smartphone

## 🛠️ Tecnologie Utilizzate

- **HTML5** - Struttura
- **CSS3** - Styling moderno
- **JavaScript (ES6+)** - Logica applicazione
- **Firebase Firestore** - Database
- **Firebase Authentication** - Autenticazione
- **FullCalendar** - Calendario interattivo
- **EmailJS** - Notifiche email
- **Stripe** - Pagamenti online

## 🔗 Link Prenotazione Pubblica

Il sistema include una pagina pubblica (`booking.html`) che permette ai clienti di prenotare direttamente senza registrazione.

### Come Generare il Link

1. **Accedi alla dashboard admin** (`admin.html`)
2. **Registra il tuo salone** nella sezione Impostazioni > Profilo Azienda
3. **Ottieni il tuo Company ID**: Il Company ID è il tuo User ID (UID) di Firebase Authentication
4. **Genera il link**: 
   ```
   https://tuodominio.com/booking.html?companyId=TUO_USER_ID
   ```

### Caratteristiche della Pagina Pubblica

- ✅ **Nessuna registrazione richiesta** - I clienti possono prenotare direttamente
- ✅ **Controllo conflitti automatico** - Previene prenotazioni sovrapposte
- ✅ **Validazione 24 ore** - Le prenotazioni devono essere fatte con almeno 24h di anticipo
- ✅ **Creazione automatica cliente** - Il sistema crea automaticamente il profilo cliente
- ✅ **Stato pending** - Tutte le prenotazioni pubbliche iniziano come "pending" e devono essere confermate dal salone

## 💳 Piani e Abbonamenti

CutCalendar offre diversi piani:

- **FREE**: Fino a 50 prenotazioni/mese, 2 operatori, 1 sede
- **PRO Mensile**: €19,99/mese - Prenotazioni illimitate, fino a 5 operatori, 3 sedi
- **PRO Annuale**: €119,99/anno - Stesse funzionalità PRO con risparmio di €120/anno

Gli abbonamenti vengono gestiti tramite Stripe e si rinnovano automaticamente.

## 📝 Note

- Per le notifiche SMS, puoi integrare Twilio o usare EmailJS con provider SMS
- I promemoria automatici richiedono un sistema di cron job (es. Firebase Cloud Functions)
- **Abbonamenti Stripe**: Richiedono Firebase Cloud Functions per funzionare completamente
- **Importante**: Assicurati di aver configurato il profilo salone prima di condividere il link pubblico

## 🤝 Contribuire

Sentiti libero di fare fork e migliorare il progetto!

## 📄 Licenza

Questo progetto è open source e disponibile per uso personale e commerciale.

---

Sviluppato con ❤️ per parrucchieri ed estetisti

