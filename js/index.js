// Nur zum Testen einkommentieren, um die Abstimmung wieder freizugeben
localStorage.clear(); 

addEventListener('pageshow', function () {
    if (localStorage.getItem("voted")) {
        lockForm();
        showMessage("Du hast bereits abgestimmt.", "info");
    }
    getKostuemes();
});

// Zeigt eine Nachricht im passenden Zustand (Erfolg/Fehler/neutral) an.
function showMessage(text, type) {
    // FIX: Das Element muss erst über die ID aus dem HTML geholt werden
    const messageElement = document.getElementById("vote-message");
    
    messageElement.textContent = text;
    messageElement.classList.remove("is-error", "is-success");
    
    if (type === "error") messageElement.classList.add("is-error");
    if (type === "success") messageElement.classList.add("is-success");
    
    messageElement.style.display = text ? "block" : "none";
}

function getKostuemes() {
    const kostuemTable = document.getElementById("kostuemTable");
    const voteMessage = document.getElementById("vote-message");

    db.collection('kostuemListe').onSnapshot(snapshot => {
        kostuemTable.innerHTML = ''; // Liste vor dem Neuzeichnen leeren
        
        // FIX: Einmal am Anfang prüfen, ob lokal schon abgestimmt wurde
        const hasVoted = localStorage.getItem("voted"); 

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

            // FIX: Wenn bereits abgestimmt wurde, Button direkt beim Erstellen sperren
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

        // Event-Listener an die neu erstellten Buttons hängen
        const buttons = document.querySelectorAll('.voteBtn');
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                // Zusätzlicher Schutz gegen schnelles Doppelklicken
                if (localStorage.getItem("voted")) return; 
                
                lockForm(); 
                const id = this.dataset.id;
                
                // FIX: Den geklickten Button übergeben, falls wir ihn bei einem Fehler entsperren müssen
                handleVote(id, this); 
            });
        });
    }, error => {
        showMessage("Kostüme konnten nicht geladen werden.", "error");
    });
}

// Sperrt das Formular, z. B. wenn schon abgestimmt wurde.
function lockForm() {
    const buttons = document.querySelectorAll('.voteBtn');
    buttons.forEach(button => {
        button.disabled = true;
        button.textContent = "Bereits abgestimmt ✓";
    });
}

async function handleVote(documentId, clickedButton) {
    if (localStorage.getItem("voted")) {
        lockForm();
        showMessage("Du hast bereits abgestimmt.", "error");
        return;
    }

    console.log("Abstimmung für ID:", documentId);

    try {
        // Zuerst lokal speichern, um sofortige Folgeklicks komplett zu unterbinden
        localStorage.setItem("voted", "true");
        lockForm(); 

        const docRef = db.collection('kostuemListe').doc(documentId);
        
        await docRef.set({
            votes: firebase.firestore.FieldValue.increment(1)
        }, { merge: true }); 

        showMessage("Danke! Deine Stimme wurde gezählt. 🎉", "success");

    } catch (error) {
        console.error("Fehler beim Voten:", error);
        
        // Abstimmung ist fehlgeschlagen -> Lokale Sperre aufheben
        localStorage.removeItem("voted"); 
        showMessage("Da ist leider etwas schiefgelaufen. Bitte versuch es noch einmal.", "error");
        
        // Alle Buttons wieder freigeben, damit der User es nochmal versuchen kann
        const buttons = document.querySelectorAll('.voteBtn');
        buttons.forEach(button => {
            button.disabled = false;
            button.textContent = "Abstimmen";
        });
    }
}