db.collection('kostueme').onSnapshot(snapshot => {
    const container = document.getElementById('rankingsContainer');
    const totalDisplay = document.getElementById('total-votes');
    let data = [];
    let totalVotes = 0; // Hier starten wir bei 0
    
    snapshot.forEach(doc => {
        const item = doc.data();
        data.push({ id: doc.id, ...item });
        
        // Jede Stimme zur Gesamtsumme addieren
        totalVotes += item.votes || 0;
    });

    // Anzeige der Gesamtstimmen aktualisieren
    totalDisplay.textContent = totalVotes;

    data.sort((a, b) => b.votes - a.votes);

    // 1. Die höchste Stimmenzahl finden
    const maxVotes = data.length > 0 ? data[0].votes : 0;

    container.innerHTML = '';
    
    data.forEach((item) => {
        // 2. Prozentwert berechnen (Vermeidung von Division durch 0)
        const barPercentage = maxVotes > 0 ? (item.votes / maxVotes) * 100 : 0;

        container.innerHTML += `
            <div class="bar-row">
                <div class="bar-label">#${item.id}</div>
                <div class="bar-wrapper"> <div class="bar-fill" style="width: ${barPercentage}%"></div>
                    <div class="bar-count">${item.votes} Stimmen</div>
                </div>
            </div>
        `;
    });
});