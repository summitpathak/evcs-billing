from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class VehicleMaster(db.Model):
    __tablename__ = 'vehicle_master'
    vehicle_no = db.Column(db.String(20), primary_key=True)
    vehicle_name = db.Column(db.String(100)) # Merged Brand/Model
    phone_no = db.Column(db.String(20))
    battery_capacity = db.Column(db.Float)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'vehicle_no': self.vehicle_no,
            'vehicle_name': self.vehicle_name,
            'phone_no': self.phone_no,
            'battery_capacity': self.battery_capacity,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        }

class ChargeSession(db.Model):
    __tablename__ = 'charge_sessions'
    session_id = db.Column(db.Integer, primary_key=True)
    vehicle_no = db.Column(db.String(20), db.ForeignKey('vehicle_master.vehicle_no'), nullable=False)
    station_name = db.Column(db.String(50), nullable=False)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime)
    soc_start = db.Column(db.Float, nullable=False)
    soc_end = db.Column(db.Float)
    unit_kwh = db.Column(db.Float)
    calculated_cost_rs = db.Column(db.Float)
    price_paid = db.Column(db.Float)
    payment_method = db.Column(db.String(20)) # Cash/QR
    status = db.Column(db.String(20), default='IN PROGRESS') # IN PROGRESS, COMPLETED

    vehicle = db.relationship('VehicleMaster', backref=db.backref('sessions', lazy=True))

    def to_dict(self):
        return {
            'session_id': self.session_id,
            'vehicle_no': self.vehicle_no,
            'station_name': self.station_name,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'soc_start': self.soc_start,
            'soc_end': self.soc_end,
            'unit_kwh': self.unit_kwh,
            'calculated_cost_rs': self.calculated_cost_rs,
            'price_paid': self.price_paid,
            'payment_method': self.payment_method,
            'status': self.status
        }

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False) # 'Manager', 'Operator-Nagdhunga', 'Operator-Jamune'

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role
        }
