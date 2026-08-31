const voteButton = document.getElementById("vote-button");
const messages = document.getElementById("vote-message");
const kostuemNumber = document.getElementById("kostum-input");
const validNumbersSpan = document.getElementById("valid-numbers");

const minZahl = 1; // Jeweilige Zahlen werden miteinbezogen
const maxZahl = 200;

validNumbersSpan.textContent = `${minZahl}–${maxZahl}`;

// Zeigt eine Nachricht im passenden Zustand (Erfolg/Fehler/neutral) an.
function showMessage(text, type) {
    messages.textContent = text;
    messages.classList.remove("is-error", "is-success");
    if (type === "error") messages.classList.add("is-error");
    if (type === "success") messages.classList.add("is-success");
    messages.style.display = text ? "block" : "none";
}

// Sperrt das Formular, z. B. wenn schon abgestimmt wurde.
function lockForm() {
    kostuemNumber.disabled = true;
    voteButton.disabled = true;
    voteButton.textContent = "Bereits abgestimmt ✓";
}

// Beim Laden prüfen, ob auf diesem Gerät schon abgestimmt wurde.
// (HINWEIS: Das ist ein Komfort-/Anstands-Schutz, kein hartes Sicherheitsfeature -
// wer explizit die Browserdaten löscht oder ein anderes Gerät nutzt, kann das umgehen.
// Die serverseitigen Firestore Security Rules verhindern nur ungültige/manipulierte
// Werte, aber nicht "eine Stimme pro Person".)
if (localStorage.getItem("voted")) {
    lockForm();
    showMessage("Du hast bereits abgestimmt. Danke für deine Teilnahme! 🎉", "success");
}

voteButton.addEventListener("click", async function () {

    if (localStorage.getItem("voted")) {
        lockForm();
        showMessage("Du hast bereits abgestimmt. Danke für deine Teilnahme! 🎉", "success");
        return;
    }

    const rawInput = kostuemNumber.value.trim();

    // Strikte Prüfung: nur reine Ziffern erlaubt (keine "5abc", "1e5", Kommazahlen, etc.)
    if (!/^\d+$/.test(rawInput)) {
        showMessage("Bitte gib eine gültige Kostüm-Nummer ein (nur Ziffern).", "error");
        return;
    }

    const number = parseInt(rawInput, 10);

    if (number < minZahl || number > maxZahl) {
        showMessage(`Bitte gib eine Zahl zwischen ${minZahl} und ${maxZahl} ein.`, "error");
        return;
    }

    voteButton.disabled = true;
    voteButton.textContent = "Wird gespeichert …";

    try {
        const docRef = db.collection('kostueme').doc(number.toString());

        await docRef.set({
            votes: firebase.firestore.FieldValue.increment(1)
        }, { merge: true }); // Das hier ist wichtig!

        localStorage.setItem("voted", "true");
        showMessage(`Danke! Deine Stimme für Kostüm #${number} wurde gezählt. 🎉`, "success");
        lockForm();

        console.log("Erfolgreich gespeichert:", number);

    } catch (error) {
        console.error("Fehler beim Voten:", error);
        showMessage("Da ist leider etwas schiefgelaufen. Bitte versuch es noch einmal.", "error");
        voteButton.disabled = false;
        voteButton.textContent = "Abstimmen";
    }
});

kostuemNumber.addEventListener("input", function () {
    showMessage("");
});

kostuemNumber.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        voteButton.click();
    }
});
