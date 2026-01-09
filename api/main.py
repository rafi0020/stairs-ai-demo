"""
FastAPI backend for live Stairs-AI demo mode.
Optional - only needed for real-time inference, not required for GitHub Pages static demo.
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import asyncio
import json

app = FastAPI(
    title="Stairs-AI Live API",
    description="Real-time event streaming for Staircase Safety Monitoring",
    version="1.0.0"
)

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory event store (replace with database in production)
events_store: List[dict] = []
connected_clients: List[WebSocket] = []


class Event(BaseModel):
    """Event model matching Python pipeline output."""
    event_id: str
    event_type: str
    timestamp_sec: float
    frame_number: int
    person_id: int
    old_state: List[str]
    new_state: List[str]
    debounce_triggered: bool
    evidence_frame_path: Optional[str] = None
    details: dict = {}


class EventResponse(BaseModel):
    """Response wrapper for events."""
    events: List[Event]
    total: int


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "Stairs-AI Live API",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/events", response_model=EventResponse)
async def get_events(
    limit: int = 100,
    offset: int = 0,
    event_type: Optional[str] = None
):
    """
    Retrieve logged events.
    
    Args:
        limit: Maximum number of events to return
        offset: Number of events to skip
        event_type: Filter by event type (optional)
    """
    filtered = events_store
    
    if event_type:
        filtered = [e for e in filtered if e.get("event_type") == event_type]
    
    paginated = filtered[offset:offset + limit]
    
    return EventResponse(
        events=paginated,
        total=len(filtered)
    )


@app.post("/events", status_code=201)
async def create_event(event: Event):
    """
    Log a new event from the inference pipeline.
    Broadcasts to all connected WebSocket clients.
    """
    event_dict = event.model_dump()
    event_dict["received_at"] = datetime.utcnow().isoformat()
    events_store.append(event_dict)
    
    # Broadcast to WebSocket clients
    message = json.dumps({"type": "new_event", "data": event_dict})
    disconnected = []
    
    for client in connected_clients:
        try:
            await client.send_text(message)
        except Exception:
            disconnected.append(client)
    
    # Clean up disconnected clients
    for client in disconnected:
        connected_clients.remove(client)
    
    return {"status": "created", "event_id": event.event_id}


@app.delete("/events")
async def clear_events():
    """Clear all stored events (for demo reset)."""
    events_store.clear()
    return {"status": "cleared", "count": 0}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time event streaming.
    Clients receive new events as they are logged.
    """
    await websocket.accept()
    connected_clients.append(websocket)
    
    try:
        # Send current events on connect
        await websocket.send_text(json.dumps({
            "type": "init",
            "data": events_store[-50:] if events_store else []
        }))
        
        # Keep connection alive and handle client messages
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
            
    except WebSocketDisconnect:
        if websocket in connected_clients:
            connected_clients.remove(websocket)
    except Exception:
        if websocket in connected_clients:
            connected_clients.remove(websocket)


@app.get("/stats")
async def get_stats():
    """Get aggregate statistics from logged events."""
    if not events_store:
        return {
            "total_events": 0,
            "event_types": {},
            "connected_clients": len(connected_clients)
        }
    
    event_types = {}
    for event in events_store:
        et = event.get("event_type", "unknown")
        event_types[et] = event_types.get(et, 0) + 1
    
    return {
        "total_events": len(events_store),
        "event_types": event_types,
        "connected_clients": len(connected_clients),
        "first_event_time": events_store[0].get("timestamp_sec"),
        "last_event_time": events_store[-1].get("timestamp_sec")
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
