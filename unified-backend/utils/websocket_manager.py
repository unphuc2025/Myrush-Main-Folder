from fastapi import WebSocket
from typing import Dict, List, Set, Any
import json

class ConnectionManager:
    def __init__(self):
        # active_connections: { "user_id": [ws1, ws2], "admin_id": [ws1, ws2] }
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, identifier: str, websocket: WebSocket):
        await websocket.accept()
        if identifier not in self.active_connections:
            self.active_connections[identifier] = []
        self.active_connections[identifier].append(websocket)
        print(f"[WS] New connection for {identifier}. Total connections: {len(self.active_connections[identifier])}")

    def disconnect(self, identifier: str, websocket: WebSocket):
        if identifier in self.active_connections:
            if websocket in self.active_connections[identifier]:
                self.active_connections[identifier].remove(websocket)
            if not self.active_connections[identifier]:
                del self.active_connections[identifier]
        print(f"[WS] Disconnected {identifier}")

    async def send_personal_message(self, message: Any, identifier: str):
        if identifier in self.active_connections:
            msg_str = json.dumps(message) if not isinstance(message, str) else message
            for connection in self.active_connections[identifier]:
                try:
                    await connection.send_text(msg_str)
                except Exception as e:
                    print(f"[WS] Error sending to {identifier}: {e}")

    async def broadcast(self, message: Any):
        msg_str = json.dumps(message) if not isinstance(message, str) else message
        for identifier in self.active_connections:
            for connection in self.active_connections[identifier]:
                try:
                    await connection.send_text(msg_str)
                except Exception as e:
                    print(f"[WS] Error broadcasting to {identifier}: {e}")

# Global manager instance
manager = ConnectionManager()
