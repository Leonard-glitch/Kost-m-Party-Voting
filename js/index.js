const voteButton=document.getElementById("vote-button");
const messages=document.getElementById("vote-message");
const kostuemNumber=document.getElementById("kostum-input");

const minZahl=1;
const maxZahl=200;

localStorage.clear();  //Zum Testen, jedes Mal LocalStorage löschen

voteButton.addEventListener("click", async function(){

    if (localStorage.getItem("voted")){ messages.style.display="block"; messages.textContent="Sie haben bereits abgestimmt!"; return; }

    let number=kostuemNumber.value;

    messages.style.display="none";

    if(isNaN(number)){ messages.style.display="block"; messages.textContent="Bitte geben Sie eine gültige Zahl ein."; return; }
    if(number===""){ messages.style.display="block"; messages.textContent="Bitte geben Sie eine Zahl ein."; return; }
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



//Admin-Login

const passwordInput=document.getElementById("admin-password");
const adminButton=document.getElementById("admin-login-button");

const password="admin123";

adminButton.addEventListener("click", function(){
    let enteredPassword=passwordInput.value;

    if(enteredPassword===password){
        window.location.href="html/liveResults.html";
    }
})