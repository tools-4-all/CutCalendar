// Sistema di notifiche con EmailJS
// IMPORTANTE: Configura EmailJS su https://www.emailjs.com/
// e aggiungi le tue credenziali qui

const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';
const EMAILJS_STATUS_TEMPLATE_ID = 'YOUR_STATUS_TEMPLATE_ID';
const EMAILJS_REMINDER_TEMPLATE_ID = 'YOUR_REMINDER_TEMPLATE_ID';

// Inizializza EmailJS
function initEmailJS() {
    if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_PUBLIC_KEY);
    }
}

// Invia notifica per nuova prenotazione
window.sendBookingNotification = async function(bookingData, bookingId) {
    if (typeof emailjs === 'undefined') {
        console.warn('EmailJS non configurato');
        return;
    }

    try {
        const serviceNames = {
            'taglio-capelli': 'Taglio Capelli',
            'piega': 'Piega',
            'colore': 'Colore',
            'meches': 'Meches',
            'balayage': 'Balayage',
            'taglio-e-piega': 'Taglio e Piega',
            'trattamento-capelli': 'Trattamento Capelli',
            'styling': 'Styling',
            'extension': 'Extension',
            'trattamento-viso': 'Trattamento Viso',
            'manicure': 'Manicure',
            'pedicure': 'Pedicure',
            'ceretta': 'Ceretta',
            'massaggio': 'Massaggio',
            'altro': 'Altro'
        };

        const date = timestampToDate(bookingData.dateTime);
        
        const templateParams = {
            to_email: bookingData.userEmail,
            to_name: bookingData.userEmail.split('@')[0],
            booking_id: bookingId,
            client_name: bookingData.userName,
            service: serviceNames[bookingData.service] || bookingData.service,
            date_time: date.toLocaleString('it-IT'),
            payment_method: bookingData.paymentMethod === 'online' ? 'Online' : 'In Presenza',
            notes: bookingData.notes || 'Nessuna nota'
        };

        await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams
        );

        console.log('Notifica inviata con successo');
    } catch (error) {
        console.error('Errore nell\'invio della notifica:', error);
    }
}

// Invia notifica per cambio stato prenotazione
window.sendStatusNotification = async function(booking, newStatus) {
    if (typeof emailjs === 'undefined') {
        console.warn('EmailJS non configurato');
        return;
    }

    try {
        const statusMessages = {
            'confirmed': 'confermata',
            'completed': 'completata',
            'cancelled': 'annullata'
        };

        const date = timestampToDate(booking.dateTime);
        
        const templateParams = {
            to_email: booking.userEmail,
            to_name: booking.userEmail.split('@')[0],
            booking_id: booking.id || 'N/A',
            client_name: booking.userName,
            service: booking.service,
            date_time: date.toLocaleString('it-IT'),
            status: statusMessages[newStatus] || newStatus,
            message: `La tua prenotazione è stata ${statusMessages[newStatus] || newStatus}`
        };

        await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_STATUS_TEMPLATE_ID,
            templateParams
        );

        console.log('Notifica stato inviata con successo');
    } catch (error) {
        console.error('Errore nell\'invio della notifica stato:', error);
    }
}

// Invia promemoria
async function sendReminder(booking) {
    if (typeof emailjs === 'undefined') {
        console.warn('EmailJS non configurato');
        return;
    }

    try {
        const date = timestampToDate(booking.dateTime);
        const now = new Date();
        const hoursUntil = (date - now) / (1000 * 60 * 60);

        if (hoursUntil > 24 && hoursUntil < 25) {
            const templateParams = {
                to_email: booking.userEmail,
                to_name: booking.userEmail.split('@')[0],
                client_name: booking.userName,
                service: booking.service,
                date_time: date.toLocaleString('it-IT'),
                reminder_hours: '24'
            };

            await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_REMINDER_TEMPLATE_ID,
                templateParams
            );

            console.log('Promemoria inviato');
        }
    } catch (error) {
        console.error('Errore nell\'invio del promemoria:', error);
    }
}

// Controlla e invia promemoria
async function checkAndSendReminders() {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);

        const snapshot = await db.collection('bookings')
            .where('dateTime', '>=', firebase.firestore.Timestamp.fromDate(tomorrow))
            .where('dateTime', '<', firebase.firestore.Timestamp.fromDate(dayAfter))
            .where('status', 'in', ['pending', 'confirmed'])
            .get();

        snapshot.forEach(async (doc) => {
            const booking = { id: doc.id, ...doc.data() };
            await sendReminder(booking);
        });
    } catch (error) {
        console.error('Errore nel controllo promemoria:', error);
    }
}

