// Firebase Configuration
const firebaseConfig = {
  apiKey: "***",
  authDomain: "****",
  databaseURL: "****",
  projectId: "***",
  storageBucket: "***",
  messagingSenderId: "***",
  appId: "***",
  measurementId: "***"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const user = firebase.auth().currentUser;


// Ensure all scripts execute only after DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Handle registration in newuser.html
  if (window.location.pathname.includes("newuser.html")) {
    const signupForm = document.getElementById("signup-form");

    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const firstName = document.getElementById("first-name").value;
      const lastName = document.getElementById("last-name").value;
      const dob = document.getElementById("dob").value;
      const gender = document.getElementById("gender").value;
      const email = document.getElementById("email").value;
      const phone = document.getElementById("phone").value;
      const address = document.getElementById("address").value;
      const password = document.getElementById("password").value;

      try {
        // Create a new user with email and password
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const userId = userCredential.user.uid;

        // Save additional user info in the database under 'userAccounts'
        await database.ref("userAccounts/" + userId).set({
          firstName,
          lastName,
          dob,
          gender,
          email,
          phone,
          address,
          createdAt: new Date().toISOString(),
        });

        alert("Account registered successfully!");
        window.location.href = "index.html"; // Redirect to login page
      } catch (error) {
        console.error("Error during registration:", error.message);
        alert(error.message);
      }
    });
  }
});

// Handle login in login.html
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("index.html")) {
    const loginForm = document.querySelector("form");

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        // Log in the user
        await auth.signInWithEmailAndPassword(email, password);

        alert("Login successful!");
        window.location.href = "home.html"; // Redirect to the home page
      } catch (error) {
        console.error("Error during login:", error.message);
        alert("Login failed. Please check your email and password.");
      }
    });
  }
});

// Fetch user data from Firebase on profile page
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("profile.html")) {
    auth.onAuthStateChanged((user) => {
      if (user) {
        const userId = user.uid;
        const userRef = database.ref("userAccounts/" + userId);

        // Fetch user data from the database
        userRef.once("value", (snapshot) => {
          const userData = snapshot.val();

          // Update profile page with available data
          if (userData) {
            document.getElementById("first-name").value = userData.firstName || "";
            document.getElementById("last-name").value = userData.lastName || "";
            document.getElementById("dob").value = userData.dob || "";
            document.getElementById("gender").value = userData.gender || "";
            document.getElementById("email").value = userData.email || "";
            document.getElementById("phone").value = userData.phone || "";
            document.getElementById("address").value = userData.address || "";
          }
        });
      } else {
        console.log("User not logged in");
      }
    });

    // Update profile data
    document.querySelector(".save-btn").addEventListener("click", (event) => {
      event.preventDefault(); // Prevent form submission

      const user = auth.currentUser;
      if (user) {
        const userId = user.uid;
        const userRef = database.ref("userAccounts/" + userId);

        // Get updated data from form fields
        const updatedData = {
          firstName: document.getElementById("first-name").value,
          lastName: document.getElementById("last-name").value,
          dob: document.getElementById("dob").value,
          gender: document.getElementById("gender").value,
          email: document.getElementById("email").value,
          phone: document.getElementById("phone").value,
          address: document.getElementById("address").value,
        };

        // Update data in Firebase
        userRef.update(updatedData)
          .then(() => {
            alert("Profile updated successfully!");
          })
          .catch((error) => {
            console.error("Error updating profile: ", error);
          });
      }
    });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  // Listen for changes in the authentication state
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      // User is logged in, proceed to fetch payment details
      console.log("User is logged in:", user);

      if (window.location.pathname.includes("payment.html")) {
        const userId = user.uid;
        const paymentRef = firebase.database().ref("userAccounts/" + userId + "/paymentDetails");

        // Fetch payment details and populate the form
        paymentRef.once("value", function (snapshot) {
          const paymentData = snapshot.val();
          console.log("Fetched Payment Data:", paymentData); // Debugging log

          if (paymentData) {
            document.getElementById("card-holder").value = paymentData.cardHolderName || '';
            document.getElementById("card-number").value = paymentData.cardNumber || '';
            document.getElementById("expiry-date").value = paymentData.expiryDate || '';
            document.getElementById("cvv").value = paymentData.cvv || '';
            document.getElementById("billing-address").value = paymentData.billingAddress || '';
            document.getElementById("payment-method").value = paymentData.paymentMethod || 'credit';
          } else {
            console.log("No payment details found.");
          }
        });
        
        // Handle form submission
        const form = document.getElementById("payment-form");
        form.addEventListener("submit", function (e) {
          e.preventDefault(); // Prevent form submission

          const paymentData = {
            cardHolderName: document.getElementById("card-holder").value.trim(),
            cardNumber: document.getElementById("card-number").value.trim(),
            expiryDate: document.getElementById("expiry-date").value.trim(),
            cvv: document.getElementById("cvv").value.trim(),
            billingAddress: document.getElementById("billing-address").value.trim(),
            paymentMethod: document.getElementById("payment-method").value
          };

          // Validate payment details before saving
          if (validatePaymentDetails(paymentData)) {
            paymentRef.set(paymentData)
              .then(() => {
                alert("Payment details saved successfully!");
              })
              .catch((error) => {
                console.error("Error saving payment details:", error);
                alert("Error saving payment details: " + error.message);
              });
          }
        });

        // Function to validate payment details
        function validatePaymentDetails(paymentData) {
          const { cardHolderName, cardNumber, expiryDate, cvv, billingAddress } = paymentData;

          if (!cardHolderName || !cardNumber || !expiryDate || !cvv || !billingAddress) {
            alert("Please fill in all the required fields.");
            return false;
          }

          if (!/^\d{16}$/.test(cardNumber.replace(/\s|-/g, ""))) {
            alert("Card number must be 16 digits.");
            return false;
          }

          if (!/^\d{3}$/.test(cvv)) {
            alert("CVV must be 3 digits.");
            return false;
          }

          const expiryParts = expiryDate.split("-");
          const expiryMonth = parseInt(expiryParts[1], 10);
          const expiryYear = parseInt(expiryParts[0], 10);
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear();
          const currentMonth = currentDate.getMonth() + 1;

          if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
            alert("Expiry date must be in the future.");
            return false;
          }

          return true;
        }
      }
    } else {
      // User is not logged in
      console.log("User not logged in");
      
      window.location.href = "index.html"; // Redirect to login page if not logged in
    }
  });
});
