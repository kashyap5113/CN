"""FastAPI backend for Securing LAN Monitoring System.

Designed for academic demos:
- Real interface traffic via psutil.
- Real packet header statistics via scapy.
- LAN device discovery via ARP scan/cache.
- Rule-based security alerts (no AI/ML).
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


class BlockRequest(BaseModel):
    ip: Optional[str] = Field(default=None, description="IPv4 address to block logically")
    mac: Optional[str] = Field(default=None, description="MAC address to block logically")
    reason: str = Field(default="Manual admin action")


app = FastAPI(title="Securing LAN Monitoring System API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:4173",
        "http://127.0.0.1",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

blocked_manager = BlockedManager(storage_path=Path(__file__).parent / "blocked_devices.json")
traffic_monitor = TrafficMonitor()
device_scanner = DeviceScanner(blocked_manager=blocked_manager)
threat_detector = ThreatDetector()


@app.on_event("startup")
def on_startup() -> None:
    traffic_monitor.start()


@app.on_event("shutdown")
def on_shutdown() -> None:
    traffic_monitor.stop()


@app.get("/api/traffic")
def get_traffic() -> dict:
    return traffic_monitor.get_metrics()


@app.get("/api/devices")
def get_devices() -> dict:
    devices = device_scanner.discover_devices()
    active = sum(1 for d in devices if d.get("status") == "Active")
    risk = sum(1 for d in devices if d.get("status") == "Risk")
    blocked = sum(1 for d in devices if d.get("status") == "Blocked")

    return {
        "total": len(devices),
        "active": active,
        "risk": risk,
        "blocked": blocked,
        "devices": devices,
    }


@app.get("/api/alerts")
def get_alerts() -> dict:
    traffic = traffic_monitor.get_metrics()
    devices = device_scanner.discover_devices()
    alerts = threat_detector.evaluate(traffic=traffic, devices=devices)

    return {"count": len(alerts), "alerts": alerts}


@app.post("/api/block")
def block_device(payload: BlockRequest) -> dict:
    try:
        result = blocked_manager.add_block(ip=payload.ip, mac=payload.mac, reason=payload.reason)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return result


@app.get("/api/blocked")
def get_blocked() -> dict:
    blocked = blocked_manager.get_blocked()
    return {"count": len(blocked), "blocked": blocked}
