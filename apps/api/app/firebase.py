import os
import json
import firebase_admin
from firebase_admin import credentials, auth

class FirebaseService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FirebaseService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        # 1. Retrieve the credentials string or path from environment
        firebase_env = os.getenv("FIREBASE_SERVICE_ACCOUNT", "apps/api/secrets/firebase-admin.json")
        
        if not firebase_env:
            print("Warning: FIREBASE_SERVICE_ACCOUNT environment variable is empty. Initializing with default credentials.")
            if not firebase_admin._apps:
                firebase_admin.initialize_app()
            return

        # 2. Check if the environment variable points to a valid file path
        if os.path.exists(firebase_env):
            try:
                print(f"Initializing Firebase Admin SDK using credential file path: {firebase_env}")
                cred = credentials.Certificate(firebase_env)
                if not firebase_admin._apps:
                    firebase_admin.initialize_app(cred)
            except Exception as e:
                print(f"Error loading Firebase credential file: {e}. Falling back to default.")
                if not firebase_admin._apps:
                    firebase_admin.initialize_app()
        else:
            # 3. Otherwise treat it as raw JSON content (useful for Render/Vercel/Heroku config strings)
            try:
                print("Initializing Firebase Admin SDK using raw JSON string from environment.")
                cred_dict = json.loads(firebase_env)
                cred = credentials.Certificate(cred_dict)
                if not firebase_admin._apps:
                    firebase_admin.initialize_app(cred)
            except Exception as e:
                print(f"Error parsing raw Firebase JSON string: {e}. Falling back to default.")
                if not firebase_admin._apps:
                    firebase_admin.initialize_app()

    def verify_token(self, token: str) -> dict:
        """Verifies the Firebase ID token and returns the decoded token payload."""
        # For mock testing local visual checks
        if token.startswith("mock-firebase-token-"):
            uid = token.replace("mock-firebase-token-", "")
            return {
                "uid": uid,
                "email": f"{uid}@example.com",
                "name": uid.replace("_", " ").title(),
                "picture": None
            }
        
        return auth.verify_id_token(token)

# Export singleton instance
firebase_service = FirebaseService()
