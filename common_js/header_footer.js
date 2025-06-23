var sideMenu = document.getElementById("sideMenu");
var menuToggle = document.querySelector(".menu-toggle");
var bars = document.querySelectorAll(".bar");

function toggleMenu() {
    sideMenu.classList.toggle("show-menu");
    menuToggle.classList.toggle("active");
    bars.classList.toggle("active");
}

/* window.addEventListener("click", function(event) {
  if (!event.target.matches('.menu-toggle') && !event.target.matches('.bar')) {
    if (sideMenu.classList.contains('show-menu')) {
      sideMenu.classList.remove('show-menu');
      menuToggle.classList.remove('active');

      bars.forEach(function(bar) {
        bar.classList.remove("change");
      });
    }
  }
}); */
