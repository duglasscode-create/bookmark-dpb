// Aplicar el tema del sistema (claro/oscuro según Windows)
(function () {
  try {
    var dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    
    // Escuchar cambios del sistema en tiempo real
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
    });
  } catch (e) {
    console.error("Error aplicando tema:", e);
  }
})();