let deferredPrompt = null;

const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", event => {

    event.preventDefault();

    deferredPrompt = event;

    if (installBtn) {
        installBtn.style.display = "flex";
    }
});

if (installBtn) {

    installBtn.addEventListener("click", async () => {

        if (!deferredPrompt) {
            alert("Install option is not available on this browser right now.");
            return;
        }

        deferredPrompt.prompt();

        await deferredPrompt.userChoice;

        deferredPrompt = null;

        installBtn.style.display = "none";
    });
}

window.addEventListener("appinstalled", () => {

    if (installBtn) {
        installBtn.style.display = "none";
    }

    console.log("AR Food installed successfully");
});