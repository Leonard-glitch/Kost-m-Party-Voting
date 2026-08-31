const passwordInput = document.getElementById("admin-password");
const adminButton = document.getElementById("admin-login-button");
const message = document.getElementById("admin-login-message");

// Fester Admin-Login-Name. Das ist KEIN Geheimnis (so wenig wie ein Benutzername
// es je ist) - der eigentliche Schutz kommt vom Passwort, das serverseitig von
// Firebase Authentication geprüft wird, nicht mehr im Code steht.
//
// WICHTIG: Dieser Wert muss exakt mit dem Nutzer übereinstimmen, den du in der
// Firebase Console unter Authentication -> Users anlegst. Siehe README.md.
const ADMIN_EMAIL = "admin@kostuemparty.app";

adminButton.addEventListener("click", async function () {
    const enteredPassword = passwordInput.value;

    if (!enteredPassword) {
        message.textContent = "Bitte Passwort eingeben.";
        return;
    }

    adminButton.disabled = true;
    message.textContent = "";

    try {
        await firebase.auth().signInWithEmailAndPassword(ADMIN_EMAIL, enteredPassword);
        window.location.href = "liveResults.html";
    } catch (error) {
        console.error("Login fehlgeschlagen:", error.code);
        message.textContent = "Falsches Passwort! Zugriff verweigert.";
        passwordInput.value = "";
    } finally {
        adminButton.disabled = false;
    }
});

passwordInput.addEventListener("input", function () {
    message.textContent = "";
});

passwordInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        adminButton.click();
    }
});
