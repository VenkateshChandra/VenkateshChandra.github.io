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

// Process the login form
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST["username"];
    $password = $_POST["password"];

    // Perform any server-side validation here

    // Check if the credentials are valid (with case sensitivity)
    $sql = "SELECT * FROM users WHERE username='$username'";
    $result = $conn->query($sql);
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        if ($password === $row["password"]) {
            echo json_encode(array("success" => true, "message" => "Login successful."));
        } else {
            echo json_encode(array("success" => false, "message" => "Invalid password."));
        }
    } else {
        echo json_encode(array("success" => false, "message" => "Invalid username."));
    }
}

$conn->close();
?>
