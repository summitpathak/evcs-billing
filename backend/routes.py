from flask import Blueprint, request, jsonify
from models import db, VehicleMaster, ChargeSession, User
from datetime import datetime, timedelta
import jwt
from functools import wraps
from werkzeug.security import check_password_hash

api_bp = Blueprint('api', __name__)

FIXED_TARIFF_RS_PER_KWH = 15.0
SECRET_KEY = 'your_secret_key_here' # In production, use env var

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user = User.query.filter_by(username=data['username']).first()
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

@api_bp.route('/login', methods=['POST'])
def login():
    auth = request.json
    if not auth or not auth.get('username') or not auth.get('password'):
        return jsonify({'message': 'Could not verify'}), 401
        
    user = User.query.filter_by(username=auth.get('username')).first()
    
    if user and check_password_hash(user.password_hash, auth.get('password')):
        token = jwt.encode({
            'username': user.username,
            'role': user.role,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, SECRET_KEY, algorithm="HS256")
        
        return jsonify({'token': token, 'role': user.role, 'username': user.username})
        
    return jsonify({'message': 'Could not verify'}), 401

@api_bp.route('/sessions/start', methods=['POST'])
@token_required
def start_session(current_user):
    data = request.json
    vehicle_no = data.get('vehicle_no')
    station_name = data.get('station_name')
    soc_start = data.get('soc_start')
    
    # RBAC: Check if operator is assigned to this station
    if 'Operator' in current_user.role:
        assigned_station = current_user.role.split('-')[1]
        if station_name != assigned_station:
            return jsonify({'error': f'Unauthorized: You can only operate {assigned_station} station'}), 403

    if not all([vehicle_no, station_name, soc_start]):
        return jsonify({'error': 'Missing required fields'}), 400

    # Helper to convert empty string to None for float fields
    def to_float_or_none(value):
        if value == '' or value is None:
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None

    vehicle = VehicleMaster.query.get(vehicle_no)
    if vehicle:
        vehicle.vehicle_name = data.get('vehicle_name', vehicle.vehicle_name)
        vehicle.phone_no = data.get('phone_no', vehicle.phone_no)
        battery_cap = to_float_or_none(data.get('battery_capacity'))
        if battery_cap is not None:
            vehicle.battery_capacity = battery_cap
        vehicle.last_updated = datetime.utcnow()
    else:
        vehicle = VehicleMaster(
            vehicle_no=vehicle_no,
            vehicle_name=data.get('vehicle_name', ''),
            phone_no=data.get('phone_no', ''),
            battery_capacity=to_float_or_none(data.get('battery_capacity'))
        )
        db.session.add(vehicle)
        vehicle.last_updated = datetime.utcnow()
    
    new_session = ChargeSession(
        vehicle_no=vehicle_no,
        station_name=station_name,
        soc_start=float(soc_start),
        status='IN PROGRESS'
    )
    
    db.session.add(new_session)
    db.session.commit()
    
    return jsonify({
        'message': 'Session started',
        'session_id': new_session.session_id,
        'vehicle': vehicle.to_dict()
    }), 201

@api_bp.route('/sessions/end', methods=['POST'])
@token_required
def end_session(current_user):
    data = request.json
    session_id = data.get('session_id')
    soc_end = data.get('soc_end')
    unit_kwh = data.get('unit_kwh')
    price_paid = data.get('price_paid')
    payment_method = data.get('payment_method')
    
    if not all([session_id, soc_end, unit_kwh, price_paid, payment_method]):
        return jsonify({'error': 'Missing required fields'}), 400
        
    session = ChargeSession.query.get(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404
        
    # RBAC: Check if operator is assigned to this station
    if 'Operator' in current_user.role:
        assigned_station = current_user.role.split('-')[1]
        if session.station_name != assigned_station:
            return jsonify({'error': f'Unauthorized: You can only operate {assigned_station} station'}), 403

    if session.status == 'COMPLETED':
        return jsonify({'error': 'Session already completed'}), 400

    session.soc_end = float(soc_end)
    session.unit_kwh = float(unit_kwh)
    session.price_paid = float(price_paid)
    session.payment_method = payment_method
    session.end_time = datetime.utcnow()
    session.calculated_cost_rs = session.unit_kwh * FIXED_TARIFF_RS_PER_KWH
    session.status = 'COMPLETED'
    
    vehicle = VehicleMaster.query.get(session.vehicle_no)
    if vehicle:
        vehicle.last_updated = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Session ended',
        'session': session.to_dict()
    }), 200

@api_bp.route('/vehicles/<vehicle_no>', methods=['GET'])
@token_required
def get_vehicle(current_user, vehicle_no):
    vehicle = VehicleMaster.query.get(vehicle_no)
    if vehicle:
        return jsonify(vehicle.to_dict())
    return jsonify({'error': 'Vehicle not found'}), 404

@api_bp.route('/vehicles/<vehicle_no>/history', methods=['GET'])
@token_required
def get_vehicle_history(current_user, vehicle_no):
    if current_user.role != 'Manager':
        return jsonify({'error': 'Unauthorized'}), 403
        
    sessions = ChargeSession.query.filter_by(vehicle_no=vehicle_no).order_by(ChargeSession.start_time.desc()).all()
    return jsonify([s.to_dict() for s in sessions])

@api_bp.route('/reports/aggregates', methods=['GET'])
@token_required
def get_aggregates(current_user):
    if current_user.role != 'Manager':
        return jsonify({'error': 'Unauthorized'}), 403

    sessions = ChargeSession.query.filter_by(status='COMPLETED').all()
    
    total_kwh = 0
    total_revenue = 0
    by_station = {}
    
    for s in sessions:
        total_kwh += s.unit_kwh
        total_revenue += s.price_paid
        
        if s.station_name not in by_station:
            by_station[s.station_name] = {'kwh': 0, 'revenue': 0, 'cash': 0, 'qr': 0}
            
        by_station[s.station_name]['kwh'] += s.unit_kwh
        by_station[s.station_name]['revenue'] += s.price_paid
        
        if s.payment_method.lower() == 'cash':
            by_station[s.station_name]['cash'] += s.price_paid
        elif s.payment_method.lower() == 'qr':
            by_station[s.station_name]['qr'] += s.price_paid
            
    return jsonify({
        'total_kwh': total_kwh,
        'total_revenue': total_revenue,
        'by_station': by_station
    })

@api_bp.route('/sessions', methods=['GET'])
@token_required
def get_sessions(current_user):
    station_name = request.args.get('station_name')
    status = request.args.get('status')
    
    # RBAC: If operator, force station_name to assigned station
    if 'Operator' in current_user.role:
        assigned_station = current_user.role.split('-')[1]
        if station_name and station_name != assigned_station:
            return jsonify({'error': 'Unauthorized'}), 403
        station_name = assigned_station
    
    query = ChargeSession.query
    
    if station_name:
        query = query.filter_by(station_name=station_name)
    if status:
        query = query.filter_by(status=status)
        
    sessions = query.order_by(ChargeSession.start_time.desc()).all()
    return jsonify([s.to_dict() for s in sessions])

@api_bp.route('/vehicles/search', methods=['GET'])
@token_required
def search_vehicles(current_user):
    query = request.args.get('query', '')
    if not query or len(query) < 2:
        return jsonify([])
    
    # Search by both vehicle_no and vehicle_name
    vehicles = VehicleMaster.query.filter(
        db.or_(
            VehicleMaster.vehicle_no.ilike(f'%{query}%'),
            VehicleMaster.vehicle_name.ilike(f'%{query}%')
        )
    ).limit(10).all()
    return jsonify([v.to_dict() for v in vehicles])

@api_bp.route('/stats/station/<station_name>', methods=['GET'])
@token_required
def get_station_stats(current_user, station_name):
    # RBAC: Operators can only access their station
    if current_user.role.startswith('Operator-'):
        assigned_station = current_user.role.split('-')[1]
        if assigned_station != station_name:
            return jsonify({'error': 'Access denied'}), 403
    
    period = request.args.get('period', 'all')  # day, week, month, year, all
    
    # Calculate date filter
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    if period == 'day':
        start_date = now - timedelta(days=1)
    elif period == 'week':
        start_date = now - timedelta(weeks=1)
    elif period == 'month':
        start_date = now - timedelta(days=30)
    elif period == 'year':
        start_date = now - timedelta(days=365)
    else:
        start_date = None
    
    # Build query
    query = ChargeSession.query.filter(ChargeSession.station_name == station_name, ChargeSession.status == 'COMPLETED')
    if start_date:
        query = query.filter(ChargeSession.end_time >= start_date)
    
    sessions = query.all()
    
    # Calculate statistics
    total_sessions = len(sessions)
    total_earnings = sum(s.price_paid or 0 for s in sessions)
    total_energy = sum(s.unit_kwh or 0 for s in sessions)
    
    # Calculate average session duration
    durations = []
    for s in sessions:
        if s.start_time and s.end_time:
            duration = (s.end_time - s.start_time).total_seconds() / 60  # minutes
            durations.append(duration)
    avg_duration = sum(durations) / len(durations) if durations else 0
    
    return jsonify({
        'station_name': station_name,
        'period': period,
        'total_sessions': total_sessions,
        'total_earnings': round(total_earnings, 2),
        'total_energy_kwh': round(total_energy, 2),
        'avg_session_duration_minutes': round(avg_duration, 2)
    })

@api_bp.route('/sessions/filtered', methods=['GET'])
@token_required
def get_filtered_sessions(current_user):
    station_name = request.args.get('station_name')
    vehicle_no = request.args.get('vehicle_no')
    payment_method = request.args.get('payment_method')
    period = request.args.get('period', 'all')
    
    # RBAC: Operators restricted to their station
    if current_user.role.startswith('Operator-'):
        assigned_station = current_user.role.split('-')[1]
        if station_name and station_name != assigned_station:
            return jsonify({'error': 'Access denied'}), 403
        station_name = assigned_station
    
    # Calculate date filter
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    if period == 'day':
        start_date = now - timedelta(days=1)
    elif period == 'week':
        start_date = now - timedelta(weeks=1)
    elif period == 'month':
        start_date = now - timedelta(days=30)
    elif period == 'year':
        start_date = now - timedelta(days=365)
    else:
        start_date = None
    
    # Build query
    query = ChargeSession.query.filter(ChargeSession.status == 'COMPLETED')
    
    if station_name:
        query = query.filter(ChargeSession.station_name == station_name)
    if vehicle_no:
        query = query.filter(ChargeSession.vehicle_no.ilike(f'%{vehicle_no}%'))
    if payment_method and payment_method != 'all':
        query = query.filter(ChargeSession.payment_method == payment_method)
    if start_date:
        query = query.filter(ChargeSession.end_time >= start_date)
    
    sessions = query.order_by(ChargeSession.end_time.desc()).all()
    
    # Calculate summary stats
    total_earnings = sum(s.price_paid or 0 for s in sessions)
    total_energy = sum(s.unit_kwh or 0 for s in sessions)
    
    return jsonify({
        'sessions': [s.to_dict() for s in sessions],
        'summary': {
            'total_sessions': len(sessions),
            'total_earnings': round(total_earnings, 2),
            'total_energy_kwh': round(total_energy, 2)
        }
    })
