function updateDateTime() {
    var dt = new Date();
    document.getElementById("datetime").innerHTML = dt.toLocaleString();
}

// Update every second
setInterval(updateDateTime, 1000);

// Also update immediately when page loads
updateDateTime();