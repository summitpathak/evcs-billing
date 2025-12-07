# WSGI Configuration for PythonAnywhere
# This file tells PythonAnywhere how to run your Flask application

import sys
import os

# Add your project directory to the sys.path
# IMPORTANT: Replace 'YOUR_USERNAME' with your actual PythonAnywhere username
project_home = '/home/YOUR_USERNAME/ev-charging-backend'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv(os.path.join(project_home, '.env'))

# Import your Flask app
from app import app as application

# PythonAnywhere expects the WSGI application to be called 'application'
# Our app.py exports 'app', so we alias it here
