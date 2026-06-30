import os
import json
import firebase_admin
from firebase_admin import credentials, auth
from app.config import settings

class FirebaseService:
    _instance = None
    initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FirebaseService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        # 1. Retrieve the credentials string or path from centralized settings
        firebase_env = settings.FIREBASE_SERVICE_ACCOUNT
        
        if not firebase_env:
            print("Warning: FIREBASE_SERVICE_ACCOUNT is empty. Firebase Admin SDK will not be initialized. Only mock tokens will work.")
            self.initialized = False
            return

        # 2. Check if the setting points to a valid local file path
        if os.path.exists(firebase_env):
            try:
                print(f"Initializing Firebase Admin SDK using credential file path: {firebase_env}")
                cred = credentials.Certificate(firebase_env)
                if not firebase_admin._apps:
                    firebase_admin.initialize_app(cred)
                self.initialized = True
            except Exception as e:
                print(f"Warning: Error loading Firebase credential file: {e}. Firebase authentication will not be initialized.")
                self.initialized = False
        else:
            # 3. Otherwise treat it as raw JSON content
            try:
                print("Initializing Firebase Admin SDK using raw JSON string from environment.")
                cred_dict = json.loads(firebase_env)
                cred = credentials.Certificate(cred_dict)
                if not firebase_admin._apps:
                    firebase_admin.initialize_app(cred)
                self.initialized = True
            except Exception as e:
                print(f"Warning: Error parsing raw Firebase JSON string: {e}. Firebase authentication will not be initialized.")
                self.initialized = False

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
        
        if not self.initialized:
            raise ValueError("Firebase authentication is not initialized because credentials were not provided or invalid.")
        
        return auth.verify_id_token(token)

# Export singleton instance
firebase_service = FirebaseService()
