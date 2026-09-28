import datetime
from datetime import timezone
import json
from backend.database.db import db

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(30), unique=True, nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    onboarding_completed = db.Column(db.Boolean, default=False, nullable=False)
    
    verification_otp = db.Column(db.String(6), nullable=True)
    verification_otp_expires_at = db.Column(db.DateTime, nullable=True)
    otp_resend_cooldown_until = db.Column(db.DateTime, nullable=True)
    verification_attempts = db.Column(db.Integer, default=0, nullable=False)
    
    reset_otp = db.Column(db.String(6), nullable=True)
    reset_otp_expires_at = db.Column(db.DateTime, nullable=True)
    reset_attempts = db.Column(db.Integer, default=0, nullable=False)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.datetime.now(timezone.utc), onupdate=lambda: datetime.datetime.now(timezone.utc))
    
    emergency_contacts = db.relationship('EmergencyContact', backref='user', cascade='all, delete-orphan', lazy=True)
    trusted_contacts = db.relationship('TrustedContact', backref='user', cascade='all, delete-orphan', lazy=True)
    journeys = db.relationship('Journey', backref='user', cascade='all, delete-orphan', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'phone': self.phone,
            'email': self.email,
            'is_verified': self.is_verified,
            'is_active': self.is_active,
            'onboarding_completed': self.onboarding_completed,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class EmergencyContact(db.Model):
    __tablename__ = 'emergency_contacts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(30), nullable=False)
    relationship = db.Column(db.String(50), nullable=True, default='Contact')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'phone': self.phone,
            'relationship': self.relationship
        }

class TrustedContact(db.Model):
    __tablename__ = 'trusted_contacts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(30), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'phone': self.phone
        }

class Journey(db.Model):
    __tablename__ = 'journeys'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    origin = db.Column(db.String(255), nullable=False)
    destination = db.Column(db.String(255), nullable=False)
    vehicle = db.Column(db.String(50), default='walking')
    departure_time = db.Column(db.String(50), nullable=True)
    arrival_time = db.Column(db.String(50), nullable=True)
    distance = db.Column(db.Float, default=0.0)
    duration = db.Column(db.Integer, default=0)
    safety_score = db.Column(db.Integer, default=0)
    resilience_score = db.Column(db.Integer, default=0)
    max_time_to_haven = db.Column(db.Integer, default=0)
    status = db.Column(db.String(50), default='COMPLETED')
    created_at = db.Column(db.DateTime, default=lambda: datetime.datetime.now(timezone.utc))
    
    routes = db.relationship('Route', backref='journey', cascade='all, delete-orphan', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'origin': self.origin,
            'destination': self.destination,
            'vehicle': self.vehicle,
            'departure_time': self.departure_time,
            'arrival_time': self.arrival_time,
            'distance': self.distance,
            'duration': self.duration,
            'safety_score': self.safety_score,
            'resilience_score': self.resilience_score,
            'max_time_to_haven': self.max_time_to_haven,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Route(db.Model):
    __tablename__ = 'routes'
    
    id = db.Column(db.Integer, primary_key=True)
    journey_id = db.Column(db.Integer, db.ForeignKey('journeys.id'), nullable=False)
    geometry_json = db.Column(db.Text, nullable=False)
    segments_json = db.Column(db.Text, nullable=True)
    havens_json = db.Column(db.Text, nullable=True)
    recommended = db.Column(db.Boolean, default=False)
    
    def get_geometry(self):
        return json.loads(self.geometry_json) if self.geometry_json else []

    def to_dict(self):
        return {
            'id': self.id,
            'journey_id': self.journey_id,
            'geometry': json.loads(self.geometry_json) if self.geometry_json else [],
            'segments': json.loads(self.segments_json) if self.segments_json else [],
            'havens': json.loads(self.havens_json) if self.havens_json else [],
            'recommended': self.recommended
        }

class SafeHaven(db.Model):
    __tablename__ = 'safe_havens'
    
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    address = db.Column(db.String(255), nullable=True)
    operating_hours = db.Column(db.String(100), default='24/7')
    verified = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'address': self.address,
            'operating_hours': self.operating_hours,
            'verified': self.verified
        }

class IncidentReport(db.Model):
    __tablename__ = 'incident_reports'
    
    id = db.Column(db.String(50), primary_key=True)
    location = db.Column(db.String(255), nullable=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(100), nullable=False)
    severity = db.Column(db.String(30), default='medium')
    timestamp = db.Column(db.DateTime, default=lambda: datetime.datetime.now(timezone.utc))
    verified = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'location': self.location,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'type': self.type,
            'severity': self.severity,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'verified': self.verified
        }

class UserFeedback(db.Model):
    __tablename__ = 'user_feedbacks'
    
    id = db.Column(db.Integer, primary_key=True)
    user_name = db.Column(db.String(100), default="Alex Rivera")
    route_name = db.Column(db.String(150), default="Corridor Route")
    rating = db.Column(db.Integer, default=5)
    lighting_rating = db.Column(db.String(50), default="Well-Lit")
    crowd_rating = db.Column(db.String(50), default="Crowded & Active")
    safety_feeling = db.Column(db.String(50), default="Very Safe")
    comments = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'user_name': self.user_name,
            'route_name': self.route_name,
            'rating': self.rating,
            'lighting_rating': self.lighting_rating,
            'crowd_rating': self.crowd_rating,
            'safety_feeling': self.safety_feeling,
            'comments': self.comments,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
