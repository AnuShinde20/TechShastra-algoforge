from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Set Google Gemini API key
genai.configure(api_key="YOUR_GEMINI_API_KEY")  # Replace with your actual API key

# Predefined responses for common questions
responses = {
    # Basic Greetings
    "hi": "Hello! Welcome to the Smart Shopping Trolley. How can I assist you?",
    "hello": "Hi there! Do you need help with shopping, billing, or security features?",
    "bye": "Goodbye! Happy shopping with the Smart Trolley!",
    "thank you": "You're welcome! Let me know if you need any help. 😊",

    # Shopping Trolley Basics
    "how does the smart shopping trolley work": "The trolley uses an *ESP32 QR code scanner* to add products in real time. It calculates the total and allows *seamless checkout via Razorpay/UPI*.",
    "how to start using the trolley": "Just scan your QR code at the start of shopping. The system will authenticate you and activate the trolley for use.",
    "do i need to register before shopping": "Yes registration is needed. Register on our website to start shopping .",

    # Product Management
    "can i remove an item after scanning": "No, the system does not allow item removal. If an item is added by mistake, store staff can assist in corrections.",
    "how to check product details before adding": "You can scan a product's QR code to view its price, discount, and expiry date before adding it to your cart.",
    "what happens if a product is out of stock": "The system will notify you immediately and suggest similar available alternatives.",

    # Billing & Payment
    "how is the total bill calculated": "The system fetches product prices from the *Firebase database* and displays the total on the trolley’s screen or mobile app.",
    "how can i pay for my items": "The system supports *Razorpay, UPI (Google Pay, Paytm, PhonePe), and card payments.*",
    "is there an option for self-checkout": "Yes! After scanning all products, you can *pay directly from the trolley* without standing in a queue.",
    "can i use multiple payment methods": "Yes, you can split payments, such as paying part via UPI and part via cash.",
    "does the trolley provide a digital receipt": "Yes! After payment, you will receive a digital invoice via SMS or email.",

    # Security & Anti-Theft Features
    "how does the trolley prevent theft": "The trolley has a *time-based lid that closes after 5 seconds.* If an unpaid item is detected at checkout, an alarm is triggered.",
    "what happens if someone tries to leave without paying": "The trolley sends a *real-time alert to store security* and *locks the exit gate* until payment is completed.",
    "is there a weight sensor to prevent fraud": "Yes! The trolley has weight sensors to match scanned items with actual weight. Any mismatch triggers an alert.",

    # Discounts & Offers
    "does the trolley suggest discounts": "Yes! It fetches *real-time offers and discounts* from the store database and displays them for relevant products.",
    "can i apply discount coupons": "Yes! You can scan discount codes before checkout to avail offers.",

    # User Experience
    "can the trolley suggest shopping lists": "Yes! Based on your *past purchases*, it can recommend frequently bought items.",
    "does the trolley support multiple languages": "No, the interface currently supports only English.",
    "can i track my shopping history": "Yes! The system maintains a shopping history and suggests frequently bought products.",

    # Store Management Features
    "can store owners track shopping trends": "Yes! The system generates *analytics reports* on popular products, peak shopping hours, and customer preferences.",
    "how does the system update inventory": "Every scanned product is updated in the store's Firebase inventory in real time.",

    # Technical Issues
    "what if the trolley scanner is not working": "Try restarting the trolley. If the issue persists, contact store staff for assistance.",
    "how to reset the trolley if it stops responding": "Press and hold the reset button on the handle for 5 seconds to reboot the system."
}

# Function to get chatbot response
def get_response(user_input):
    user_input = user_input.lower().strip()  # Normalize input text
    if user_input in responses:
        return responses[user_input]  # Return predefined answer
    
    # If no predefined response, call Gemini AI
    try:
        model = genai.GenerativeModel("gemini-1.5-pro")
        response = model.generate_content(user_input)
        return response.text.strip()
    except Exception as e:
        print("Error with Gemini API:", e)
        return "I'm sorry, but I couldn't process your request right now. Please try again later."

# API endpoint for chatbot communication
@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message")
    if not user_message:
        return jsonify({"error": "Empty message"}), 400

    bot_reply = get_response(user_message)

    response = jsonify({"response": bot_reply})
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type")
    response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
    return response

if __name__ == "__main__":
    app.run(debug=True)
