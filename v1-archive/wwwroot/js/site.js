// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.




let currentStep = 0;

const steps = document.querySelectorAll(".step");
const progress = document.getElementById("progress");

// ✅ CORRECTION : on vérifie que les éléments du wizard existent avant de s'en servir
if (steps.length > 0 && progress) {

    function updateButtons() {
        document.querySelectorAll(".prev").forEach(btn => {
            btn.disabled = currentStep === 0;
        });
        document.querySelectorAll(".next").forEach(btn => {
            btn.disabled = currentStep === steps.length - 1;
        });
    }

    function updateWizard() {
        steps.forEach((step, i) => {
            step.classList.toggle("active", i === currentStep);
        });
        progress.style.width = ((currentStep + 1) / steps.length) * 100 + "%";
        updateButtons();
    }

    function validateStep(step) {
        const inputs = steps[step].querySelectorAll("input, textarea, select");
        for (let input of inputs) {
            if (!input.checkValidity()) {
                input.reportValidity();
                return false;
            }
        }
        return true;
    }

    document.querySelectorAll(".next").forEach(btn => {
        btn.addEventListener("click", () => {
            if (!validateStep(currentStep)) return;
            if (currentStep < steps.length - 1) {
                currentStep++;
                updateWizard();
            }
        });
    });

    document.querySelectorAll(".prev").forEach(btn => {
        btn.addEventListener("click", () => {
            if (currentStep > 0) {
                currentStep--;
                updateWizard();
            }
        });
    });

    /* INIT */
    updateWizard();

} // fin du if
