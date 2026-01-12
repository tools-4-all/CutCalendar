// Sistema di pagamento con Stripe per abbonamenti
// IMPORTANTE: Configura Stripe su https://stripe.com/
// e aggiungi la tua chiave pubblica qui
// 
// Per ottenere la chiave pubblica:
// 1. Vai su https://dashboard.stripe.com/apikeys
// 2. Copia la "Publishable key" (inizia con pk_test_ per test o pk_live_ per produzione)
// 3. Incollala qui sotto

const STRIPE_PUBLIC_KEY = 'pk_live_51SoKTkIXTFeCafw3ExRZ2hd32k6vqfChqryXs5VKRQlb8JBPTK50YSXZLOLUShmPIoPWyy8dvyX56vxyYLl2hz8h00Y7KQqdwq'; // Sostituisci con la tua chiave pubblica Stripe

// Inizializza Stripe
let stripe = null;

function initStripe() {
    if (typeof Stripe !== 'undefined' && STRIPE_PUBLIC_KEY !== 'YOUR_STRIPE_PUBLIC_KEY') {
        stripe = Stripe(STRIPE_PUBLIC_KEY);
        return true;
    }
    return false;
}

// Funzionalità abbonamenti rimosse - versione demo gratuita

// Prezzi servizi (in centesimi - €)
const SERVICE_PRICES = {
    'taglio-capelli': 3000, // €30.00
    'piega': 2500, // €25.00
    'colore': 6000, // €60.00
    'meches': 8000, // €80.00
    'balayage': 9000, // €90.00
    'taglio-e-piega': 5000, // €50.00
    'trattamento-capelli': 4000, // €40.00
    'styling': 3500, // €35.00
    'extension': 12000, // €120.00
    'trattamento-viso': 4000, // €40.00
    'manicure': 2000, // €20.00
    'pedicure': 2500, // €25.00
    'ceretta': 1500, // €15.00
    'massaggio': 5000, // €50.00
    'altro': 3000 // €30.00 default
};

// Gestisci pagamento online per servizi
window.handleOnlinePayment = async function(bookingId, bookingData) {
    try {
        if (!initStripe() || STRIPE_PUBLIC_KEY === 'YOUR_STRIPE_PUBLIC_KEY') {
            console.warn('Stripe non configurato - la prenotazione è stata creata');
            if (typeof db !== 'undefined' && db) {
                try {
                    const bookingDoc = await db.collection('bookings').doc(bookingId).get();
                    if (bookingDoc.exists && !bookingDoc.data().paymentStatus) {
                        await db.collection('bookings').doc(bookingId).update({
                            paymentStatus: 'pending',
                            paymentMethod: 'online'
                        });
                    }
                } catch (updateError) {
                    console.warn('Impossibile aggiornare stato pagamento:', updateError);
                }
            }
            return;
        }

        const amount = SERVICE_PRICES[bookingData.service] || 3000; // Default €30.00
        
        const session = await createServiceCheckoutSession(bookingId, amount, bookingData);
        
        if (session && session.url) {
            window.location.href = session.url;
        } else {
            console.warn('Impossibile creare sessione checkout per servizio');
        }
    } catch (error) {
        console.error('Errore nel pagamento:', error);
    }
};

// Crea sessione Checkout per servizi
async function createServiceCheckoutSession(bookingId, amount, bookingData) {
    try {
        if (typeof firebase === 'undefined' || !firebase.functions) {
            console.warn('Firebase Functions non disponibile');
            return null;
        }
        
        const functions = firebase.functions();
        const createCheckoutSession = functions.httpsCallable('createServiceCheckoutSession');
        
        const result = await createCheckoutSession({
            bookingId: bookingId,
            amount: amount,
            currency: 'eur',
            service: bookingData.service,
            userName: bookingData.userName
        });
        
        return result.data;
    } catch (error) {
        console.error('Errore nella creazione della sessione:', error);
        return null;
    }
}

// Formattazione prezzo
function formatPrice(amount) {
    return (amount / 100).toFixed(2) + ' €';
}

// Mostra prezzo nel form di prenotazione
function displayServicePrice(service) {
    const price = SERVICE_PRICES[service] || 3000;
    return formatPrice(price);
}

// Inizializza Stripe al caricamento
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initStripe();
    });
}

