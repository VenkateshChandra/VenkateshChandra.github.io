window.addEventListener('DOMContentLoaded', function () {
    document.getElementById('loginForm').addEventListener('submit', function (e) {
      e.preventDefault(); // Prevent form submission
      var username = document.getElementsByName('username')[0].value;
      var password = document.getElementsByName('password')[0].value;
  
      // Perform any client-side validation here
  
      // Send the data to the server for login verification
      var xhr = new XMLHttpRequest();
      xhr.open('POST', 'login.php', true);
      xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
          var response = JSON.parse(xhr.responseText);
          if (response.success) {
            // Redirect to the user's dashboard or homepage
            window.location.href = "../serial_term/serial_term.html?user="+username;
          } else {
            alert(response.message,"Please try again.");
            //refresh the page.
            location.reload();
          }
        }
      };
      var data = 'username=' + encodeURIComponent(username) +
                 '&password=' + encodeURIComponent(password);
      xhr.send(data);
    });
  });
  