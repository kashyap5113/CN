"""Logical block-list management for demo-safe LAN monitoring.

This module does NOT modify OS firewall rules. It stores blocked IP/MAC entries
for academic demonstration, which is safer for college lab environments.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
import json
from pathlib import Path
from threading import Lock
from typing import Dict, List, Optional


@dataclass
class BlockedEntry:
    ip: Optional[str]
    mac: Optional[str]
    reason: str
    blocked_at: str


class BlockedManager:
    """Thread-safe in-memory + file-backed logical block list."""

    def __init__(self, storage_path: str | Path) -> None:
        self.storage_path = Path(storage_path)
        self._lock = Lock()
        self._entries: List[BlockedEntry] = []
        self._load()

    def _load(self) -> None:
        if not self.storage_path.exists():
            self._entries = []
            return

        try:
            raw = json.loads(self.storage_path.read_text(encoding="utf-8"))
            self._entries = [BlockedEntry(**item) for item in raw if isinstance(item, dict)]
        except (json.JSONDecodeError, OSError, TypeError, ValueError):
            self._entries = []

    def _save(self) -> None:
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        payload = [asdict(entry) for entry in self._entries]
        self.storage_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def add_block(self, ip: Optional[str], mac: Optional[str], reason: str = "Manual admin action") -> Dict[str, str]:
        if not ip and not mac:
            raise ValueError("Either IP or MAC is required.")

        with self._lock:
            duplicate = next(
                (
                    item
                    for item in self._entries
                    if (ip and item.ip == ip) or (mac and item.mac and item.mac.lower() == mac.lower())
                ),
                None,
            )
            if duplicate:
                return {"status": "already_blocked", "message": "Device already blocked."}

            entry = BlockedEntry(
                ip=ip,
                mac=mac.upper() if mac else None,
                reason=reason,
                blocked_at=datetime.now(timezone.utc).isoformat(),
            )
            self._entries.append(entry)
            self._save()

        return {"status": "blocked", "message": "Device added to logical block list."}

    def is_blocked(self, ip: Optional[str], mac: Optional[str]) -> bool:
        if not ip and not mac:
            return False

        with self._lock:
            for entry in self._entries:
                if ip and entry.ip == ip:
                    return True
                if mac and entry.mac and entry.mac.lower() == mac.lower():
                    return True
        return False

    def get_blocked(self) -> List[Dict[str, Optional[str]]]:
        with self._lock:
            return [asdict(entry) for entry in self._entries]
