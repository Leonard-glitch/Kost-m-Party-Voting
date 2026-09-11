
//Neue Version...
addEventListener('pageshow', function () {
    getKostuemes();
});

function getKostuemes() {
    const kostuemTable=document.getElementById("kostuemTable");
    const voteMessage=document.getElementById("vote-message");

    

    db.collection('kostuemListe').onSnapshot(snapshot => {

        kostuemTable.innerHTML = ''; // Clear previous options

        snapshot.forEach(doc => {
            const id = doc.id;          // Die automatische Firebase-ID (z. B. "GcMQ5Jj...")
            const data = doc.data();    // Das ganze Daten-Objekt
            
            const name = data.name;    // Text: "Martin Luther King"

            const row = document.createElement('div');
            row.className = 'costuemRow';

            const label = document.createElement('span');
            label.className = 'kostuemName';
            label.textContent = `${name}`;

            const kostuemBtn = document.createElement('button');
            kostuemBtn.className = 'voteBtn';
            kostuemBtn.textContent = 'Abstimmen';
            kostuemBtn.dataset.id = id;

            row.appendChild(label);
            row.appendChild(kostuemBtn);
            kostuemTable.appendChild(row);

        });

        const buttons = document.querySelectorAll('.voteBtn');
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                const id = this.dataset.id;
                console.log(`Voting for costume with ID: ${id}`);
                handleVote(id, this);
            });
        });
    }, error => {
        voteMessage.textContent = "Kostüme konnten nicht geladen werden.";
    });
}

async function handleVote(documentId, clickedButton) {
    // Doppel-Check: Hat der Nutzer schon abgestimmt?
    if (localStorage.getItem("voted")) {
        lockForm();
        showMessage("Du hast bereits abgestimmt.", "error");
        return;
    }

console.log("Abstimmung für ID:", documentId);
console.log("Button-Element:", clickedButton);

    // Button temporär deaktivieren und Lade-Text zeigen
    clickedButton.disabled = true;
    clickedButton.textContent = "Lädt...";

    try {
        // Datenbank-Update ausführen (Stimme um 1 erhöhen)
        const docRef = db.collection('kostuemListe').doc(documentId);
        
        await docRef.set({
            votes: firebase.firestore.FieldValue.increment(1)
        }, { merge: true }); 

        // Lokal speichern, dass abgestimmt wurde
        localStorage.setItem("voted", "true");
        
        // UI aktualisieren
        showMessage("Danke! Deine Stimme wurde gezählt. 🎉", "success");
        lockForm(); // Sperrt ab sofort ALLE Buttons in der Liste

        console.log("Erfolgreich gespeichert für ID:", documentId);

    } catch (error) {
        console.error("Fehler beim Voten:", error);
        showMessage("Da ist leider etwas schiefgelaufen. Bitte versuch es noch einmal.", "error");
        
        // Im Fehlerfall den geklickten Button wieder freigeben
        clickedButton.disabled = false;
        clickedButton.textContent = "Vote";
    }
}