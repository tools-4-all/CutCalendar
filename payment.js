// Sistema di pagamento con Stripe per abbonamenti
// IMPORTANTE: Configura Stripe su https://stripe.com/
// e aggiungi la tua chiave pubblica qui

const STRIPE_PUBLIC_KEY = 'YOUR_STRIPE_PUBLIC_KEY';

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
            window.location.href = checkoutSession.url;
        } else {
            alert('Il sistema di pagamento è in fase di configurazione. Per completare l\'abbonamento, contatta il supporto: support@cutcalendar.com');
        }
    } catch (error) {
        console.error('Errore nel checkout abbonamento:', error);
        alert('Errore durante l\'avvio del pagamento. Riprova più tardi.');
    }
};

// Crea sessione Checkout Stripe
async function createCheckoutSession(planType, price) {
    try {
        if (typeof firebase !== 'undefined' && firebase.functions) {
            const functions = firebase.functions();
            const createCheckoutSession = functions.httpsCallable('createSubscriptionCheckout');
            
            const result = await createCheckoutSession({
                planType: planType,
                price: price,
                userId: currentUser.uid,
                userEmail: currentUser.email
            });
            
            return result.data;
        }
        
        const backendUrl = 'YOUR_BACKEND_URL/api/create-checkout-session';
        
        try {
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await currentUser.getIdToken()}`
                },
                body: JSON.stringify({
                    planType: planType,
                    price: price,
                    userId: currentUser.uid,
                    userEmail: currentUser.email
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (fetchError) {
            console.warn('Backend non disponibile:', fetchError);
        }
        
        return null;
    } catch (error) {
        console.error('Errore nella creazione sessione checkout:', error);
        return null;
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
    'taglio-e-piega': 5000, // €50.00
    'trattamento-viso': 4000, // €40.00
    'manicure': 2000, // €20.00
    'pedicure': 2500, // €25.00
    'massaggio': 5000, // €50.00
    'ceretta': 1500 // €15.00
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

