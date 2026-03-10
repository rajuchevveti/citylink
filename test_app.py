from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_cors import CORS
import os

app = Flask(__name__, template_folder='templates')
CORS(app)

@app.route('/test')
def test_login_page():
    """Serves the complete test authentication page."""
    return render_template('test/test_auth.html')

@app.route('/test/success')
def test_success_page():
    """Serves a confirmation page after successful registration/login."""
    user_data = request.args.get('user', 'No data found')
    return render_template('test/test_success.html', user_data=user_data)

if __name__ == '__main__':
    # Run on 0.0.0.0 to ensure accessibility from mobile on the same network
    app.run(debug=True, host='0.0.0.0', port=5000)