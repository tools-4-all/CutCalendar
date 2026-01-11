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

// Prezzi abbonamenti (in centesimi - €)
const SUBSCRIPTION_PRICES = {
    'monthly': 1999, // €19.99
    'yearly': 11999  // €119.99
};

// Nomi dei piani
const PLAN_NAMES = {
    'monthly': 'PRO Mensile',
    'yearly': 'PRO Annuale'
};

// Gestisci checkout abbonamento
window.handleSubscriptionCheckout = async function(planType, price) {
    try {
        if (!initStripe()) {
            alert('Stripe non è configurato. Contatta il supporto per completare l\'abbonamento.');
            console.warn('Stripe non configurato - STRIPE_PUBLIC_KEY deve essere impostata');
            return;
        }

        if (!currentUser) {
            alert('Devi effettuare il login per sottoscrivere un abbonamento');
            return;
        }

        const checkoutSession = await createCheckoutSession(planType, price);
        
        if (checkoutSession && checkoutSession.url) {
            console.log('[Checkout] Reindirizzamento a Stripe:', checkoutSession.url);
            window.location.href = checkoutSession.url;
        } else {
            console.error('[Checkout] Sessione checkout non valida:', checkoutSession);
            alert('Errore: La sessione di pagamento non è stata creata correttamente. Verifica che le Firebase Functions siano deployate e configurate.');
        }
    } catch (error) {
        console.error('[Checkout] Errore nel checkout abbonamento:', error);
        
        let errorMessage = 'Errore durante l\'avvio del pagamento. ';
        
        if (error.message?.includes('not found') || error.message?.includes('non trovata')) {
            errorMessage += 'Le Firebase Functions non sono deployate. Esegui: firebase deploy --only functions';
        } else if (error.message?.includes('unauthenticated')) {
            errorMessage += 'Devi essere autenticato per completare il pagamento.';
        } else if (error.message) {
            errorMessage += error.message;
        } else {
            errorMessage += 'Riprova più tardi o contatta il supporto.';
        }
        
        alert(errorMessage);
    }
};

// Crea sessione Checkout Stripe
async function createCheckoutSession(planType, price) {
    try {
        console.log('[Checkout] Inizio creazione sessione checkout', { planType, price });
        
        if (typeof firebase === 'undefined') {
            console.error('[Checkout] Firebase non è definito');
            throw new Error('Firebase non è disponibile');
        }
        
        if (!firebase.functions) {
            console.error('[Checkout] Firebase Functions non è disponibile');
            throw new Error('Firebase Functions non è disponibile');
        }
        
        const functions = firebase.functions();
        const createCheckoutSession = functions.httpsCallable('createSubscriptionCheckout');
        
        console.log('[Checkout] Chiamata Firebase Function createSubscriptionCheckout');
        
        const result = await createCheckoutSession({
            planType: planType,
            userEmail: currentUser?.email
        });
        
        console.log('[Checkout] Risultato dalla Firebase Function:', result);
        
        if (result && result.data) {
            console.log('[Checkout] Sessione creata con successo:', result.data);
            return result.data;
        } else {
            console.error('[Checkout] Risultato non valido:', result);
            throw new Error('Risultato non valido dalla Firebase Function');
        }
    } catch (error) {
        console.error('[Checkout] Errore nella creazione sessione checkout:', error);
        console.error('[Checkout] Dettagli errore:', {
            message: error.message,
            code: error.code,
            details: error.details
        });
        
        // Se è un errore di funzione non trovata, suggerisci di fare il deploy
        if (error.code === 'not-found' || error.message?.includes('not found')) {
            throw new Error('Firebase Function non trovata. Assicurati di aver fatto il deploy delle functions: firebase deploy --only functions');
        }
        
        throw error;
    }
}

// Verifica stato abbonamento dopo redirect da Stripe
window.verifySubscriptionStatus = async function() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        const success = urlParams.get('success');
        
        if (success === 'true' && sessionId) {
            if (typeof db !== 'undefined' && db && currentUser) {
                const subscriptionDoc = await db.collection('subscriptions').doc(currentUser.uid).get();
                
                if (subscriptionDoc.exists) {
                    const subscription = subscriptionDoc.data();
                    if (subscription.status === 'active') {
                        alert('Abbonamento attivato con successo!');
                        window.history.replaceState({}, document.title, window.location.pathname);
                        if (window.location.pathname.includes('admin.html')) {
                            if (typeof loadSettings === 'function') {
                                loadSettings();
                            }
                        }
                    }
                }
            }
        } else if (success === 'false') {
            alert('Il pagamento è stato annullato.');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    } catch (error) {
        console.error('Errore nella verifica abbonamento:', error);
    }
};

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
        if (window.location.search.includes('session_id')) {
            verifySubscriptionStatus();
        }
    });
}

