const LIVE_WEBHOOK_URL = (window.APL_CONFIG && window.APL_CONFIG.LEAD_ENDPOINT) || "";
const STORAGE_KEY = "access-point-lawn-care-leads";

const form = document.getElementById("bookingForm");
const notice = document.getElementById("formNotice");
const submitBtn = document.getElementById("submitBtn");
const estimateTotal = document.getElementById("estimateTotal");
const estimateBreakdown = document.getElementById("estimateBreakdown");
const estimateTotalField = document.getElementById("estimateTotalField");
const estimateBreakdownField = document.getElementById("estimateBreakdownField");
const yardSize = document.getElementById("yardSize");
const serviceType = document.getElementById("serviceType");
const frequency = document.getElementById("frequency");
const preferredDate = document.getElementById("preferredDate");

const yardBaseMap = {
  small: 40,
  medium: 60,
  large: 80,
  xlarge: 120
};

const serviceAddOnMap = {
  "Lawn Mowing": 0,
  "Lawn Mowing + Edging": 20,
  "Yard Cleanup": 110,
  "Property Refresh": 60
};

const frequencyDiscountMap = {
  "one-time": 0,
  weekly: 10,
  biweekly: 5,
  monthly: 0
};

function getLeads() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setLeads(leads) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function calculateEstimate() {
  const base = yardBaseMap[yardSize.value] || 40;
  const addOn = serviceAddOnMap[serviceType.value] || 0;
  const discount = frequencyDiscountMap[frequency.value] || 0;
  const subtotal = base + addOn;
  const total = Math.max(40, Math.round(subtotal * (1 - discount / 100)));
  const breakdownText = `${capitalize(yardSize.value)} yard ${serviceType.value.toLowerCase()}${discount ? ` with ${discount}% recurring-service savings` : ""}. Final quote may vary based on property condition.`;

  estimateTotal.textContent = `${formatCurrency(total)}+`;
  estimateBreakdown.textContent = breakdownText;
  estimateTotalField.value = `${formatCurrency(total)}+`;
  estimateBreakdownField.value = breakdownText;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function showNotice(kind, text) {
  notice.innerHTML = `<div class="notice ${kind}">${text}</div>`;
}

function buildLeadPayload(formData) {
  const timestamp = new Date();
  const message = formData.get("message") || "";
  const breakdown = estimateBreakdownField.value || "";

  return {
    leadId: `APL-${Date.now().toString().slice(-6)}`,
    createdAt: timestamp.toLocaleString(),
    timestampISO: timestamp.toISOString(),
    status: "New Lead",
    name: formData.get("name") || "",
    phone: formData.get("phone") || "",
    email: formData.get("email") || "",
    address: formData.get("address") || "",
    service: formData.get("service") || "",
    yardSize: formData.get("yardSize") || "",
    frequency: formData.get("frequency") || "",
    date: formData.get("date") || "",
    time: formData.get("time") || "",
    estimateTotal: formData.get("estimateTotal") || "",
    estimateBreakdown: breakdown,
    details: [
      `Yard Size: ${formData.get("yardSize") || ""}`,
      `Frequency: ${formData.get("frequency") || ""}`,
      `Estimate: ${formData.get("estimateTotal") || ""}`,
      breakdown,
      message ? `Message: ${message}` : ""
    ].filter(Boolean).join(" | "),
    message
  };
}

async function submitLead(lead) {
  if (!LIVE_WEBHOOK_URL) {
    return { sent: false, reason: "missing-endpoint" };
  }

  const response = await fetch(LIVE_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead)
  });

  if (!response.ok) {
    throw new Error("Lead submission failed");
  }

  return { sent: true };
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  notice.innerHTML = "";
  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";

  const formData = new FormData(form);
  const lead = buildLeadPayload(formData);
  const leads = [lead, ...getLeads()].slice(0, 25);
  setLeads(leads);

  try {
    const result = await submitLead(lead);

    if (result.sent) {
      showNotice("ok", `Quote request ${lead.leadId} was sent successfully.`);
    } else {
      showNotice("warn", `Quote request ${lead.leadId} was saved in this browser, but config.js still needs your live Google Apps Script URL.`);
    }

    form.reset();
    preferredDate.value = new Date().toISOString().slice(0, 10);
    calculateEstimate();
  } catch (error) {
    showNotice("warn", `Quote request ${lead.leadId} was saved in this browser, but the live webhook did not accept the submission.`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Request Free Quote";
  }
});

[yardSize, serviceType, frequency].forEach((element) => {
  element.addEventListener("change", calculateEstimate);
});

(function init() {
  const today = new Date().toISOString().slice(0, 10);
  preferredDate.min = today;
  preferredDate.value = today;
  calculateEstimate();
})();
