import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from functools import wraps
from flask import request, jsonify, current_app

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def check_password(password: str, hashed: str) -> bool:
    if not hashed:
        return False
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_token(user_id: int, email: str) -> str:
    secret = current_app.config['JWT_SECRET_KEY']
    exp_hours = current_app.config.get('JWT_EXPIRATION_HOURS', 24)
    now = int(datetime.now(timezone.utc).timestamp())
    payload = {
        'sub': str(user_id),
        'email': email,
        'iat': now,
        'exp': now + (exp_hours * 3600)
    }
    token = jwt.encode(payload, secret, algorithm='HS256')
    return token if isinstance(token, str) else token.decode('utf-8')

def decode_token(token: str) -> dict:
    secret = current_app.config['JWT_SECRET_KEY']
    try:
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return {'error': 'Token has expired'}
    except jwt.InvalidTokenError as e:
        return {'error': f'Invalid token: {str(e)}'}

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization') or request.headers.get('authorization')
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == 'bearer':
                token = parts[1]
        
        if not token:
            return jsonify({'error': 'Authentication token is required'}), 401
        
        payload = decode_token(token)
        if 'error' in payload:
            return jsonify({'error': payload['error']}), 401
        
        request.current_user_id = int(payload['sub'])
        return f(*args, **kwargs)
    return decorated
