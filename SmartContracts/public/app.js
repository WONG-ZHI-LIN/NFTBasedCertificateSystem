// app.js

// ============================================
// Populate Address Dropdown
// ============================================

async function populateAddressDropdown() {
    console.log("Populating address dropdown...");

    if (typeof window.ethereum === "undefined") {
        alert("Please install MetaMask to use this feature!");
        return;
    }

    try {
        // Request account access if not already connected
        const accounts = await ethereum.request({ method: "eth_requestAccounts" });
        console.log("Connected accounts:", accounts);

        // Get the dropdown element
        const addressSelect = document.getElementById("addressSelect");
        addressSelect.innerHTML = ""; // Clear existing options

        // Populate the dropdown with connected accounts
        accounts.forEach((account) => {
            const option = document.createElement("option");
            option.value = account;
            option.text = account;
            addressSelect.appendChild(option);
        });

        console.log("Address dropdown populated successfully.");
    } catch (error) {
        console.error("Error populating address dropdown:", error);
        //alert("Failed to connect to MetaMask.");
    }
}

// ============================================
// Admin Login Function
// ============================================

async function adminLogin() {
    console.log("Admin login function called");

    if (typeof window.ethereum === "undefined") {
        alert("Please install MetaMask to use this feature!");
        return;
    }

    try {
        console.log("Requesting account access...");
        const accounts = await ethereum.request({ method: "eth_requestAccounts" });
        const userAddress = accounts[0];
        localStorage.setItem('userAddress', userAddress);
        console.log("Connected account:", userAddress);

        // Check if the user is the admin (first account in MetaMask)
        const isAdmin = accounts.indexOf(userAddress) === 0;

        if (isAdmin) {
            console.log("User is an admin, redirecting to admin home page");
            window.location.href = "/admin_home.html";
        } else {
            alert("You do not have permission to access the admin page.");
        }
    } catch (error) {
        console.error("Error connecting to MetaMask:", error);
        //alert("Failed to connect to MetaMask.");
    }
}

// ============================================
// Student Login Function
// ============================================

async function studentLogin() {
    console.log("Student login function called");

    const addressSelect = document.getElementById("addressSelect");
    const selectedAddress = addressSelect.value;

    if (!selectedAddress) {
        alert("Please select an address to log in.");
        return;
    }

    console.log("Selected address:", selectedAddress);

    // Check if the selected address is not the admin address
    const accounts = await ethereum.request({ method: "eth_accounts" });
    const isAdmin = accounts.indexOf(selectedAddress) === 0;

    if (!isAdmin) {
        // Store the selected address in localStorage
        localStorage.setItem("studentAddress", selectedAddress);
        console.log("Student address saved in localStorage.");
        console.log("User is a student, redirecting to student home page");
        window.location.href = "/student_home.html";
    } else {
        alert("You do not have permission to access the student page.");
    }
}

// ============================================
// Admin Logout Function
// ============================================

async function adminLogout() {
    try {
        // Clear the user's session or state
        localStorage.removeItem("userAddress");

        // Disconnect MetaMask (if needed)
        await ethereum.request({ method: "eth_accounts", params: [] });

        // Redirect to the admin login page
        window.location.href = "/admin_login.html";
    } catch (error) {
        console.error("Error during logout:", error);
        alert("Failed to logout.");
    }
}

// ============================================
// Student Logout Function
// ============================================

async function studentLogout() {
    try {
        // Clear the user's session or state
        localStorage.removeItem("userAddress");

        // Disconnect MetaMask (if needed)
        await ethereum.request({ method: "eth_accounts", params: [] });

        // Redirect to the student login page
        window.location.href = "/student_login.html";
    } catch (error) {
        console.error("Error during logout:", error);
        alert("Failed to logout.");
    }
}




// ============================================
// Event Listeners
// ============================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded and parsed");
    populateAddressDropdown();

    const adminLoginButton = document.getElementById("adminLoginButton");
    const studentLoginButton = document.getElementById("studentLoginButton");
    const adminLogoutButton = document.getElementById("adminLogoutButton");
    const studentLogoutButton = document.getElementById("studentLogoutButton");

    if (adminLoginButton) {
        console.log("Admin login button found");
        adminLoginButton.addEventListener("click", adminLogin);
    } else {
        console.error("Admin login button not found");
    }

    if (studentLoginButton) {
        console.log("Student login button found");
        studentLoginButton.addEventListener("click", studentLogin);
    } else {
        console.error("Student login button not found");
    }

    if (adminLogoutButton) {
        console.log("Admin logout button found");
        adminLogoutButton.addEventListener("click", adminLogout);
    } else {
        console.error("Admin logout button not found");
    }

    if (studentLogoutButton) {
        console.log("Student logout button found");
        studentLogoutButton.addEventListener("click", studentLogout);
    } else {
        console.error("Student logout button not found");
    }
});