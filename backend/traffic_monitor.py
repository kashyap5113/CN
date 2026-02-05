"""Traffic analysis module.

Academic note:
- Interface-level counters (psutil) are used for bandwidth because they are low-overhead
  and represent the total traffic volume entering/leaving the host NIC.
- Packet-level header inspection (Scapy) is used for behavior analysis (pps + protocol mix)
  without reading payload data, preserving privacy and aligning with ethical lab practice.
"""

from __future__ import annotations

import time
from threading import Lock, Thread
from typing import Dict, Optional

import psutil
from scapy.all import AsyncSniffer, IP, TCP, UDP, ICMP  # type: ignore


class TrafficMonitor:
    """Collects real traffic metrics in background threads for non-blocking APIs."""

    def __init__(self, interface: Optional[str] = None, sample_seconds: float = 1.0) -> None:
        self.interface = interface
        self.sample_seconds = sample_seconds

        self._metrics_lock = Lock()
        self._running = False

        self._latest = {
            "bandwidth": {"upload_kbps": 0.0, "download_kbps": 0.0},
            "packets": {"per_second": 0},
            "protocols": {"TCP": 0, "UDP": 0, "ICMP": 0},
            "last_updated": None,
        }

        self._packet_counts = {"total": 0, "TCP": 0, "UDP": 0, "ICMP": 0}
        self._packet_counts_lock = Lock()

        self._sniffer: Optional[AsyncSniffer] = None
        self._sampler_thread: Optional[Thread] = None

    def _packet_handler(self, packet) -> None:  # type: ignore[no-untyped-def]
        """Count packet headers only. Payload is intentionally ignored for privacy."""
        if IP not in packet:
            return

        with self._packet_counts_lock:
            self._packet_counts["total"] += 1
            if packet.haslayer(TCP):
                self._packet_counts["TCP"] += 1
            elif packet.haslayer(UDP):
                self._packet_counts["UDP"] += 1
            elif packet.haslayer(ICMP):
                self._packet_counts["ICMP"] += 1

    def start(self) -> None:
        if self._running:
            return

        self._running = True

        try:
            self._sniffer = AsyncSniffer(prn=self._packet_handler, store=False, iface=self.interface)
            self._sniffer.start()
        except Exception:
            # Keep service alive even when capture permission is unavailable.
            self._sniffer = None

        self._sampler_thread = Thread(target=self._sample_loop, daemon=True)
        self._sampler_thread.start()

    def stop(self) -> None:
        self._running = False

        if self._sniffer:
            try:
                self._sniffer.stop()
            except Exception:
                pass

    def _read_io_counters(self):  # type: ignore[no-untyped-def]
        counters = psutil.net_io_counters(pernic=True)
        if self.interface and self.interface in counters:
            return counters[self.interface]
        return psutil.net_io_counters()

    def _sample_loop(self) -> None:
        previous = self._read_io_counters()
        previous_time = time.time()

        while self._running:
            time.sleep(self.sample_seconds)
            now = time.time()
            current = self._read_io_counters()
            elapsed = max(now - previous_time, 1e-6)

            sent_delta = max(0, current.bytes_sent - previous.bytes_sent)
            recv_delta = max(0, current.bytes_recv - previous.bytes_recv)

            upload_kbps = (sent_delta / 1024.0) / elapsed
            download_kbps = (recv_delta / 1024.0) / elapsed

            with self._packet_counts_lock:
                packet_snapshot = self._packet_counts.copy()
                self._packet_counts = {"total": 0, "TCP": 0, "UDP": 0, "ICMP": 0}

            total_packets = packet_snapshot["total"]
            protocols = {"TCP": 0, "UDP": 0, "ICMP": 0}
            if total_packets > 0:
                protocols = {
                    "TCP": round((packet_snapshot["TCP"] / total_packets) * 100),
                    "UDP": round((packet_snapshot["UDP"] / total_packets) * 100),
                    "ICMP": round((packet_snapshot["ICMP"] / total_packets) * 100),
                }

                diff = 100 - sum(protocols.values())
                if diff != 0:
                    largest = max(protocols, key=protocols.get)
                    protocols[largest] += diff

            with self._metrics_lock:
                self._latest = {
                    "bandwidth": {
                        "upload_kbps": round(upload_kbps, 2),
                        "download_kbps": round(download_kbps, 2),
                    },
                    "packets": {"per_second": int(round(total_packets / elapsed))},
                    "protocols": protocols,
                    "last_updated": int(now),
                }

            previous = current
            previous_time = now

    def get_metrics(self) -> Dict[str, Dict[str, float | int]]:
        with self._metrics_lock:
            return {
                "bandwidth": dict(self._latest["bandwidth"]),
                "packets": dict(self._latest["packets"]),
                "protocols": dict(self._latest["protocols"]),
            }
