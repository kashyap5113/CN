document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("deviceTableBody");
  if (!tableBody) return;

  let devices = [];

  async function fetchDevices() {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/devices");
      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      devices = data.devices || [];
      renderDevices();
    } catch (err) {
      console.error("Failed to fetch devices:", err);
      tableBody.innerHTML =
        `<tr><td colspan="5">Failed to load devices from backend.</td></tr>`;
    }
  }

  function renderDevices() {
    if (devices.length === 0) {
      tableBody.innerHTML =
        `<tr><td colspan="5">No devices detected.</td></tr>`;
      return;
    }

    tableBody.innerHTML = devices.map((device, index) => `
      <tr>
        <td>${device.name || "Unknown"}</td>
        <td>${device.ip || "-"}</td>
        <td>${device.mac || "-"}</td>
        <td>${statusBadge(device.status)}</td>
        <td>
          <button class="btn btn-danger" data-index="${index}">
            Block
          </button>
        </td>
      </tr>
    `).join("");
  }

  function statusBadge(status) {
    if (status === "Active")
      return `<span class="status-pill status-active">Active</span>`;
    if (status === "Idle")
      return `<span class="status-pill status-idle">Idle</span>`;
    if (status === "Risk")
      return `<span class="status-pill status-risk">Risk</span>`;
    return `<span class="status-pill">Unknown</span>`;
  }

  tableBody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-index]");
    if (!btn) return;

    const device = devices[Number(btn.dataset.index)];
    if (!device) return;

    if (!confirm(`Block device ${device.name || device.mac}?`)) return;

    try {
      const res = await fetch("http://127.0.0.1:8000/api/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mac: device.mac,
          reason: "Blocked from Connected Devices UI"
        })
      });

      if (!res.ok) throw new Error("Block failed");

      alert("Device blocked successfully");
      fetchDevices();
    } catch (err) {
      console.error(err);
      alert("Failed to block device");
    }
  });

  // Initial load + auto refresh
  fetchDevices();
  setInterval(fetchDevices, 5000);
});
