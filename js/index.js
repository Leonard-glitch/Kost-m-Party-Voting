// ACHTUNG: Nur für lokales Testen einkommentieren, um die eigene Sperre
// zurückzusetzen! Diese Zeile darf beim eigentlichen Event NIEMALS aktiv
// sein - sonst kann jede:r durch einfaches Neuladen der Seite beliebig oft
// abstimmen.
// localStorage.clear();

addEventListener('pageshow', function () {
    if (localStorage.getItem("voted")) {
        lockForm();
        showMessage("Du hast bereits abgestimmt.", "info");
    }
    getKostuemes();
    updateConnectionBanner();
});

window.addEventListener('online', updateConnectionBanner);
window.addEventListener('offline', updateConnectionBanner);

// Zeigt einen Hinweisbalken, wenn das Gerät gerade keine Internetverbindung
// hat. Das ersetzt keine der Absicherungen weiter unten (navigator.onLine
// lügt manchmal, z.B. bei Captive-Portals) - es ist nur ein früher, klarer
// Hinweis an die Person, damit sie nicht rätselt, warum nichts passiert.
function updateConnectionBanner() {
    const banner = document.getElementById('connection-banner');
    if (!banner) return;

    if (navigator.onLine) {
        banner.textContent = '';
        banner.classList.remove('visible');
    } else {
        banner.textContent = '⚠️ Keine Internetverbindung – Abstimmen ist gerade nicht möglich.';
        banner.classList.add('visible');
    }
}

// Zeigt eine Nachricht im passenden Zustand an (Speichern/Erfolg/Warnung/Fehler).
function showMessage(text, type) {
    const messageElement = document.getElementById("vote-message");

    messageElement.textContent = text;
    messageElement.classList.remove("is-error", "is-success", "is-warning");

    if (type === "error") messageElement.classList.add("is-error");
    if (type === "success") messageElement.classList.add("is-success");
    if (type === "warning") messageElement.classList.add("is-warning");

    messageElement.style.display = text ? "block" : "none";
}

// Hält die aktuell aktive Firestore-Verbindung, damit wir sie vor einem
// erneuten Aufruf (z.B. durch mehrfaches "pageshow" bei Zurück-Navigation)
// sauber beenden können, statt mehrere Listener parallel laufen zu lassen.
let unsubscribeKostuemes = null;

function getKostuemes() {
    if (unsubscribeKostuemes) {
        unsubscribeKostuemes();
        unsubscribeKostuemes = null;
    }

    const kostuemTable = document.getElementById("kostuemTable");

    unsubscribeKostuemes = db.collection('kostuemListe').onSnapshot(snapshot => {
        kostuemTable.innerHTML = '';

        const hasVoted = localStorage.getItem("voted");

        if (snapshot.empty) {
            const empty = document.createElement('p');
            empty.className = 'empty-state';
            empty.textContent = 'Noch keine Kostüme zum Abstimmen vorhanden.';
            kostuemTable.appendChild(empty);
            return;
        }

        snapshot.forEach(doc => {
            const id = doc.id;
            const data = doc.data();
            const name = data.name;

            const row = document.createElement('div');
            row.className = 'costuemRow';

            const label = document.createElement('span');
            label.className = 'kostuemName';
            label.textContent = `${name}`;

            const kostuemBtn = document.createElement('button');
            kostuemBtn.className = 'voteBtn';
            kostuemBtn.dataset.id = id;

            if (hasVoted) {
                kostuemBtn.disabled = true;
                kostuemBtn.textContent = 'Bereits abgestimmt ✓';
            } else {
                kostuemBtn.textContent = 'Abstimmen';
            }

            row.appendChild(label);
            row.appendChild(kostuemBtn);
            kostuemTable.appendChild(row);
        });

        const buttons = document.querySelectorAll('.voteBtn');
        buttons.forEach(button => {
            button.addEventListener('click', function () {
                // Zusätzlicher Schutz gegen schnelles Doppelklicken
                if (localStorage.getItem("voted")) return;

                lockForm();
                const id = this.dataset.id;
                handleVote(id);
            });
        });
    }, error => {
        showMessage("Kostüme konnten nicht geladen werden.", "error");
    });
}

// Sperrt alle Vote-Buttons, z.B. während/nach dem Abstimmen.
function lockForm() {
    const buttons = document.querySelectorAll('.voteBtn');
    buttons.forEach(button => {
        button.disabled = true;
        button.textContent = "Bereits abgestimmt ✓";
    });
}

// Gibt alle Vote-Buttons wieder frei - nur aufrufen, wenn wirklich sicher
// feststeht, dass keine Stimme gezählt wurde.
function unlockForm() {
    const buttons = document.querySelectorAll('.voteBtn');
    buttons.forEach(button => {
        button.disabled = false;
        button.textContent = "Abstimmen";
    });
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Wie lange wir auf eine Bestätigung vom Server warten, bevor wir der Person
// Rückmeldung geben, dass es länger dauert. Bewusst kein "Fehlschlag" -
// siehe Begründung in handleVote().
const VOTE_TIMEOUT_MS = 10000;

async function handleVote(documentId) {
    if (localStorage.getItem("voted")) {
        lockForm();
        showMessage("Du hast bereits abgestimmt.", "error");
        return;
    }

    console.log("Abstimmung für ID:", documentId);

    // Zuerst lokal sperren, damit kein zweiter Klick (auf diesen oder einen
    // anderen Kostüm-Button) mehr durchkommt, während der Schreibvorgang
    // noch läuft - unabhängig davon, wie lange er dauert.
    localStorage.setItem("voted", "true");
    lockForm();
    showMessage("Wird gespeichert…", null);

    const docRef = db.collection('kostuemListe').doc(documentId);
    const writePromise = docRef.set({
        votes: firebase.firestore.FieldValue.increment(1)
    }, { merge: true });

    const TIMEOUT = Symbol("timeout");

    try {
        const outcome = await Promise.race([
            writePromise.then(() => "success"),
            wait(VOTE_TIMEOUT_MS).then(() => TIMEOUT)
        ]);

        if (outcome === TIMEOUT) {
            // WICHTIG: Ein Timeout heißt NICHT, dass die Stimme verloren ist.
            // Firebase versucht im Hintergrund weiter, sie zu senden, sobald
            // wieder Verbindung besteht (z.B. nach einem kurzen WLAN-Hänger).
            // Würden wir jetzt den Button wieder freigeben und die Person
            // stimmt erneut ab, UND die ursprüngliche Stimme kommt später
            // doch noch durch, wäre eine Stimme doppelt gezählt. Deshalb
            // bleibt das Formular gesperrt - wir informieren nur.
            showMessage(
                "Das dauert gerade länger als sonst. Deine Stimme wird gesendet, sobald die Verbindung wieder stabil ist – bitte die Seite jetzt nicht neu laden und nicht nochmal klicken.",
                "warning"
            );
            handleDelayedOutcome(writePromise);
            return;
        }

        showMessage("Danke! Deine Stimme wurde gezählt. 🎉", "success");

    } catch (error) {
        // Schneller, endgültiger Fehler (z.B. keine Berechtigung, Kostüm
        // existiert nicht mehr). Hier wissen wir sicher, dass nichts
        // gespeichert wurde - deshalb ist ein Reset jetzt sicher.
        console.error("Fehler beim Voten:", error);
        localStorage.removeItem("voted");
        showMessage("Da ist leider etwas schiefgelaufen. Bitte versuch es noch einmal.", "error");
        unlockForm();
    }
}

// Wird nur nach einem Timeout aufgerufen, um die ursprüngliche Anfrage im
// Hintergrund weiterzuverfolgen und der Person noch eine endgültige
// Rückmeldung zu geben - ohne das Formular zwischenzeitlich freizugeben.
function handleDelayedOutcome(writePromise) {
    writePromise.then(() => {
        showMessage("Jetzt hat's geklappt – deine Stimme wurde gezählt. 🎉", "success");
    }).catch((error) => {
        console.error("Fehler beim Voten (nach Timeout):", error);
        localStorage.removeItem("voted");
        showMessage("Da ist leider doch etwas schiefgelaufen. Bitte versuch es noch einmal.", "error");
        unlockForm();
    });
}
