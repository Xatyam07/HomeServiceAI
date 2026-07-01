from fastapi import WebSocket
from typing import Dict
import json

class ConnectionManager:
    def __init__(self):
        # Maps user_id (string) to their active WebSocket connection
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[str(user_id)] = websocket
        print(f"WebSocket connected for user: {user_id}")

    def disconnect(self, user_id: str):
        user_id_str = str(user_id)
        if user_id_str in self.active_connections:
            del self.active_connections[user_id_str]
            print(f"WebSocket disconnected for user: {user_id_str}")

    async def send_personal_message(self, message: dict, user_id: str):
        user_id_str = str(user_id)
        if user_id_str in self.active_connections:
            websocket = self.active_connections[user_id_str]
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                print(f"Error sending message to {user_id_str}: {e}")
                self.disconnect(user_id_str)

    async def broadcast(self, message: dict):
        for user_id_str, websocket in list(self.active_connections.items()):
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                print(f"Error broadcasting message to {user_id_str}: {e}")
                self.disconnect(user_id_str)

manager = ConnectionManager()
