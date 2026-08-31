// Zugriffsschutz: Ohne gültigen Login (Firebase Authentication) landet man
// sofort zurück auf der Login-Seite. Das ist echter, serverseitig geprüfter
// Schutz - im Gegensatz zu vorher, wo diese Seite über die URL direkt ohne
// jeden Login erreichbar war.
firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
        window.location.href = "login.html";
        return;
    }
    startLiveResults();
});

addEventListener('pageshow', function () {
    firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
        window.location.href = "login.html";
        return;
    }
    startLiveResults();
});
});

document.getElementById('logout-button').addEventListener('click', function () {
    firebase.auth().signOut().then(() => {
        window.location.href = "login.html";
    });
});

function startLiveResults() {
    const container = document.getElementById('rankingsContainer');
    const totalDisplay = document.getElementById('total-votes');

    db.collection('kostueme').onSnapshot(snapshot => {
        let data = [];
        let totalVotes = 0; // Hier starten wir bei 0

        snapshot.forEach(doc => {
            const item = doc.data();

            // Nur echte, nicht-negative Zahlen als Stimmen akzeptieren.
            // Schützt die Anzeige, falls doch einmal unerwartete Daten in der
            // Datenbank landen (z. B. durch einen Bug oder einen manuellen Eingriff).
            const votes = (typeof item.votes === "number" && Number.isFinite(item.votes) && item.votes >= 0)
                ? item.votes
                : 0;

            data.push({ id: doc.id, votes });

            // Jede Stimme zur Gesamtsumme addieren
            totalVotes += votes;
        });

        // Anzeige der Gesamtstimmen aktualisieren
        totalDisplay.textContent = totalVotes;

        data.sort((a, b) => b.votes - a.votes);

        // 1. Die höchste Stimmenzahl finden
        const maxVotes = data.length > 0 ? data[0].votes : 0;

        container.innerHTML = ''; // Container leeren - hier stehen keine dynamischen Werte drin

        data.forEach((item) => {
            // 2. Prozentwert berechnen (Vermeidung von Division durch 0)
            const barPercentage = maxVotes > 0 ? (item.votes / maxVotes) * 100 : 0;

            // Aufbau per DOM-Methoden statt innerHTML-String-Konkatenation:
            // item.id / item.votes landen über textContent im DOM und werden
            // dadurch NIE als HTML interpretiert - das schließt die vorherige
            // XSS-Lücke (z.B. über manipulierte Dokument-IDs in Firestore).
            const row = document.createElement('div');
            row.className = 'bar-row';

            const label = document.createElement('div');
            label.className = 'bar-label';
            label.textContent = `#${item.id}`;

            const wrapper = document.createElement('div');
            wrapper.className = 'bar-wrapper';

            const fill = document.createElement('div');
            fill.className = 'bar-fill';
            fill.style.width = `${barPercentage}%`;

            const count = document.createElement('div');
            count.className = 'bar-count';
            count.textContent = `${item.votes} Stimmen`;

            wrapper.appendChild(fill);
            wrapper.appendChild(count);
            row.appendChild(label);
            row.appendChild(wrapper);
            container.appendChild(row);
        });
    }, error => {
        console.error("Fehler beim Laden der Live-Ergebnisse:", error);
        container.textContent = "Ergebnisse konnten nicht geladen werden.";
    });
}
