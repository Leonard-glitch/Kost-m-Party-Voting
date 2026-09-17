// Zugriffsschutz: Ohne gültigen Login (Firebase Authentication) landet man
// sofort zurück auf der Login-Seite. Das ist echter, serverseitig geprüfter
// Schutz - im Gegensatz zu vorher, wo diese Seite über die URL direkt ohne
// jeden Login erreichbar war.

// Hält die aktuell aktive Firestore-Verbindung fest, damit wir sie sauber
// beenden können, statt bei jedem erneuten Start eine weitere parallel
// laufen zu lassen.
let unsubscribeResults = null;

firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
        if (unsubscribeResults) {
            unsubscribeResults();
            unsubscribeResults = null;
        }
        window.location.href = "login.html";
        return;
    }
    startLiveResults();
});

// Wenn die Seite aus dem Browser-Cache zurückkommt (z.B. nach einer
// "Zurück"-Geste am Handy), stellen wir sicher, dass die Live-Verbindung
// noch läuft. WICHTIG: Hier bewusst KEIN erneutes onAuthStateChanged -
// das würde bei jedem pageshow einen weiteren, dauerhaften Listener
// registrieren und über den Abend hinweg immer mehr parallele
// Firestore-Verbindungen öffnen (die alte Version hatte genau dieses
// Problem).
addEventListener('pageshow', function () {
    if (firebase.auth().currentUser) {
        startLiveResults();
    }
});

document.getElementById('logout-button').addEventListener('click', function () {
    if (unsubscribeResults) {
        unsubscribeResults();
        unsubscribeResults = null;
    }
    firebase.auth().signOut().then(() => {
        window.location.href = "login.html";
    });
});

// Zeigt an, wenn die gerade angezeigten Daten aus dem lokalen Cache kommen
// (also möglicherweise nicht mehr live/aktuell sind), statt frisch vom
// Server. Das ist präziser als ein simples "online/offline", weil es sich
// direkt auf die Daten bezieht, die gerade auf dem Bildschirm stehen.
function setConnectionBanner(isStale) {
    const banner = document.getElementById('connection-banner');
    if (!banner) return;

    if (isStale) {
        banner.textContent = '⚠️ Keine aktuelle Verbindung – gezeigte Zahlen können veraltet sein.';
        banner.classList.add('visible');
    } else {
        banner.textContent = '';
        banner.classList.remove('visible');
    }
}

function startLiveResults() {
    // Falls schon eine Verbindung läuft (z.B. erneut ausgelöst durch
    // pageshow), zuerst sauber beenden statt eine zweite parallel zu öffnen.
    if (unsubscribeResults) {
        unsubscribeResults();
        unsubscribeResults = null;
    }

    const container = document.getElementById('rankingsContainer');
    const totalDisplay = document.getElementById('total-votes');

    unsubscribeResults = db.collection('kostuemListe').onSnapshot(snapshot => {
        setConnectionBanner(snapshot.metadata.fromCache);

        let data = [];
        let totalVotes = 0;

        snapshot.forEach(doc => {
            const item = doc.data();

            // Nur echte, nicht-negative Zahlen als Stimmen akzeptieren.
            const votes = (typeof item.votes === "number" && Number.isFinite(item.votes) && item.votes >= 0)
                ? item.votes
                : 0;

            data.push({ name: item.name, votes });
            totalVotes += votes;
        });

        totalDisplay.textContent = totalVotes;
        data.sort((a, b) => b.votes - a.votes);

        container.innerHTML = '';

        if (data.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'empty-state';
            empty.textContent = 'Noch keine Kostüme angelegt.';
            container.appendChild(empty);
            return;
        }

        const maxVotes = data[0].votes;

        // Gemeinsamer Rang bei Stimmengleichheit (1-2-2-4 statt 1-2-3-4):
        // zwei punktgleiche Kostüme zeigen dadurch auch wirklich beide
        // dieselbe Medaille statt willkürlich Gold/Silber je nach
        // Sortier-Reihenfolge.
        let previousVotes = null;
        let previousRank = 0;

        data.forEach((item, index) => {
            const rank = (item.votes === previousVotes) ? previousRank : index + 1;
            previousVotes = item.votes;
            previousRank = rank;

            const barPercentage = maxVotes > 0 ? (item.votes / maxVotes) * 100 : 0;
            const tier = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : null;
            const tierClass = tier ? ` tier-${tier}` : '';
            const medalIcon = { gold: '🥇', silver: '🥈', bronze: '🥉' };

            // Aufbau per DOM-Methoden statt innerHTML-String-Konkatenation:
            // item.name / item.votes landen über textContent im DOM und
            // werden dadurch NIE als HTML interpretiert.
            const row = document.createElement('div');
            row.className = 'bar-row' + tierClass;

            const badge = document.createElement('div');
            badge.className = 'rank-badge' + tierClass;
            badge.textContent = tier ? medalIcon[tier] : String(rank);
            badge.setAttribute('aria-label', `Platz ${rank}`);

            const label = document.createElement('div');
            label.className = 'bar-label';
            label.textContent = `${item.name}`;

            const wrapper = document.createElement('div');
            wrapper.className = 'bar-wrapper';

            const fill = document.createElement('div');
            fill.className = 'bar-fill' + tierClass;
            fill.style.width = `${barPercentage}%`;

            const count = document.createElement('div');
            count.className = 'bar-count';
            count.textContent = `${item.votes} Stimmen`;

            wrapper.appendChild(fill);
            wrapper.appendChild(count);
            row.appendChild(badge);
            row.appendChild(label);
            row.appendChild(wrapper);
            container.appendChild(row);
        });
    }, error => {
        console.error("Fehler beim Laden der Live-Ergebnisse:", error);
        container.textContent = "Ergebnisse konnten nicht geladen werden.";
    });
}
