# 🔧 Setup Firebase Functions per CutCalendar

## 📋 Prerequisiti

1. Node.js 20 o superiore
2. Firebase CLI installato: `npm install -g firebase-tools`
3. Account Stripe configurato

## 🚀 Installazione

1. **Installa le dipendenze:**
```bash
cd functions
npm install
```

2. **Configura i secrets di Firebase (NUOVO SISTEMA):**
```bash
# Secret Key di Stripe (sk_test_... o sk_live_...)
firebase functions:secrets:set STRIPE_SECRET_KEY

# Webhook Secret di Stripe (whsec_...)
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

3. **Configura i parametri string (NUOVO SISTEMA):**
```bash
# Price ID mensile da Stripe Dashboard
firebase functions:config:set STRIPE_PRICE_MONTHLY_ID="price_XXXXX"

# Price ID annuale da Stripe Dashboard
firebase functions:config:set STRIPE_PRICE_YEARLY_ID="price_XXXXX"

# URL dell'app (default: https://cutcalendar-408e5.web.app)
firebase functions:config:set APP_URL="https://tuo-dominio.com"
```

**⚠️ IMPORTANTE:** Se vedi un errore di deprecazione, usa il nuovo sistema:

**Opzione 1: Configura direttamente nel codice (più semplice)**
Modifica `functions/index.js` e imposta i valori di default:
```javascript
const stripeMonthlyPriceId = defineString("STRIPE_PRICE_MONTHLY_ID", {
  default: "price_1SoKa8IXTFeCafw3lTiATDrx", // Il tuo Price ID
});

const stripeYearlyPriceId = defineString("STRIPE_PRICE_YEARLY_ID", {
  default: "price_XXXXX", // Il tuo Price ID annuale
});
```

**Opzione 2: Usa il comando legacy temporaneamente**
```bash
# Abilita temporaneamente i comandi legacy
firebase experiments:enable legacyRuntimeConfigCommands

# Poi configura i parametri
firebase functions:config:set STRIPE_PRICE_MONTHLY_ID="price_1SoKa8IXTFeCafw3lTiATDrx"
firebase functions:config:set STRIPE_PRICE_YEARLY_ID="price_XXXXX"
```

**Opzione 3: Configura dopo il deploy (consigliata)**
Dopo il deploy, configura i parametri dalla Firebase Console:
1. Vai su Firebase Console > Functions > Config
2. Aggiungi i parametri `STRIPE_PRICE_MONTHLY_ID` e `STRIPE_PRICE_YEARLY_ID`

## 📝 Configurazione Stripe

1. Vai su [Stripe Dashboard](https://dashboard.stripe.com/)
2. Crea i prodotti e i prezzi per gli abbonamenti:
   - **PRO Mensile**: €19,99/mese
   - **PRO Annuale**: €119,99/anno
3. Copia i **Price ID** (iniziano con `price_`)
4. Configurali nei parametri Firebase (vedi sopra)

## 🔗 Configurazione Webhook

1. Vai su Stripe Dashboard > **Developers** > **Webhooks**
2. Clicca **Add endpoint**
3. URL endpoint: `https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/stripeWebhook`
   - Esempio: `https://us-central1-cutcalendar-408e5.cloudfunctions.net/stripeWebhook`
4. Seleziona gli eventi:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copia il **Signing secret** (inizia con `whsec_`)
6. Configuralo come secret: `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET`

## 🚀 Deploy

```bash
# Deploy di tutte le functions
firebase deploy --only functions

# Deploy di una singola function
firebase deploy --only functions:createSubscriptionCheckout
```

## 🧪 Test Locale

```bash
# Avvia l'emulatore
npm run serve

# In un altro terminale, testa le functions
firebase functions:shell
```

## 📚 Funzioni Disponibili

### `createSubscriptionCheckout`
Crea una sessione checkout per abbonamenti Stripe.

**Parametri:**
- `planType`: "monthly" o "yearly"
- `userEmail`: Email dell'utente (opzionale)

**Ritorna:**
- `url`: URL della sessione checkout
- `sessionId`: ID della sessione

### `createServiceCheckoutSession`
Crea una sessione checkout per pagamento servizio singolo.

**Parametri:**
- `bookingId`: ID della prenotazione
- `amount`: Importo in centesimi (es: 3000 per €30.00)
- `bookingData`: Dati della prenotazione

**Ritorna:**
- `url`: URL della sessione checkout
- `sessionId`: ID della sessione

### `stripeWebhook`
Webhook per gestire eventi Stripe (checkout completato, subscription aggiornata, ecc.)

## ⚠️ Note Importanti

- I secrets sono sensibili e non devono essere committati nel repository
- Usa sempre `firebase functions:secrets:set` per configurare i secrets
- I Price ID devono essere creati in Stripe Dashboard prima del deploy
- Il webhook deve essere configurato correttamente per aggiornare gli abbonamenti

## 🐛 Risoluzione Problemi

### Errore: "Secret not found"
Assicurati di aver configurato i secrets:
```bash
firebase functions:secrets:access STRIPE_SECRET_KEY
```

### Errore: "Price ID not found"
Verifica che i Price ID siano configurati correttamente in Stripe Dashboard e nei parametri Firebase.

### Webhook non funziona
1. Verifica che l'URL del webhook sia corretto
2. Controlla che il signing secret sia configurato
3. Verifica i log delle functions: `firebase functions:log`
