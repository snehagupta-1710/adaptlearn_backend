from flask import Flask, render_template, send_from_directory, request, jsonify
import os, json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(BASE_DIR, "../../Frontend/frontend_chatbot/templates")
STATIC_DIR = os.path.join(BASE_DIR, "../../Frontend/frontend_chatbot/static")

app = Flask(__name__,
            static_folder=STATIC_DIR,
            template_folder=TEMPLATE_DIR)

# ✅ Serve main page
@app.route("/")
def home():
    return render_template("index.html")

# ✅ Serve static files (CSS, JS)
@app.route("/static/<path:filename>")
def serve_static(filename):
    return send_from_directory(STATIC_DIR, filename)

# ✅ Chat route
@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json()
    user_message = data.get("message", "").strip().lower()
    subject = data.get("subject", "introduction_to_database")

    json_path = os.path.join(BASE_DIR, "sample_content.json")

    with open(json_path, "r", encoding="utf-8") as f:
        qa_data = json.load(f)

    if subject not in qa_data:
        return jsonify({"reply": "Sorry, I don’t have data for this topic yet."})

    responses = qa_data[subject]
    reply = "I'm sorry, I don’t understand that yet."

    for entry in responses:
        for keyword in entry["keywords"]:
            if keyword in user_message:
                reply = entry["answer"]
                break
        if reply != "I'm sorry, I don’t understand that yet.":
            break

    return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
