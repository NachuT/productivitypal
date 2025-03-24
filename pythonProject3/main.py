import base64
import csv
import os
import pytesseract
from flask import Flask, request, jsonify
from datetime import datetime
from PIL import Image
import io
import requests
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "screenshots"
CSV_FILE = "posts.csv"
USERS_DB = "users.csv"
POINTS_FILE = "points.csv"

print("Starting server with following paths:")
print(f"UPLOAD_FOLDER: {os.path.abspath(UPLOAD_FOLDER)}")
print(f"CSV_FILE: {os.path.abspath(CSV_FILE)}")
print(f"USERS_DB: {os.path.abspath(USERS_DB)}")
print(f"POINTS_FILE: {os.path.abspath(POINTS_FILE)}")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def init_csv_file(file_path, headers):
    create_new = not os.path.exists(file_path) or os.path.getsize(file_path) == 0
    if create_new:
        with open(file_path, mode="w", newline="") as file:
            writer = csv.writer(file)
            writer.writerow(headers)
        print(f"Created new CSV file: {file_path}")

init_csv_file(CSV_FILE, ["id", "user", "image_path", "likes", "dislikes", "extracted_text"])
init_csv_file(USERS_DB, ["username", "password_hash"])
init_csv_file(POINTS_FILE, ["username", "points"])

def read_csv(file_path):
    try:
        if not os.path.exists(file_path):
            print(f"Warning: CSV file does not exist: {file_path}")
            return []
        with open(file_path, mode="r", newline="") as file:
            reader = csv.DictReader(file)
            data = list(reader)
            print(f"Read {len(data)} rows from {file_path}")
            return data
    except Exception as e:
        print(f"Error reading CSV {file_path}: {str(e)}")
        return []

def write_csv(posts):
    try:
        with open(CSV_FILE, mode="w", newline="") as file:
            writer = csv.DictWriter(file, fieldnames=["id", "user", "image_path", "likes", "dislikes", "extracted_text"])
            writer.writeheader()
            writer.writerows(posts)
            print(f"Wrote {len(posts)} rows to {CSV_FILE}")
    except Exception as e:
        print(f"Error writing CSV: {str(e)}")

def update_points(username, points_to_add):
    try:
        print(f"Updating points for {username}: +{points_to_add}")
        points_data = read_csv(POINTS_FILE)
        user_found = False
        if not isinstance(points_data, list):
            points_data = []
            print("Initialized empty points data list")
        for user in points_data:
            if user['username'] == username:
                current_points = int(user.get('points', '0'))
                new_points = current_points + points_to_add
                user['points'] = str(new_points)
                user_found = True
                print(f"Updated points for {username}: {current_points} -> {new_points}")
                break
        if not user_found:
            points_data.append({'username': username, 'points': str(points_to_add)})
            print(f"Added new user {username} with {points_to_add} points")
        with open(POINTS_FILE, mode="w", newline="") as file:
            writer = csv.DictWriter(file, fieldnames=["username", "points"])
            writer.writeheader()
            writer.writerows(points_data)
            print(f"Wrote {len(points_data)} rows to points file")
        verify_data = read_csv(POINTS_FILE)
        print(f"Verified points file contains {len(verify_data)} rows")
        return True
    except Exception as e:
        print(f"Error updating points: {str(e)}")
        return False

@app.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        username = data.get('username')
        password = data.get('password')
        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400
        users = read_csv(USERS_DB)
        if any(user['username'] == username for user in users):
            return jsonify({"error": "Username already exists"}), 400
        password_hash = generate_password_hash(password)
        with open(USERS_DB, mode="a", newline="") as file:
            writer = csv.writer(file)
            writer.writerow([username, password_hash])
            print(f"Added new user: {username}")
        update_points(username, 0)
        return jsonify({"message": "User created successfully"}), 201
    except Exception as e:
        print(f"Error in signup: {str(e)}")
        return jsonify({"error": "Server error"}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        username = data.get('username')
        password = data.get('password')
        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400
        users = read_csv(USERS_DB)
        print(f"Attempting login for {username}")
        user = next((user for user in users if user['username'] == username), None)
        if not user:
            print(f"User not found: {username}")
            return jsonify({"error": "Invalid username or password"}), 401
        print(f"Login successful for {username}")
        return jsonify({"message": "Login successful", "username": username}), 200
    except Exception as e:
        print(f"Error in login: {str(e)}")
        return jsonify({"error": "Server error"}), 500

@app.route('/upload_screenshot', methods=['POST'])
def upload_screenshot():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data received"}), 400
        username = data.get('username')
        screenshot_data = data.get('screenshot')
        if not username or not screenshot_data:
            return jsonify({"error": "Missing username or screenshot data"}), 400
        print(f"Processing screenshot for {username}")
        try:
            if screenshot_data.startswith('data:image/'):
                screenshot_data = screenshot_data.split(',', 1)[1]
            img_data = base64.b64decode(screenshot_data)
            image = Image.open(io.BytesIO(img_data))
            extracted_text = pytesseract.image_to_string(image) or ""
            print(f"Extracted text length: {len(extracted_text)}")
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"screenshot_{timestamp}.png"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            with open(filepath, 'wb') as f:
                f.write(img_data)
            print(f"Saved screenshot to: {filepath}")
            is_on_task = check_if_on_task(extracted_text)
            print(f"Task classification: {'On task' if is_on_task else 'Off task'}")
            points_earned = 0
            if is_on_task:
                points_earned = 40
                if update_points(username, points_earned):
                    print(f"Added {points_earned} points to {username}")
                else:
                    print(f"Failed to update points for {username}")
            posts = read_csv(CSV_FILE)
            new_post = {"id": str(len(posts) + 1), "user": username, "image_path": filepath, "likes": "0", "dislikes": "0", "extracted_text": extracted_text}
            posts.append(new_post)
            write_csv(posts)
            points_data = read_csv(POINTS_FILE)
            current_points = next((int(user['points']) for user in points_data if user['username'] == username), 0)
            print(f"Current points for {username}: {current_points}")
            return jsonify({"message": "Screenshot uploaded successfully!", "is_on_task": is_on_task, "points_earned": points_earned, "total_points": current_points}), 200
        except base64.binascii.Error as e:
            print(f"Base64 error: {str(e)}")
            return jsonify({"error": "Invalid base64 data"}), 400
        except IOError as e:
            print(f"IO error: {str(e)}")
            return jsonify({"error": f"Error saving image: {str(e)}"}), 500
    except Exception as e:
        print(f"Error in upload_screenshot: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    try:
        points_data = read_csv(POINTS_FILE)
        print(f"Retrieved {len(points_data)} entries for leaderboard")
        sorted_points = sorted(points_data, key=lambda x: int(x.get('points', '0')), reverse=True)
        return jsonify({"leaderboard": sorted_points}), 200
    except Exception as e:
        print(f"Error getting leaderboard: {str(e)}")
        return jsonify({"error": "Error retrieving leaderboard"}), 500

def check_if_on_task(text):
    if not text:
        print("No text extracted from image")
        return False
    try:
        url = "https://ai.hackclub.com/chat/completions"
        headers = {"Content-Type": "application/json"}
        prompt = f"""
        You are a task classifier. Analyze the following text and determine if it shows productive work.
        Productive work includes:
        - Coding/Programming
        - School work/Studying
        - Reading educational content
        - Writing/Documentation
        - Learning new skills

        Non-productive activities include:
        - Gaming
        - Social media
        - Entertainment videos
        - Chat/Messaging

        Text to analyze:
        "{text}"

        Respond with EXACTLY "on task" or "off task" - no other text.
        """
        payload = {"messages": [{"role": "user", "content": prompt}]}
        print(f"Sending text to AI: {text[:100]}...")
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            ai_response = response.json()
            ai_message = ai_response['choices'][0]['message']['content'].strip().lower()
            print(f"AI Response: {ai_message}")
            is_on = "on task" in ai_message
            print(f"Task classification: {'On task' if is_on else 'Off task'}")
            return is_on
        else:
            print(f"AI request failed with status {response.status_code}")
            print(f"Response content: {response.text}")
            return False
    except Exception as e:
        print(f"Error checking task status: {str(e)}")
        print(f"Full error details: {repr(e)}")
        return False

if __name__ == '__main__':
    app.run(debug=True)