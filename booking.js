// Variabili globali
let companyId = null;
let companyData = null;

// Durata stimata dei servizi in minuti
const SERVICE_DURATIONS = {
    'taglio-capelli': 45, // 45 minuti
    'piega': 60, // 1 ora
    'colore': 120, // 2 ore
    'meches': 180, // 3 ore
    'balayage': 180, // 3 ore
    'taglio-e-piega': 90, // 1.5 ore
    'trattamento-capelli': 60, // 1 ora
    'styling': 45, // 45 minuti
    'extension': 240, // 4 ore
    'trattamento-viso': 60, // 1 ora
    'manicure': 45, // 45 minuti
    'pedicure': 60, // 1 ora
    'ceretta': 30, // 30 minuti
    'massaggio': 60, // 1 ora
    'altro': 60 // default 1 ora
};

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    console.log('Booking page loaded');
    console.log('Current URL:', window.location.href);
    
    // Verifica se sta usando file:// invece di http://
    const currentUrl = window.location.href;
    const isFileProtocol = currentUrl.startsWith('file://');
    
    if (isFileProtocol) {
        console.error('⚠️ ATTENZIONE: Stai usando file:// invece di un server HTTP!');
        showInitialError('⚠️ IMPORTANTE: Devi usare un server HTTP!\n\n' +
            'Firebase non funziona con file:// (doppio click sul file).\n\n' +
            'Come avviare il server:\n' +
            '1. Apri il terminale nella directory del progetto\n' +
            '2. Esegui: python3 -m http.server 8000\n' +
            '3. Apri nel browser: http://localhost:8000/booking.html?companyId=...\n\n' +
            'Alternative:\n' +
            '- Node.js: npx http-server -p 8000\n' +
            '- PHP: php -S localhost:8000\n' +
            '- VS Code: Estensione "Live Server"');
        return;
    }
    
    // Aspetta che Firebase sia caricato (può richiedere qualche millisecondo)
    setTimeout(() => {
        // Verifica che Firebase sia caricato
        if (typeof firebase === 'undefined') {
            console.error('Firebase non è stato caricato correttamente');
            showInitialError('Errore: Firebase non è stato caricato. Verifica che firebase-config.js sia presente e ricarica la pagina.');
            return;
        }
        
        if (typeof db === 'undefined') {
            console.error('Database Firestore non inizializzato');
            showInitialError('Errore: Database Firestore non inizializzato. Verifica la configurazione Firebase e ricarica la pagina.');
            return;
        }
        
        // Ottieni companyId dall'URL - prova diversi metodi
        const urlParams = new URLSearchParams(window.location.search);
        companyId = urlParams.get('companyId') || urlParams.get('id');
        
        // Metodo 2: Prova a prenderlo dal pathname
        if (!companyId) {
            const pathParts = window.location.pathname.split('/').filter(p => p);
            const bookingIndex = pathParts.findIndex(p => p === 'booking' || p.startsWith('booking'));
            if (bookingIndex >= 0 && pathParts[bookingIndex + 1]) {
                companyId = pathParts[bookingIndex + 1];
                console.log('Company ID trovato nel pathname:', companyId);
            }
        }
        
        // Metodo 3: Prova a prenderlo dall'hash
        if (!companyId && window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            companyId = hashParams.get('companyId') || hashParams.get('id');
            if (companyId) {
                console.log('Company ID trovato nell\'hash:', companyId);
            }
        }
        
        // Metodo 4: Prova a recuperarlo da sessionStorage
        if (!companyId) {
            const storedCompanyId = sessionStorage.getItem('booking_companyId');
            if (storedCompanyId) {
                companyId = storedCompanyId;
                console.log('Company ID recuperato da sessionStorage:', companyId);
            }
        }
        
        console.log('Company ID from URL:', companyId);

        if (!companyId) {
            console.error('CompanyId mancante nell\'URL');
            showInitialError('Link non valido. Manca il parametro companyId.\n\n' +
                'Possibili cause:\n' +
                '1. Il server sta facendo un redirect che rimuove i parametri\n' +
                '2. Il link è stato copiato senza i parametri\n' +
                '3. Il browser ha perso i parametri durante la navigazione\n\n' +
                'Soluzione:\n' +
                '1. Vai alla dashboard admin\n' +
                '2. Copia di nuovo il link completo dalla sezione "Link Prenotazione Pubblica"\n' +
                '3. Assicurati che il link contenga "?companyId=..."\n' +
                '4. Se il problema persiste, prova a incollare il link direttamente nella barra degli indirizzi\n\n' +
                'URL attuale: ' + window.location.href);
            return;
        }

        initBookingPage();
    }, 100);
});

// Inizializza la pagina
async function initBookingPage() {
    try {
        // Carica dati azienda
        await loadCompanyData();
        
        // Imposta data minima (domani)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('bookingDate').min = tomorrow.toISOString().split('T')[0];
        
        // Imposta orari di lavoro (esempio: 9:00 - 19:00)
        const timeInput = document.getElementById('bookingTime');
        timeInput.min = '09:00';
        timeInput.max = '19:00';
        
        // Mostra il form
        document.getElementById('loadingState').classList.remove('show');
        document.getElementById('bookingFormContainer').style.display = 'block';
        
        // Event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Errore nell\'inizializzazione:', error);
        showInitialError('Errore nel caricamento dei dati. Riprova più tardi.');
    }
}

// Carica dati azienda
async function loadCompanyData() {
    let companyDoc = null;
    let docExists = false;
    
    try {
        companyDoc = await db.collection('companies').doc(companyId).get();
        docExists = companyDoc.exists;
        
        if (!docExists) {
            console.log('Documento azienda non trovato, uso dati di default');
            companyData = {
                id: companyId,
                name: 'Salone di Bellezza'
            };
        } else {
            companyData = { id: companyDoc.id, ...companyDoc.data() };
        }
        
        // Mostra informazioni azienda
        const companyNameEl = document.getElementById('companyName');
        const companyDetailsEl = document.getElementById('companyDetails');
        
        if (companyNameEl) {
            companyNameEl.textContent = companyData.name || 'Salone di Bellezza';
        }
        
        if (companyDetailsEl) {
            if (!docExists) {
                companyDetailsEl.textContent = 'Compila il profilo salone nella dashboard per mostrare le informazioni qui.';
                companyDetailsEl.style.fontStyle = 'italic';
                companyDetailsEl.style.color = '#666';
            } else {
                let details = [];
                if (companyData.address) details.push(companyData.address);
                if (companyData.city) details.push(companyData.city);
                if (companyData.phone) details.push(`Tel: ${companyData.phone}`);
                if (companyData.email) details.push(`Email: ${companyData.email}`);
                
                companyDetailsEl.textContent = details.length > 0 
                    ? details.join(' | ') 
                    : 'Compila il profilo salone nella dashboard per mostrare le informazioni qui.';
            }
        }
    } catch (error) {
        console.error('Errore nel caricamento azienda:', error);
        companyData = {
            id: companyId,
            name: 'Salone di Bellezza'
        };
        
        const companyNameEl = document.getElementById('companyName');
        const companyDetailsEl = document.getElementById('companyDetails');
        
        if (companyNameEl) {
            companyNameEl.textContent = 'Salone di Bellezza';
        }
        
        if (companyDetailsEl) {
            companyDetailsEl.textContent = 'Errore nel caricamento informazioni salone. La prenotazione funzionerà comunque.';
            companyDetailsEl.style.fontStyle = 'italic';
            companyDetailsEl.style.color = '#666';
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    const form = document.getElementById('bookingForm');
    const dateInput = document.getElementById('bookingDate');
    const timeInput = document.getElementById('bookingTime');
    
    // Controlla conflitti quando cambiano data/ora
    dateInput.addEventListener('change', () => checkConflicts());
    timeInput.addEventListener('change', () => checkConflicts());
    
    // Submit form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitBooking();
    });
}

// Controlla conflitti con altre prenotazioni
async function checkConflicts() {
    const date = document.getElementById('bookingDate').value;
    const time = document.getElementById('bookingTime').value;
    const service = document.getElementById('service').value;
    
    if (!date || !time || !service) {
        hideConflictWarning();
        return;
    }
    
    try {
        const bookingDateTime = new Date(`${date}T${time}`);
        const now = new Date();
        
        if (bookingDateTime <= now) {
            showConflictWarning('La data e ora devono essere nel futuro.');
            return;
        }
        
        const minDateTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        if (bookingDateTime < minDateTime) {
            showConflictWarning('Le prenotazioni devono essere effettuate con almeno 24 ore di anticipo.');
            return;
        }
        
        const duration = SERVICE_DURATIONS[service] || 60;
        const endDateTime = new Date(bookingDateTime.getTime() + duration * 60 * 1000);
        
        const startTimestamp = firebase.firestore.Timestamp.fromDate(bookingDateTime);
        const endTimestamp = firebase.firestore.Timestamp.fromDate(endDateTime);
        
        const conflictsQuery = await db.collection('bookings')
            .where('companyId', '==', companyId)
            .where('status', 'in', ['pending', 'confirmed'])
            .where('dateTime', '>=', startTimestamp)
            .where('dateTime', '<', endTimestamp)
            .get();
        
        const conflictsBeforeQuery = await db.collection('bookings')
            .where('companyId', '==', companyId)
            .where('status', 'in', ['pending', 'confirmed'])
            .where('dateTime', '<', startTimestamp)
            .get();
        
        let hasConflict = false;
        
        if (!conflictsQuery.empty) {
            hasConflict = true;
        }
        
        if (!conflictsBeforeQuery.empty) {
            conflictsBeforeQuery.forEach(doc => {
                const booking = doc.data();
                const bookingStart = booking.dateTime.toDate();
                const serviceDuration = SERVICE_DURATIONS[booking.service] || 60;
                const bookingEnd = new Date(bookingStart.getTime() + serviceDuration * 60 * 1000);
                
                if (bookingEnd > bookingDateTime) {
                    hasConflict = true;
                }
            });
        }
        
        if (hasConflict) {
            showConflictWarning('Questo slot temporale è già occupato. Ti consigliamo di scegliere un altro orario.');
        } else {
            hideConflictWarning();
        }
    } catch (error) {
        console.error('Errore nel controllo conflitti:', error);
        hideConflictWarning();
    }
}

// Mostra warning conflitto
function showConflictWarning(message) {
    const warning = document.getElementById('conflictWarning');
    const details = document.getElementById('conflictDetails');
    
    if (details) {
        details.textContent = message;
    }
    
    if (warning) {
        warning.classList.add('show');
    }
}

// Nascondi warning conflitto
function hideConflictWarning() {
    const warning = document.getElementById('conflictWarning');
    if (warning) {
        warning.classList.remove('show');
    }
}

// Invia prenotazione
async function submitBooking() {
    hideMessages();
    
    if (!validateForm()) {
        return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Invio in corso...';
    
    try {
        const clientName = document.getElementById('clientName').value.trim();
        const clientEmail = document.getElementById('clientEmail').value.trim();
        const clientPhone = document.getElementById('clientPhone').value.trim();
        const service = document.getElementById('service').value;
        const date = document.getElementById('bookingDate').value;
        const time = document.getElementById('bookingTime').value;
        const notes = document.getElementById('notes').value.trim();
        
        const bookingDateTime = new Date(`${date}T${time}`);
        const now = new Date();
        
        if (bookingDateTime <= now) {
            throw new Error('La data e ora devono essere nel futuro.');
        }
        
        const minDateTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        if (bookingDateTime < minDateTime) {
            throw new Error('Le prenotazioni devono essere effettuate con almeno 24 ore di anticipo.');
        }
        
        await checkConflicts();
        const conflictWarning = document.getElementById('conflictWarning');
        if (conflictWarning && conflictWarning.classList.contains('show')) {
            throw new Error('Questo slot temporale è già occupato. Scegli un altro orario.');
        }
        
        // Cerca o crea cliente
        let userId = null;
        let userEmail = clientEmail;
        
        if (clientEmail) {
            const usersQuery = await db.collection('users')
                .where('email', '==', clientEmail)
                .limit(1)
                .get();
            
            if (!usersQuery.empty) {
                userId = usersQuery.docs[0].id;
                const userData = usersQuery.docs[0].data();
                await db.collection('users').doc(userId).update({
                    displayName: clientName,
                    phone: clientPhone || userData.phone || '',
                    updatedAt: getTimestamp()
                });
            } else {
                const newUserRef = db.collection('users').doc();
                userId = newUserRef.id;
                await newUserRef.set({
                    email: clientEmail,
                    displayName: clientName,
                    phone: clientPhone || '',
                    address: '',
                    createdAt: getTimestamp(),
                    updatedAt: getTimestamp()
                });
            }
        } else {
            const newUserRef = db.collection('users').doc();
            userId = newUserRef.id;
            await newUserRef.set({
                email: '',
                displayName: clientName,
                phone: clientPhone || '',
                address: '',
                createdAt: getTimestamp(),
                updatedAt: getTimestamp()
            });
        }
        
        // Crea prenotazione
        const bookingData = {
            companyId: companyId,
            userId: userId,
            userName: clientName,
            userEmail: userEmail,
            userPhone: clientPhone,
            service: service,
            dateTime: firebase.firestore.Timestamp.fromDate(bookingDateTime),
            notes: notes || '',
            paymentMethod: 'presenza',
            status: 'pending',
            source: 'public',
            createdAt: getTimestamp(),
            updatedAt: getTimestamp()
        };
        
        const bookingRef = await db.collection('bookings').add(bookingData);
        
        showSuccess(`Prenotazione inviata con successo! Il numero di prenotazione è: ${bookingRef.id.substring(0, 8).toUpperCase()}. 
                     Il salone ti contatterà per confermare l'appuntamento.`);
        
        document.getElementById('bookingForm').reset();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
    } catch (error) {
        console.error('Errore nella creazione prenotazione:', error);
        showError(error.message || 'Errore nell\'invio della prenotazione. Riprova più tardi.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Invia Prenotazione';
    }
}

// Valida form
function validateForm() {
    const clientName = document.getElementById('clientName').value.trim();
    const clientEmail = document.getElementById('clientEmail').value.trim();
    const clientPhone = document.getElementById('clientPhone').value.trim();
    const service = document.getElementById('service').value;
    const date = document.getElementById('bookingDate').value;
    const time = document.getElementById('bookingTime').value;
    
    if (!clientName) {
        showError('Inserisci nome e cognome.');
        return false;
    }
    
    if (clientEmail && !isValidEmail(clientEmail)) {
        showError('Inserisci un\'email valida o lascia il campo vuoto.');
        return false;
    }
    
    if (!clientPhone) {
        showError('Inserisci un numero di telefono.');
        return false;
    }
    
    if (!service) {
        showError('Seleziona un servizio.');
        return false;
    }
    
    if (!date || !time) {
        showError('Seleziona data e ora.');
        return false;
    }
    
    const bookingDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    
    if (bookingDateTime <= now) {
        showError('La data e ora devono essere nel futuro.');
        return false;
    }
    
    const minDateTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (bookingDateTime < minDateTime) {
        showError('Le prenotazioni devono essere effettuate con almeno 24 ore di anticipo.');
        return false;
    }
    
    return true;
}

// Valida email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Mostra errore
function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Mostra successo
function showSuccess(message) {
    const successEl = document.getElementById('successMessage');
    if (successEl) {
        successEl.textContent = message;
        successEl.classList.add('show');
    }
}

// Nascondi messaggi
function hideMessages() {
    const errorEl = document.getElementById('errorMessage');
    const successEl = document.getElementById('successMessage');
    
    if (errorEl) errorEl.classList.remove('show');
    if (successEl) successEl.classList.remove('show');
}

// Mostra errore generale
function showInitialError(message) {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const errorMsgEl = document.getElementById('errorMessage');
    
    if (loadingState) {
        loadingState.classList.remove('show');
    }
    
    if (errorState) {
        errorState.style.display = 'block';
    }
    
    if (errorMsgEl) {
        errorMsgEl.textContent = message;
    }
    
    const currentUrlDebug = document.getElementById('currentUrlDebug');
    const companyIdDebug = document.getElementById('companyIdDebug');
    
    if (currentUrlDebug) {
        currentUrlDebug.textContent = window.location.href;
    }
    
    if (companyIdDebug) {
        const urlParams = new URLSearchParams(window.location.search);
        companyIdDebug.textContent = urlParams.get('companyId') || urlParams.get('id') || 'Nessuno';
    }
    
    console.error('Errore inizializzazione:', message);
}

