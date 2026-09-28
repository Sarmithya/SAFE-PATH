import unittest
import json
from backend.app import create_app
from backend.database.db import db
from backend.models.models import User

class TestAuth(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        with self.app.app_context():
            User.query.filter((User.email == "test.user@saferoute.app") | (User.email == "weak@saferoute.app") | (User.email == "mismatch@saferoute.app")).delete()
            db.session.commit()

    def test_full_auth_lifecycle(self):
        email = "test.user@saferoute.app"
        password = "SecurePassword123!"

        # 1. Register valid user
        reg_payload = {
            "full_name": "Test User",
            "email": email,
            "password": password,
            "confirm_password": password,
            "phone": "+919876543210",
            "terms_accepted": True
        }
        res = self.client.post("/api/auth/register", data=json.dumps(reg_payload), content_type="application/json")
        self.assertEqual(res.status_code, 201)
        reg_data = json.loads(res.data)
        self.assertTrue(reg_data.get("requires_verification"))
        otp = reg_data.get("dev_otp")
        self.assertIsNotNone(otp)

        # 2. Register with invalid email
        res_bad_email = self.client.post("/api/auth/register", data=json.dumps({
            "full_name": "Bad Email",
            "email": "invalid-email-format",
            "password": password
        }), content_type="application/json")
        self.assertEqual(res_bad_email.status_code, 400)

        # 3. Register with weak password
        res_weak_pwd = self.client.post("/api/auth/register", data=json.dumps({
            "full_name": "Weak Pwd",
            "email": "weak@saferoute.app",
            "password": "123"
        }), content_type="application/json")
        self.assertEqual(res_weak_pwd.status_code, 400)

        # 4. Register with mismatched passwords
        res_mismatch = self.client.post("/api/auth/register", data=json.dumps({
            "full_name": "Mismatch",
            "email": "mismatch@saferoute.app",
            "password": password,
            "confirm_password": "DifferentPassword123!"
        }), content_type="application/json")
        self.assertEqual(res_mismatch.status_code, 400)

        # 5. Register duplicate email
        res_dup = self.client.post("/api/auth/register", data=json.dumps(reg_payload), content_type="application/json")
        self.assertEqual(res_dup.status_code, 409)

        # 6. Login before verification -> Expect 403 Unverified with new OTP
        res_unverified_login = self.client.post("/api/auth/login", data=json.dumps({
            "identifier": email,
            "password": password
        }), content_type="application/json")
        self.assertEqual(res_unverified_login.status_code, 403)
        unverified_data = json.loads(res_unverified_login.data)
        if unverified_data.get("dev_otp"):
            otp = unverified_data.get("dev_otp")

        # 7. Verify with invalid OTP -> Expect 400
        res_bad_otp = self.client.post("/api/auth/verify-otp", data=json.dumps({
            "identifier": email,
            "otp": "000000"
        }), content_type="application/json")
        self.assertEqual(res_bad_otp.status_code, 400)

        # 8. Verify with correct OTP -> Expect 200 + Token
        res_verify = self.client.post("/api/auth/verify-otp", data=json.dumps({
            "identifier": email,
            "otp": otp
        }), content_type="application/json")
        self.assertEqual(res_verify.status_code, 200)
        verify_data = json.loads(res_verify.data)
        token = verify_data.get("token")
        self.assertIsNotNone(token)

        # 9. Login with correct credentials -> Expect 200 + Token
        login_res = self.client.post("/api/auth/login", data=json.dumps({
            "identifier": email,
            "password": password
        }), content_type="application/json")
        self.assertEqual(login_res.status_code, 200)
        login_data = json.loads(login_res.data)
        self.assertEqual(login_data["user"]["email"], email)

        # 10. Login with incorrect credentials -> Expect 401
        bad_login_res = self.client.post("/api/auth/login", data=json.dumps({
            "identifier": email,
            "password": "WrongPassword123!"
        }), content_type="application/json")
        self.assertEqual(bad_login_res.status_code, 401)

        # 11. Profile Setup / Onboarding -> Expect 200
        setup_res = self.client.post("/api/auth/profile-setup", data=json.dumps({
            "emergency_contact_name": "Mom",
            "emergency_contact_phone": "+919876543211",
            "emergency_contact_rel": "Mother"
        }), headers={"Authorization": f"Bearer {login_data['token']}"}, content_type="application/json")
        self.assertEqual(setup_res.status_code, 200)

        # 12. GET /api/auth/me (Session Restoration) -> Expect 200
        me_res = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {login_data['token']}"})
        self.assertEqual(me_res.status_code, 200)
        me_data = json.loads(me_res.data)
        self.assertEqual(me_data["user"]["email"], email)
        self.assertTrue(me_data["user"]["onboarding_completed"])

        # 13. Access protected route without token -> Expect 401
        no_auth_res = self.client.get("/api/auth/me")
        self.assertEqual(no_auth_res.status_code, 401)

        # 14. Forgot Password -> Expect 200 + OTP
        forgot_res = self.client.post("/api/auth/forgot-password", data=json.dumps({
            "identifier": email
        }), content_type="application/json")
        self.assertEqual(forgot_res.status_code, 200)
        forgot_data = json.loads(forgot_res.data)
        reset_otp = forgot_data.get("dev_otp")
        self.assertIsNotNone(reset_otp)

        # 15. Reset Password -> Expect 200
        new_pwd = "BrandNewPassword123!"
        reset_res = self.client.post("/api/auth/reset-password", data=json.dumps({
            "identifier": email,
            "otp": reset_otp,
            "new_password": new_pwd,
            "confirm_password": new_pwd
        }), content_type="application/json")
        self.assertEqual(reset_res.status_code, 200)

        # 16. Login with new password -> Expect 200
        new_login_res = self.client.post("/api/auth/login", data=json.dumps({
            "identifier": email,
            "password": new_pwd
        }), content_type="application/json")
        self.assertEqual(new_login_res.status_code, 200)

    def test_demo_user_login(self):
        login_res = self.client.post("/api/auth/login", data=json.dumps({
            "identifier": "demo@saferoute.app",
            "password": "demo1234"
        }), content_type="application/json")
        self.assertEqual(login_res.status_code, 200)

if __name__ == "__main__":
    unittest.main()
