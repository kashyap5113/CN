"""
FastAPI backend for Securing LAN Monitoring System.

Academic-focused implementation:
- Real LAN device discovery using ARP
- Real traffic statistics using psutil
- Rule-based threat detection
- Logical device blocking (persistent)
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from blocked_manager import BlockedManager
from device_scanner import DeviceScanner
from threat_detector import ThreatDetector
from traffic_monitor import TrafficMonitor


# -------------------- Models --------------------

class BlockRequest(BaseModel):
    ip: Optional[str] = Field(default=None, description="IPv4 address to block")
    mac: Optional[str] = Field(default=None, description="MAC address to block")
    reason: str = Field(default="Manual admin action")


# -------------------- App Setup --------------------

app = FastAPI(
    title="Securing LAN Monitoring System API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://127.0.0.1",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- Global Singletons --------------------

blocked_manager = BlockedManager(
    storage_path=Path(__file__).parent / "blocked_devices.json"
)

traffic_monitor = TrafficMonitor()
device_scanner = DeviceScanner(blocked_manager=blocked_manager)
threat_detector = ThreatDetector()


# -------------------- Lifecycle --------------------

@app.on_event("startup")
def on_startup() -> None:
    traffic_monitor.start()


@app.on_event("shutdown")
def on_shutdown() -> None:
    traffic_monitor.stop()


# -------------------- API Endpoints --------------------

@app.get("/")
def root():
    return {
        "message": "Securing LAN Monitoring System API",
        "docs": "/docs"
    }


@app.get("/api/traffic")
def get_traffic() -> dict:
    return traffic_monitor.get_metrics()


@app.get("/api/devices")
def get_devices() -> dict:
    """
    Returns ONLY real, dynamically discovered devices.
    Blocked devices are excluded.
    """
    devices = device_scanner.discover_devices()

    # Filter out blocked devices
    active_devices = [d for d in devices if d["status"] != "Blocked"]

    return {
        "total": len(active_devices),
        "active": sum(1 for d in active_devices if d["status"] == "Active"),
        "risk": sum(1 for d in active_devices if d["status"] == "Risk"),
        "blocked": len(blocked_manager.get_blocked()),
        "devices": active_devices,
    }


@app.get("/api/alerts")
def get_alerts() -> dict:
    traffic = traffic_monitor.get_metrics()
    devices = device_scanner.discover_devices()
    alerts = threat_detector.evaluate(traffic=traffic, devices=devices)

    return {
        "count": len(alerts),
        "alerts": alerts
    }


@app.post("/api/block")
def block_device(payload: BlockRequest) -> dict:
    """
    Logically blocks a device (persistent).
    """
    if not payload.ip and not payload.mac:
        raise HTTPException(
            status_code=400,
            detail="Either IP or MAC must be provided"
        )

    result = blocked_manager.add_block(
        ip=payload.ip,
        mac=payload.mac,
        reason=payload.reason
    )

    return result


@app.get("/api/blocked")
def get_blocked() -> dict:
    blocked = blocked_manager.get_blocked()
    return {
        "count": len(blocked),
        "devices": blocked
    }
