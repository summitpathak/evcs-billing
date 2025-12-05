from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Database configuration
    # Use PostgreSQL in production, SQLite in development
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        # Fix for Railway/Render PostgreSQL URL
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    else:
        # Development: SQLite
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///charging_station.db'
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # CORS configuration
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    CORS(app, resources={
        r"/api/*": {
            "origins": [frontend_url, "http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Import db from models
    from models import db
    db.init_app(app)
    
    with app.app_context():
        from models import VehicleMaster, ChargeSession, User
        db.create_all()
    
    from routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    debug = os.getenv('FLASK_DEBUG', 'True') == 'True'
    app.run(host='0.0.0.0', port=port, debug=debug)
