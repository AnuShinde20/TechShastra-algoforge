// Firebase configuration
const firebaseConfig = {
    apiKey: "**",
    authDomain: "***",
    databaseURL: "**",
    projectId: "**",
    storageBucket: "**",
    messagingSenderId: "**",
    appId: "**",
    measurementId: "**"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Monitor user login status
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        console.log("User logged in: ", user.uid);
        loadCartItems();
    } else {
        console.log("No user logged in.");
        alert("Please log in first.");
    }
});

// Clear session storage
sessionStorage.clear();

// Function to dynamically load cart items from Firebase
function loadCartItems() {
    const cartRef = firebase.database().ref('Cart');
    const cartItemsContainer = document.getElementById('cart-items');
    let totalPrice = 0;
    let srNo = 1;

    cartRef.once('value', snapshot => {
        cartItemsContainer.innerHTML = ''; // Clear existing rows

        if (!snapshot.exists()) {
            console.error('Cart is empty or does not exist.');
            alert('No items in the cart.');
            return;
        }

        snapshot.forEach(childSnapshot => {
            const product = childSnapshot.val();

            // Trim spaces from fields
            const name = product.Name ? product.Name.trim() : "Unknown";
            const modelNo = product.Model_no ? product.Model_no.trim() : "N/A";

            // Extract numeric price value
            const priceString = product.Price ? product.Price.trim() : "0";
            const price = parseFloat(priceString.replace(/[^0-9.]/g, "")); // Remove non-numeric characters

            const row = `
                <tr>
                    <td>${srNo++}</td>
                    <td>${name}</td>
                    <td>${modelNo}</td>
                    <td class="item-price">Rs.${price.toFixed(2)}</td>
                </tr>
            `;

            // Add the row to the table
            cartItemsContainer.innerHTML += row;

            // Calculate total price
            totalPrice += price;
        });

        // Update the total price in the UI
        document.getElementById('total-price').innerText = totalPrice.toFixed(2);

        // Attach Razorpay payment handler after total is calculated
        setupRazorpay(totalPrice);
    }).catch(error => {
        console.error('Error loading cart items:', error);
    });
}

// Razorpay integration
function setupRazorpay(total) {
    const options = {
        "key": "rzp_test_oeUzrT6kkoiAV8", // Replace with your Razorpay key
        "amount": total * 100, // Amount in paise
        "currency": "INR",
        "name": "Smart Cart",
        "description": "Total Payment",
        "handler": function (response) {
            alert("Payment Successful! Payment ID: " + response.razorpay_payment_id);
            onPaymentSuccess(response); // Call PDF generation function
            const user = firebase.auth().currentUser;
            if (!user) {
                alert("User not logged in. Please log in to complete the payment.");
                return;
            }

            const userId = user.uid;

            // Construct payment data
            const paymentData = {
                TransactionID: response.razorpay_payment_id,
                Amount: total,
                Method: "Razorpay",
                DateTime: new Date().toISOString()
            };

            // Store payment data in Firebase under the user's PaymentHistory
            firebase.database().ref(`userAccounts/${userId}/PaymentHistory`).push(paymentData)
                .then(() => {
                    alert("Payment successful! Payment ID: " + response.razorpay_payment_id);
                })
                .catch(error => {
                    console.error("Error saving payment data:", error);
                    alert("Payment was successful, but we couldn't save the details. Please contact support.");
                });
        },
        "prefill": {
            "name": "Customer Name",
            "email": "customer@example.com",
            "contact": "1234567890"
        },
        "theme": {
            "color": "#F37254"
        }
    };

    const rzp = new Razorpay(options);

    document.getElementById('rzpButton').addEventListener('click', function () {
        rzp.open();
    });
}
// Payment success function (example)
async function onPaymentSuccess() {
    console.log("Payment completed successfully!");

    
}
async function fetchCartDataAndGeneratePDF() {
    try {
        const cartRef = ref(db, "Cart");
        const snapshot = await get(cartRef);

        if (snapshot.exists()) {
            const cartData = [];
            let srNo = 1;

            const data = snapshot.val();
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    const item = data[key];
                    cartData.push({
                        srNo: srNo++,
                        modelNo: item.Model_no.trim(),
                        name: item.Name.trim(),
                        price: parseFloat(item.Price.trim())
                    });
                }
            }

            generatePDF(cartData);
        } else {
            console.log("No data found in cart.");
        }
    } catch (error) {
        console.error("Error fetching cart data: ", error);
    }
}

// Function to send WhatsApp message
function sendWhatsAppMessage(name, transactionId, amount, method, dateTime, phone, address) {
    fetch("http://localhost:5000/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name, transactionId, amount, method, dateTime, phone, address
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("WhatsApp message sent successfully!");
        } else {
            alert("Failed to send WhatsApp message.");
        }
    })
    .catch(error => console.error("Error sending WhatsApp:", error));
}

// Function to generate and download PDF invoice
function generateInvoice() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Smart Trolley - Invoice", 20, 20);

    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);

    let y = 50;
    doc.setFontSize(14);
    doc.text("Items Purchased:", 20, y);
    y += 10;

    const cartItems = document.querySelectorAll("#cart-items tr");

    if (cartItems.length === 0) {
        doc.text("No items in cart", 20, y);
    } else {
        cartItems.forEach((row, index) => {
            const itemName = row.children[1]?.innerText || "Unknown";
            const itemModel = row.children[2]?.innerText || "N/A";
            const itemPrice = row.children[3]?.innerText || "0";

            doc.text(`${index + 1}. ${itemName} (Model: ${itemModel}) - ${itemPrice}`, 20, y);
            y += 10;
        });
    }

    const totalPrice = document.getElementById("total-price")?.innerText || "0";
    doc.setFontSize(14);
    doc.text(`Total Amount: ${totalPrice}`, 20, y + 10);

    // Auto-download PDF
    doc.save("Invoice.pdf");

    console.log("PDF Generated & Downloaded.");
}

// Call this function inside Razorpay success handler
function onPaymentSuccess(response) {
    alert("Payment Successful! Downloading Invoice...");
    generateInvoice(); // Automatically generate & download invoice
}
