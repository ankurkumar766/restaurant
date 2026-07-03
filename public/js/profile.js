// ================= Profile Image Preview =================

const upload = document.getElementById("profileUpload");
const preview = document.getElementById("profilePreview");

upload.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) return;

    // Image Preview
    const reader = new FileReader();

    reader.onload = function (e) {

        preview.src = e.target.result;

        // Browser me save rahega
        localStorage.setItem("profileImage", e.target.result);

    };

    reader.readAsDataURL(file);

});


// ================= Load Saved Image =================

window.addEventListener("load", () => {

    const savedImage = localStorage.getItem("profileImage");

    if(savedImage){

        preview.src = savedImage;

    }

});