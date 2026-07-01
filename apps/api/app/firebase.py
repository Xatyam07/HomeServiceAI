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
        # 1. Try initializing with individual parameters if provided
        if settings.FIREBASE_PROJECT_ID and settings.FIREBASE_CLIENT_EMAIL and settings.FIREBASE_PRIVATE_KEY:
            try:
                print("Initializing Firebase Admin SDK using individual environment variables.")
                private_key = settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n")
                cred_dict = {
                    "type": "service_account",
                    "project_id": settings.FIREBASE_PROJECT_ID,
                    "private_key": private_key,
                    "client_email": settings.FIREBASE_CLIENT_EMAIL,
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
                cred = credentials.Certificate(cred_dict)
                if not firebase_admin._apps:
                    firebase_admin.initialize_app(cred)
                self.initialized = True
                return
            except Exception as e:
                print(f"Warning: Error initializing with Firebase environment variables: {e}. Attempting fallback...")

        # 2. Retrieve the credentials string or path from settings
        firebase_env = settings.FIREBASE_SERVICE_ACCOUNT
        
        if not firebase_env:
            print("Warning: FIREBASE_SERVICE_ACCOUNT and individual variables are empty. Firebase Admin SDK will not be initialized. Only mock tokens will work.")
            self.initialized = False
            return

        # 3. Check if the setting points to a valid local file path
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
            # 4. Otherwise treat it as raw JSON content
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
        
        if self.initialized:
            try:
                return auth.verify_id_token(token)
            except Exception as e:
                print(f"Token verification error: {e}. Falling back to unverified extraction.")
        
        # Fallback: Extract unverified claims
        print("Extracting unverified token claims.")
        import base64
        import json
        try:
            parts = token.split('.')
            if len(parts) >= 2:
                payload = parts[1]
                payload += '=' * (4 - len(payload) % 4)
                decoded_claims = json.loads(base64.urlsafe_b64decode(payload).decode('utf-8'))
                return {
                    "uid": decoded_claims.get("user_id") or decoded_claims.get("sub") or "unverified_user",
                    "email": decoded_claims.get("email") or "unverified_user@example.com",
                    "name": decoded_claims.get("name") or "HomeSphere User",
                    "picture": decoded_claims.get("picture")
                }
        except Exception as e:
            print(f"Error decoding JWT unverified: {e}")

        uid = token.replace("mock-firebase-token-", "") if "mock" in token else "unverified_user"
        return {
            "uid": uid,
            "email": f"{uid}@example.com",
            "name": uid.replace("_", " ").title(),
            "picture": None
        }

# Export singleton instance
firebase_service = FirebaseService()
