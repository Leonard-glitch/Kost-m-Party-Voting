const voteButton=document.getElementById("vote-button");
const messages=document.getElementById("vote-message");
const kostuemNumber=document.getElementById("kostum-input");
const validNumbersSpan=document.getElementById("valid-numbers");

const minZahl=1; //Jeweilige Zahlen werden miteinbezogen
const maxZahl=200;

// Set the valid numbers in the span
validNumbersSpan.textContent = `${minZahl}-${maxZahl}`;

localStorage.clear();  //Zum Testen, jedes Mal LocalStorage löschen

voteButton.addEventListener("click", async function(){

    if (localStorage.getItem("voted")){ messages.style.display="block"; messages.textContent="Sie haben bereits abgestimmt!"; return; }

    let number=kostuemNumber.value;

    messages.style.display="none";

    if(isNaN(number)){ messages.style.display="block"; messages.innerHTML=`Bitte geben Sie eine gültige Zahl zwischen ${minZahl} und ${maxZahl} ein.`; return; }
    if(number===""){ messages.style.display="block"; messages.innerHTML=`Bitte geben Sie eine Zahl zwischen ${minZahl} und ${maxZahl} ein.`; return; }
    if(number<minZahl || number>maxZahl){ messages.style.display="block"; messages.innerHTML=`Bitte geben Sie eine Zahl zwischen ${minZahl} und ${maxZahl} ein.`; return; }

    

    try {
    const docRef = db.collection('kostueme').doc(number.toString());
    
    // Wir nutzen .set() statt .update()
    await docRef.set({
      votes: firebase.firestore.FieldValue.increment(1)
    }, { merge: true }); // Das hier ist wichtig!

    localStorage.setItem("voted", "true");
    messages.style.display = "block"; 
    messages.textContent = "Vielen Dank für Ihre Stimme!";

    console.log("Erfolgreich gespeichert:", number);

} catch (error) {
    console.error("Fehler beim Voten:", error);
}
})