from app import create_app
from models import db, User
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    db.create_all()
    
    # Check if users exist
    if not User.query.first():
        users = [
            User(username='manager', password_hash=generate_password_hash('admin123'), role='Manager'),
            User(username='op_nagdhunga', password_hash=generate_password_hash('pass123'), role='Operator-Nagdhunga'),
            User(username='op_jamune', password_hash=generate_password_hash('pass123'), role='Operator-Jamune')
        ]
        
        db.session.bulk_save_objects(users)
        db.session.commit()
        print("Users seeded successfully!")
    else:
        print("Users already exist.")
