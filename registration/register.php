<?php
// Assuming you have a MySQL database setup
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "login_credentials";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Process the registration form
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $firstName = $_POST["firstName"];
    $lastName = $_POST["lastName"];
    $mobileNumber = $_POST["mobileNumber"];
    $dateOfBirth = $_POST["dateOfBirth"];
    $username_id = $_POST["username"];
    $password = $_POST["password"];

    // Perform any server-side validation here

    // Insert the user data into the database
    $sql = "INSERT INTO users (first_name, last_name, mobile_number, date_of_birth, username, password)
            VALUES ('$firstName', '$lastName', '$mobileNumber', '$dateOfBirth', '$username_id', '$password')";

    if ($conn->query($sql) === TRUE) {
        echo "Registration successful.";
        header( "refresh:3;url=index.html");
    } else {
        echo "Error: " . $sql . "<br>" . $conn->error;
    }
}

$conn->close();
?>
