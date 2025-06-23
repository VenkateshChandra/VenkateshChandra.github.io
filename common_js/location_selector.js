var selectedDate = null;
const urlParams = new URLSearchParams(window.location.search);
const user_detail = urlParams.get("user");
var dropdownItems = document.querySelectorAll(".dropdown-item");
var tabName = document.getElementById("location");
var selectedLocationElement = document.getElementById("selected-location");
// Set the minimum date to the current date
var currentDate = new Date();
var year = currentDate.getFullYear();
var month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month starts from 0, so add 1 and pad with 0 if needed
var day = String(currentDate.getDate()).padStart(2, '0');
var minDate = `${year}-${month}-${day}`;
document.getElementById("curr-date").setAttribute("min", minDate);


dropdownItems.forEach(function (item) {
  item.addEventListener("click", function () {
    selectedLocationElement.textContent = item.textContent;
  });
});

document.getElementById("search-btn").addEventListener("click", function () {
  event.preventDefault(); // Prevent the default form submission behavior
  window.location.href = '../seat_booking_page/seat_booking.html?date='+selectedDate+'&user='+ user_detail;
});

document.getElementById("curr-date").addEventListener("change", function () {
  selectedDate = this.value;
});
