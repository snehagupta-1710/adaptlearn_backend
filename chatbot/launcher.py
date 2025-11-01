import webbrowser
import multiprocessing
import time
import os
import signal
import sys
from flask import Flask

# ---------- Path to your Flask app ----------
FLASK_APP_PATH = os.path.join(os.path.dirname(__file__), "app.py")

# ---------- Function to run Flask ----------
def run_flask():
    os.chdir(os.path.dirname(FLASK_APP_PATH))
    # Use pythonw if running silently
    os.system(f'"{sys.executable}" "{FLASK_APP_PATH}"')

# ---------- Main ----------
if __name__ == "__main__":
    # Start Flask in a separate process
    flask_process = multiprocessing.Process(target=run_flask)
    flask_process.start()

    # Give Flask a moment to start
    time.sleep(1)

    # Open browser
    browser = webbrowser.open("http://127.0.0.1:5000/")

    # Wait until user closes browser
    try:
        while True:
            # Check every second if Flask process is alive
            if not flask_process.is_alive():
                break
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        # Terminate Flask process when browser is closed
        if flask_process.is_alive():
            flask_process.terminate()
