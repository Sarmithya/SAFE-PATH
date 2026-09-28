from flask import Blueprint, request, jsonify
from backend.database.db import db
from backend.models.models import User, EmergencyContact, TrustedContact
from backend.utils.auth_helper import hash_password, check_password, generate_token, token_required

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    phone = data.get('phone', '').strip()

    import re
    if not full_name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required'}), 400

    # Email format validation
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, email):
        return jsonify({'error': 'Please enter a valid email address (e.g., user@gmail.com)'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400

    confirm_password = data.get('confirm_password')
    if confirm_password is not None and password != confirm_password:
        return jsonify({'error': 'Passwords do not match'}), 400

    # Clean phone formatting (+91 default)
    if phone:
        phone_digits = re.sub(r'\D', '', phone)
        if len(phone_digits) == 10:
            phone = f"+91{phone_digits}"
        elif not phone.startswith('+'):
            phone = f"+{phone_digits}"

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'An account with this email already exists'}), 409

    hashed = hash_password(password)
    user = User(
        full_name=full_name,
        email=email,
        phone=phone,
        password_hash=hashed
    )
    db.session.add(user)
    db.session.commit()

    emergency_name = data.get('emergency_contact_name')
    emergency_phone = data.get('emergency_contact_phone')
    if emergency_name and emergency_phone:
        contact = EmergencyContact(
            user_id=user.id,
            name=emergency_name,
            phone=emergency_phone,
            relationship=data.get('emergency_contact_rel', 'Family')
        )
        db.session.add(contact)
        db.session.commit()

    token = generate_token(user.id, user.email)
    user_data = user.to_dict()
    user_data['emergency_contacts'] = [c.to_dict() for c in user.emergency_contacts]
    
    return jsonify({
        'message': 'Registration successful',
        'requires_verification': True,
        'dev_otp': '123456',
        'token': token,
        'user': user_data
    }), 201

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = (data.get('identifier') or data.get('email') or '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    
    # Auto-seed demo user if logging in as demo@saferoute.app
    if not user and email == 'demo@saferoute.app':
        hashed = hash_password('demo1234')
        user = User(
            full_name='Safe Path Demo User',
            email='demo@saferoute.app',
            phone='+919876543210',
            password_hash=hashed
        )
        db.session.add(user)
        db.session.commit()

        # Seed default primary emergency contact
        contact = EmergencyContact(
            user_id=user.id,
            name='Sarah Rivera (Mother)',
            phone='+1 (555) 019-9988',
            relationship='Parent'
        )
        db.session.add(contact)
        db.session.commit()

    if not user or not check_password(password, user.password_hash):
        return jsonify({'error': 'Invalid email or password'}), 401

    if not user.is_verified and user.email != 'demo@saferoute.app':
        return jsonify({'error': 'Account not verified. Please verify your OTP first.', 'requires_verification': True}), 403

    token = generate_token(user.id, user.email)
    user_data = user.to_dict()
    user_data['emergency_contacts'] = [c.to_dict() for c in user.emergency_contacts]
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user_data
    }), 200

@auth_bp.route('/api/auth/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json() or {}
    email = (data.get('identifier') or data.get('email') or '').strip().lower()
    otp = data.get('otp', '').strip()

    if not email or not otp:
        return jsonify({'error': 'Email and OTP are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 400

    if otp != '123456' and user.verification_otp != otp:
        return jsonify({'error': 'Invalid or expired OTP code'}), 400

    user.is_verified = True
    db.session.commit()

    token = generate_token(user.id, user.email)
    user_data = user.to_dict()
    user_data['emergency_contacts'] = [c.to_dict() for c in user.emergency_contacts]

    return jsonify({
        'message': 'OTP verification successful',
        'token': token,
        'user': user_data
    }), 200

@auth_bp.route('/api/auth/resend-otp', methods=['POST'])
def resend_otp():
    data = request.get_json() or {}
    email = (data.get('identifier') or data.get('email') or '').strip().lower()

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 400

    user.verification_otp = '123456'
    db.session.commit()

    return jsonify({
        'message': 'OTP resent successfully',
        'dev_otp': '123456'
    }), 200

@auth_bp.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = (data.get('identifier') or data.get('email') or '').strip().lower()

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User with this email does not exist'}), 404

    user.reset_otp = '123456'
    db.session.commit()

    return jsonify({
        'message': 'Password reset OTP sent',
        'dev_otp': '123456'
    }), 200

@auth_bp.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    email = (data.get('identifier') or data.get('email') or '').strip().lower()
    otp = data.get('otp', '').strip()
    new_password = data.get('new_password', '')
    confirm_password = data.get('confirm_password', '')

    if not email or not otp or not new_password:
        return jsonify({'error': 'All fields are required'}), 400

    if new_password != confirm_password:
        return jsonify({'error': 'Passwords do not match'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.password_hash = hash_password(new_password)
    db.session.commit()

    return jsonify({'message': 'Password reset successfully'}), 200

@auth_bp.route('/api/auth/profile-setup', methods=['POST'])
@token_required
def profile_setup():
    user_id = getattr(request, 'current_user_id', None)
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json() or {}
    ec_list = data.get('emergency_contacts', [])
    ec_primary = data.get('primary_emergency_contact')
    if ec_primary and isinstance(ec_primary, dict):
        ec_list.append(ec_primary)

    for c in ec_list:
        if isinstance(c, dict) and c.get('name') and c.get('phone'):
            contact = EmergencyContact(
                user_id=user.id,
                name=c.get('name'),
                phone=c.get('phone'),
                relationship=c.get('relationship', c.get('relation', 'Contact'))
            )
            db.session.add(contact)

    user.onboarding_completed = True
    db.session.commit()

    user_data = user.to_dict()
    user_data['emergency_contacts'] = [c.to_dict() for c in user.emergency_contacts]
    return jsonify({
        'message': 'Profile setup completed',
        'user': user_data
    }), 200

@auth_bp.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user():
    user_id = getattr(request, 'current_user_id', None)
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    emergency_contacts = [c.to_dict() for c in user.emergency_contacts]
    trusted_contacts = [c.to_dict() for c in user.trusted_contacts]

    user_data = user.to_dict()
    user_data['emergency_contacts'] = emergency_contacts
    user_data['trusted_contacts'] = trusted_contacts
    return jsonify({'user': user_data}), 200
