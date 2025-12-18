const botones = document.querySelectorAll(".button-apply-job");

botones.forEach(boton => {
    boton.addEventListener("click", () => {
        boton.textContent = "¡Aplicado!";
        boton.disabled = true;
        boton.classList.add("is-applied"); // Corregido el typo y se usa la variable 'boton'
    });
});



// 1. Corregido el selector (sin espacios)
const filter = document.querySelector("#filtro-site-list"); 

// 2. Corregido el punto en vez de coma y cambiado el selector 
// (Asumo que el mensaje se muestra en un lugar diferente, ej: #mensaje-texto)
const mensaje = document.querySelector("#mensaje-texto"); 

filter.addEventListener("change", function() {
    const selectedValue = filter.value;

    // 3. Corregida la estructura if/else y las Template Strings
    if (selectedValue) {
        // Se usan comillas invertidas (` `) para usar ${}
        mensaje.textContent = `Has seleccionado: ${selectedValue}`;
    } else {
        mensaje.textContent = "";
    }
});


const searchInput = document.querySelector
("#empleos-search-input")


const searchForm = document.querySelector
("#empleos-search-form")

searchForm.addEventListener("sumit", function(event){


    console.log("submit")
})