db.collection('kostueme').onSnapshot(snapshot => {
  const container = document.getElementById('rankingsContainer');
  let data = [];
  
  snapshot.forEach(doc => {
    data.push({ id: doc.id, ...doc.data() });
  });

  // Sortieren: Meiste Stimmen nach oben
  data.sort((a, b) => b.votes - a.votes);

  // Anzeige leeren oder updaten
  container.innerHTML = '';
  
  data.forEach((item, index) => {
    // Wir berechnen die Breite (einfachheitshalber Stimmen * 10 Pixel)
    const barWidth = item.votes * 10; 

    container.innerHTML += `
      <div class="bar-row">
        <div class="bar-label">Number#${item.id}</div>
        <div class="bar-fill" style="width: ${barWidth}px"></div>
        <div class="bar-count">${item.votes}</div>
      </div>
    `;
  });
});