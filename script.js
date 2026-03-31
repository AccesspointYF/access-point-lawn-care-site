const script.google.com/macros/s/.../exec";
const form = document.getElementById("bookingForm");
const notice = document.getElementById("formNotice");
const submitBtn = document.getElementById("submitBtn");
const leadRows = document.getElementById("leadRows");
const exportCsvBtn = document.getElementById("exportCsvBtn");

function getLeads() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch {
    return [];
  }
}

function setLeads(leads) {
  localStorage.setItem(storageKey, JSON.stringify(leads));
}

function renderLeads() {
  const leads = getLeads();
  if (!leads.length) {
    leadRows.innerHTML = '<div style="padding:16px" class="muted">No leads captured yet. Submit the booking form to start filling your lead tracker.</div>';
    return;
  }
  leadRows.innerHTML = leads.slice(0, 8).map(lead => `
    <div class="lead-row-6">
      <div><strong>${lead.leadId}</strong></div>
      <div>${lead.name || ""}</div>
      <div>${lead.service || ""}</div>
      <div>${lead.date || ""} • ${lead.time || ""}</div>
      <div>${lead.phone || ""}</div>
      <div><span class="status">${lead.status || "New Lead"}</span></div>
    </div>
  `).join("");
}

function showNotice(kind, text) {
  notice.innerHTML = `<div class="notice ${kind}">${text}</div>`;
}

function buildCsv() {
  const leads = getLeads();
  const headers = ["Lead ID","Created At","Status","Name","Phone","Email","Address","Service","Preferred Date","Preferred Time","Details"];
  const rows = leads.map(lead => [
    lead.leadId, lead.createdAt, lead.status, lead.name, lead.phone, lead.email,
    lead.address, lead.service, lead.date, lead.time, (lead.details || "").replace(/\n/g, " ")
  ]);
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"\${String(cell || "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "access-point-lawn-care-leads.csv";
  a.click();
  URL.revokeObjectURL(url);
}

exportCsvBtn.addEventListener("click", buildCsv);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  notice.innerHTML = "";
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  const fd = new FormData(form);
  const today = new Date();
  const newLead = {
    leadId: `APL-${Date.now().toString().slice(-6)}`,
    createdAt: today.toLocaleString(),
    status: "New Lead",
    name: fd.get("name") || "",
    phone: fd.get("phone") || "",
    email: fd.get("email") || "",
    address: fd.get("address") || "",
    service: fd.get("service") || "",
    date: fd.get("date") || "",
    time: fd.get("time") || "",
    details: fd.get("details") || ""
  };

  const leads = [newLead, ...getLeads()];
  setLeads(leads);
  renderLeads();

  try {
    const res = await fetch(LIVE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newLead)
    });
    if (!res.ok) throw new Error("Live submission failed");
    showNotice("ok", `Lead ${newLead.leadId} was captured and sent to your live Google Sheet.`);
    form.reset();
    const dateInput = document.querySelector('input[name="date"]');
    dateInput.value = new Date().toISOString().slice(0,10);
  } catch (err) {
    showNotice("warn", `Lead ${newLead.leadId} was saved on the page, but Google Sheets did not accept the submission.`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Booking Request";
  }
});

(function init() {
  const dateInput = document.querySelector('input[name="date"]');
  dateInput.min = new Date().toISOString().slice(0,10);
  dateInput.value = new Date().toISOString().slice(0,10);
  renderLeads();
})();
