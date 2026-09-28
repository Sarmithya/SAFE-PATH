import os
import json
from datetime import datetime
from backend.database.db import db
from backend.models.models import SafeHaven, IncidentReport, User, EmergencyContact, TrustedContact
from backend.utils.auth_helper import hash_password

def seed_database():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    demo_dir = os.path.join(base_dir, 'demo_data')

    # Seed Safe Havens if empty
    if SafeHaven.query.count() == 0:
        havens_file = os.path.join(demo_dir, 'mock_havens.json')
        if os.path.exists(havens_file):
            with open(havens_file, 'r', encoding='utf-8') as f:
                havens_data = json.load(f)
                for h in havens_data:
                    haven = SafeHaven(
                        id=h['id'],
                        name=h['name'],
                        type=h['type'],
                        latitude=h['latitude'],
                        longitude=h['longitude'],
                        address=h.get('address'),
                        operating_hours=h.get('operating_hours', '24/7'),
                        verified=h.get('verified', True)
                    )
                    db.session.add(haven)
            db.session.commit()
            print(f"[Seed] Successfully seeded {len(havens_data)} safe havens.")

    # Seed Incidents if empty
    if IncidentReport.query.count() == 0:
        incidents_file = os.path.join(demo_dir, 'mock_incidents.json')
        if os.path.exists(incidents_file):
            with open(incidents_file, 'r', encoding='utf-8') as f:
                incidents_data = json.load(f)
                for inc in incidents_data:
                    incident = IncidentReport(
                        id=inc['id'],
                        location=inc.get('location'),
                        latitude=inc['latitude'],
                        longitude=inc['longitude'],
                        type=inc['type'],
                        severity=inc.get('severity', 'medium'),
                        verified=inc.get('verified', True)
                    )
                    db.session.add(incident)
            db.session.commit()
            print(f"[Seed] Successfully seeded {len(incidents_data)} incident reports.")

    # Seed Demo User if empty
    if User.query.filter_by(email='demo@saferoute.app').first() is None:
        demo_user = User(
            full_name='Alex Rivera (Demo)',
            email='demo@saferoute.app',
            phone='+1 (555) 019-2834',
            password_hash=hash_password('demo1234'),
            is_verified=True,
            is_active=True,
            onboarding_completed=True
        )
        db.session.add(demo_user)
        db.session.commit()

        # Add demo contacts
        contact1 = EmergencyContact(
            user_id=demo_user.id,
            name='Sarah Rivera (Mother)',
            phone='+1 (555) 019-9988',
            relationship='Parent'
        )
        contact2 = EmergencyContact(
            user_id=demo_user.id,
            name='Campus Security Dispatch',
            phone='+1 (555) 019-1122',
            relationship='Campus Police'
        )
        trusted = TrustedContact(
            user_id=demo_user.id,
            name='Jordan Lee (Roommate)',
            phone='+1 (555) 019-4455'
        )
        db.session.add_all([contact1, contact2, trusted])
        db.session.commit()
        print("[Seed] Created default demo user: demo@saferoute.app / demo1234")
