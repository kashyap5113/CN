"""LAN device discovery using ARP information.

This module prefers active ARP scanning with Scapy, and falls back to parsing
system ARP cache for environments where raw socket permissions are restricted.
"""

from __future__ import annotations

import ipaddress
import re
import socket
from typing import Dict, List, Optional

import psutil
from scapy.all import ARP, Ether, srp  # type: ignore

from blocked_manager import BlockedManager


class DeviceScanner:
    """Discovers LAN devices and assigns explainable statuses."""

    def __init__(self, blocked_manager: BlockedManager, interface: Optional[str] = None) -> None:
        self.blocked_manager = blocked_manager
        self.interface = interface

    def _get_local_network(self) -> Optional[str]:
        addrs = psutil.net_if_addrs()
        for _, entries in addrs.items():
            for entry in entries:
                if getattr(entry, "family", None) == socket.AF_INET:
                    ip_addr = entry.address
                    netmask = entry.netmask
                    if ip_addr.startswith("127.") or not netmask:
                        continue
                    try:
                        network = ipaddress.IPv4Network(f"{ip_addr}/{netmask}", strict=False)
                        return str(network)
                    except ValueError:
                        continue
        return None

    def _scan_with_scapy(self) -> List[Dict[str, str]]:
        network = self._get_local_network()
        if not network:
            return []

        arp = ARP(pdst=network)
        broadcast = Ether(dst="ff:ff:ff:ff:ff:ff")
        packet = broadcast / arp

        answered = srp(packet, timeout=2, retry=1, verbose=False, iface=self.interface)[0]

        devices: List[Dict[str, str]] = []
        for _, response in answered:
            devices.append({"ip": response.psrc, "mac": response.hwsrc.upper()})
        return devices

    def _scan_from_arp_table(self) -> List[Dict[str, str]]:
        devices: List[Dict[str, str]] = []
        pattern = re.compile(r"^(\d+\.\d+\.\d+\.\d+)\s+\S+\s+(\S+)\s+")

        try:
            with open("/proc/net/arp", "r", encoding="utf-8") as arp_file:
                for line in arp_file.readlines()[1:]:
                    match = pattern.match(line)
                    if not match:
                        continue
                    ip, mac = match.groups()
                    if mac == "00:00:00:00:00:00":
                        continue
                    devices.append({"ip": ip, "mac": mac.upper()})
        except OSError:
            return []

        return devices

    def discover_devices(self) -> List[Dict[str, str]]:
        try:
            raw_devices = self._scan_with_scapy()
        except Exception:
            raw_devices = []

        if not raw_devices:
            raw_devices = self._scan_from_arp_table()

        seen = set()
        devices: List[Dict[str, str]] = []
        local_hostname = socket.gethostname().lower()

        for item in raw_devices:
            ip_addr = item["ip"]
            mac_addr = item["mac"]
            key = (ip_addr, mac_addr)
            if key in seen:
                continue
            seen.add(key)

            host_name = "Unknown Device"
            try:
                reverse = socket.gethostbyaddr(ip_addr)[0]
                host_name = reverse
            except (socket.herror, socket.gaierror, OSError):
                pass

            is_unknown = host_name.lower() == "unknown device"
            status = "Risk" if is_unknown else "Active"

            if self.blocked_manager.is_blocked(ip_addr, mac_addr):
                status = "Blocked"
            elif host_name.lower() == local_hostname:
                status = "Active"

            devices.append(
                {
                    "name": host_name,
                    "ip": ip_addr,
                    "mac": mac_addr,
                    "status": status,
                }
            )

        if not devices:
            return []

        return devices
