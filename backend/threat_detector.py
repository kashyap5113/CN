"""Rule-based threat detection.

Rules are intentionally simple and explainable for viva:
- High packets/sec indicates suspicious traffic bursts.
- High ICMP share indicates potential probing/scanning behavior.
- Unknown devices indicate unauthorized access risk.
"""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List


class ThreatDetector:
    def __init__(self, pps_threshold: int = 400, icmp_threshold_percent: int = 30) -> None:
        self.pps_threshold = pps_threshold
        self.icmp_threshold_percent = icmp_threshold_percent

    def evaluate(self, traffic: Dict, devices: List[Dict]) -> List[Dict[str, str]]:
        alerts: List[Dict[str, str]] = []
        now = datetime.now().strftime("%H:%M:%S")

        packets_per_second = int(traffic.get("packets", {}).get("per_second", 0))
        icmp_share = int(traffic.get("protocols", {}).get("ICMP", 0))

        if packets_per_second >= self.pps_threshold:
            alerts.append(
                {
                    "attack_type": "Suspicious Traffic Volume",
                    "source_ip": "Network-wide",
                    "time": now,
                    "severity": "High",
                    "message": f"Packets/sec crossed threshold ({packets_per_second} >= {self.pps_threshold}).",
                }
            )

        if icmp_share >= self.icmp_threshold_percent:
            alerts.append(
                {
                    "attack_type": "Possible Network Scan",
                    "source_ip": "Network-wide",
                    "time": now,
                    "severity": "Medium",
                    "message": f"ICMP ratio is high ({icmp_share}% >= {self.icmp_threshold_percent}%).",
                }
            )

        for device in devices:
            if device.get("status") == "Risk":
                alerts.append(
                    {
                        "attack_type": "Unauthorized Device Warning",
                        "source_ip": device.get("ip", "Unknown"),
                        "time": now,
                        "severity": "Medium",
                        "message": f"Unknown MAC/hostname observed: {device.get('mac', 'N/A')}",
                    }
                )

        return alerts
