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

    if (localStorage.getItem("voted")){messages.textContent="Sie haben bereits abgestimmt!"; return; }

    let number=kostuemNumber.value;

    messages.textContent = "";

    if(isNaN(number) || number.includes(".") || number.includes(",")){messages.innerHTML=`Bitte geben Sie eine gültige, ganze Zahl ein.`; return; }
    if(number===""){messages.innerHTML=`Bitte geben Sie eine Zahl zwischen ${minZahl} und ${maxZahl} ein.`; return; }
    if(number<minZahl || number>maxZahl){messages.innerHTML=`Bitte geben Sie eine Zahl zwischen ${minZahl} und ${maxZahl} ein.`; return; }

    

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

kostuemNumber.addEventListener("input", function() {
    messages.textContent = "";
});


kostuemNumber.addEventListener("keydown", function(event){

    if(event.key === "Enter"){
        voteButton.click();
    }

});