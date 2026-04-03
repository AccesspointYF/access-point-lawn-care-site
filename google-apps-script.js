function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents || "{}");

    sheet.appendRow([
      data.leadId || "",
      data.createdAt || "",
      data.timestampISO || "",
      data.status || "New Lead",
      data.name || "",
      data.phone || "",
      data.email || "",
      data.address || "",
      data.service || "",
      data.yardSize || "",
      data.frequency || "",
      data.date || "",
      data.time || "",
      data.estimateTotal || "",
      data.estimateBreakdown || "",
      data.message || "",
      data.details || ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
