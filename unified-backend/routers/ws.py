from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from utils.websocket_manager import manager
import schemas
import json
from typing import Optional
from jose import jwt
from dependencies import SECRET_KEY, ALGORITHM

router = APIRouter(
    tags=["websockets"],
)

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    """
    WebSocket endpoint for real-time notifications.
    Clients should pass the auth token in the query params: /ws?token=...
    Identifier can be either 'admin-token-{uuid}' or the JWT for users.
    """
    # Simple extraction for now - we'll refine auth in Phase 2
    identifier = "anonymous"
    if token:
        if token.startswith("admin-token-"):
            identifier = token.replace("admin-token-", "")
        else:
            # For users, decode JWT to get sub
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                identifier = payload.get("sub")
                print(f"[WS] Authenticated user: {identifier}")
            except Exception as e:
                print(f"[WS] Auth Error for token {token[:10]}...: {e}")
                identifier = token # Fallback
            
    
    await manager.connect(str(identifier), websocket)
    try:
        while True:
            # Keep connection alive and listen for any pings
            data = await websocket.receive_text()
            # Echo back or handle client commands if needed
            await websocket.send_text(f"Message received: {data}")
    except WebSocketDisconnect:
        manager.disconnect(str(identifier), websocket)
    except Exception as e:
        print(f"[WS ERROR] {e}")
        manager.disconnect(str(identifier), websocket)
