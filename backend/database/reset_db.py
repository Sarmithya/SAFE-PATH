import os
import sys

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.app import create_app
from backend.database.db import db
from backend.database.seed import seed_database

def reset_and_reseed():
    app = create_app()
    with app.app_context():
        print("[SafeRoute] Dropping all tables...")
        db.drop_all()
        print("[SafeRoute] Creating fresh database schema...")
        db.create_all()
        print("[SafeRoute] Seeding deterministic demo data...")
        seed_database()
        print("[SafeRoute] Database reset complete! Ready for demonstration.")

if __name__ == "__main__":
    reset_and_reseed()
