const passwordInput = document.getElementById("admin-password");
const adminButton = document.getElementById("admin-login-button");
const message = document.getElementById("admin-login-message");

const password = "adminUser123";

adminButton.addEventListener("click", function() {
    let enteredPassword = passwordInput.value;

    if (enteredPassword === password) {
        message.textContent = "";
        window.location.href = "liveResults.html";
    } else {
        message.textContent = "Falsches Passwort! Zugriff verweigert.";
        passwordInput.value = "";
    }
});


passwordInput.addEventListener("input", function() {
    message.textContent = "";
});


passwordInput.addEventListener("keydown", function(event){

    if(event.key === "Enter"){
        adminButton.click();
    }

});