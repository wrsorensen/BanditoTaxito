/**
 * v0.2.1 — Logbook viewer API
 * Google Apps Script backend for a simple consultant work tracker.
 * Source of truth: Google Sheets.
 */

const APP = {
  version: 'v0.2.1',
  spreadsheetName: 'Bandito Taxito Backend',
  receiptFolderName: 'Bandito Taxito Receipt Uploads',
  photoFolderName: 'Bandito Taxito Photo Uploads',
  tabs: {
    settings: 'Settings',
    clients: 'Clients',
    workLog: 'Work Log',
    mileage: 'Mileage',
    receipts: 'Receipts',
    notes: 'Photos Notes',
    tax: 'Tax Helper',
    audit: 'Audit Log'
  }
};

const HEADERS = {
  Settings: ['Setting', 'Value', 'Notes'],
  Clients: ['Client Name', 'Default Site', 'Contact', 'Notes', 'Active'],
  'Work Log': [
    'Timestamp', 'Entry ID', 'Client', 'Project/Site', 'Work Date',
    'Start Time', 'End Time', 'Hours', 'Status', 'Work Performed', 'Notes',
    'Start Odometer', 'End Odometer', 'Miles', 'Ready For Report',
    'Photo URLs', 'Receipt URLs', 'Created By', 'Sync Source',
    'Pay Type', 'Work Span', 'Work Start Date', 'Work End Date',
    'Billable Days', 'Rate', 'Estimated Pay'
  ],
  Mileage: [
    'Timestamp', 'Mileage ID', 'Client', 'Project/Site', 'Trip Date',
    'Start Odometer', 'End Odometer', 'Miles', 'From', 'To', 'Purpose',
    'Reimbursed?', 'Notes', 'Sync Source'
  ],
  Receipts: [
    'Timestamp', 'Receipt ID', 'Client', 'Project/Site', 'Receipt Date',
    'Vendor', 'Amount', 'Category', 'Reimbursable?', 'Paid By', 'Notes',
    'File URL', 'AI Status', 'Sync Source'
  ],
  'Photos Notes': [
    'Timestamp', 'Note ID', 'Client', 'Project/Site', 'Note Date',
    'Type', 'Note', 'File URL', 'Status', 'Sync Source'
  ],
  'Tax Helper': [
    'Timestamp', 'Tax Event ID', 'Event Date', 'Type', 'Amount', 'Notes', 'Status'
  ],
  'Audit Log': ['Timestamp', 'Action', 'Details']
};

function doGet(e) {
  const params = (e && e.parameter) || {};

  if (params.action) {
    return handleApiGet_(params);
  }

  setupSpreadsheet_();
  const html = `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Bandito Taxito API</title>
        <style>
          body{margin:0;min-height:100vh;display:grid;place-items:center;background:#11100d;color:#f4ead8;font-family:Arial,Helvetica,sans-serif;padding:20px;}
          main{max-width:520px;background:#1f1711;border:1px solid #c59a45;border-radius:22px;padding:22px;box-shadow:0 20px 50px rgba(0,0,0,.35);}
          h1{margin:0 0 8px;font-size:28px;}
          p{margin:8px 0;color:#d9c39a;line-height:1.45;}
          code{display:block;background:#0b0a08;border:1px solid #3c2d1e;border-radius:12px;padding:10px;color:#fff7e6;overflow:auto;}
          a{color:#f5c15f;font-weight:800;}
        </style>
      </head>
      <body>
        <main>
          <h1>Bandito Taxito API Online</h1>
          <p>This Google Apps Script deployment is the backend only.</p>
          <p>Use the GitHub frontend:</p>
          <p><a href="https://wrsorensen.github.io/BanditoTaxito/" target="_top">https://wrsorensen.github.io/BanditoTaxito/</a></p>
          <p>Health check:</p>
          <code>?action=ping&callback=demo</code>
          <p>Version: ${APP.version}</p>
        </main>
      </body>
    </html>`;

  return HtmlService.createHtmlOutput(html)
    .setTitle('Bandito Taxito API')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doPost(e) {
  try {
    const request = parseApiRequest_(e);
    const result = handleApiAction_(request.action, request.payload, request);
    return jsonOutput_(result);
  } catch (err) {
    return jsonOutput_({ ok: false, message: err.message || String(err) });
  }
}

function handleApiGet_(params) {
  try {
    const payload = params.payload ? parseJsonSafe_(params.payload, {}) : {};
    const result = handleApiAction_(params.action, payload, { method: 'GET', params: params });
    return jsonOrJsonpOutput_(result, params.callback);
  } catch (err) {
    return jsonOrJsonpOutput_({ ok: false, message: err.message || String(err) }, params.callback);
  }
}

function handleApiAction_(action, payload, request) {
  action = clean_(action || '');
  payload = payload || {};

  if (action === 'ping') {
    setupSpreadsheet_();
    return { ok: true, app: 'Bandito Taxito', version: APP.version, timestamp: new Date().toISOString() };
  }

  if (action === 'initialData' || action === 'getInitialData') {
    const data = getInitialData();
    data.ok = true;
    return data;
  }

  if (action === 'weeklyReview' || action === 'getWeeklyReview') {
    return { ok: true, weeklyReview: getWeeklyReview() };
  }

  if (action === 'logbook' || action === 'getLogbook') {
    const limit = payload.limit || (request && request.params && request.params.limit) || 25;
    return { ok: true, logbook: getLogbook(limit) };
  }

  if (action === 'taxSummary' || action === 'getTaxSummary') {
    return { ok: true, taxSummary: getTaxSummary() };
  }

  if (action === 'save') {
    return saveByType_(payload.type || (request && request.type), payload.payload || payload);
  }

  if (action === 'saveWorkLog') return saveWorkLog(payload);
  if (action === 'saveMileage') return saveMileage(payload);
  if (action === 'saveReceipt') return saveReceipt(payload);
  if (action === 'saveNotePhoto') return saveNotePhoto(payload);
  if (action === 'saveTaxNote') return saveTaxNote(payload);

  if (action === 'syncQueuedItems') {
    const items = Array.isArray(payload) ? payload : (payload.items || []);
    return syncQueuedItems(items);
  }

  return { ok: false, message: 'Unknown API action: ' + action };
}

function saveByType_(type, payload) {
  type = clean_(type);
  payload = payload || {};
  payload.syncSource = payload.syncSource || 'GitHub frontend';

  if (type === 'workLog') return saveWorkLog(payload);
  if (type === 'mileage') return saveMileage(payload);
  if (type === 'receipt') return saveReceipt(payload);
  if (type === 'notePhoto') return saveNotePhoto(payload);
  if (type === 'taxNote') return saveTaxNote(payload);

  return { ok: false, message: 'Unknown save type: ' + type };
}

function parseApiRequest_(e) {
  const params = (e && e.parameter) || {};
  let action = params.action || '';
  let type = params.type || '';
  let payload = params.payload ? parseJsonSafe_(params.payload, {}) : {};

  if (e && e.postData && e.postData.contents) {
    const contents = e.postData.contents;
    const parsed = parseJsonSafe_(contents, null);
    if (parsed && typeof parsed === 'object') {
      action = parsed.action || action;
      type = parsed.type || type;
      payload = parsed.payload !== undefined ? parsed.payload : payload;
      if (parsed.items && !payload.items) payload = { items: parsed.items };
    }
  }

  return { method: 'POST', action: action, type: type, payload: payload, params: params };
}

function parseJsonSafe_(text, fallback) {
  try {
    return JSON.parse(String(text || ''));
  } catch (err) {
    return fallback;
  }
}

function jsonOutput_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data || {}))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonOrJsonpOutput_(data, callback) {
  callback = sanitizeCallback_(callback);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(data || {}) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return jsonOutput_(data);
}

function sanitizeCallback_(callback) {
  callback = clean_(callback);
  return /^[a-zA-Z_$][0-9a-zA-Z_$]*(\.[a-zA-Z_$][0-9a-zA-Z_$]*)*$/.test(callback) ? callback : '';
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getInitialData() {
  setupSpreadsheet_();
  return {
    version: APP.version,
    timestamp: new Date().toISOString(),
    clients: getClients_(),
    settings: getSettings_(),
    weeklyReview: getWeeklyReview()
  };
}

function saveWorkLog(payload) {
  setupSpreadsheet_();
  payload = payload || {};

  const entryId = payload.entryId || makeId_('WORK');
  const startOdo = toNumber_(payload.startOdometer);
  const endOdo = toNumber_(payload.endOdometer);
  const miles = payload.miles !== undefined && payload.miles !== ''
    ? toNumber_(payload.miles)
    : calculateMiles_(startOdo, endOdo);

  const hours = calculateHours_(payload.startTime, payload.endTime);
  const payType = clean_(payload.payType || 'Day rate');
  const billableDays = payload.billableDays !== undefined && payload.billableDays !== ''
    ? toNumber_(payload.billableDays)
    : calculateBillableDays_(payload.workStartDate || payload.workDate, payload.workEndDate || payload.workDate);
  const rate = toNumber_(payload.rate || payload.dayRate);
  const estimatedPay = calculateEstimatedPay_(payType, billableDays, rate, hours);

  const row = [
    now_(),
    entryId,
    clean_(payload.client),
    clean_(payload.site),
    clean_(payload.workDate),
    clean_(payload.startTime),
    clean_(payload.endTime),
    hours,
    clean_(payload.status || 'Complete'),
    clean_(payload.workPerformed),
    clean_(payload.notes),
    startOdo,
    endOdo,
    miles,
    clean_(payload.readyForReport || 'No'),
    clean_(payload.photoUrls),
    clean_(payload.receiptUrls),
    clean_(payload.createdBy),
    clean_(payload.syncSource || 'Online'),
    payType,
    clean_(payload.workSpan || 'Single-day'),
    clean_(payload.workStartDate || payload.workDate),
    clean_(payload.workEndDate || payload.workDate),
    billableDays,
    rate,
    estimatedPay
  ];

  appendRow_(APP.tabs.workLog, row);
  audit_('SAVE_WORK_LOG', entryId);
  return { ok: true, id: entryId, message: 'Work log saved.' };
}

function saveMileage(payload) {
  setupSpreadsheet_();
  payload = payload || {};

  const mileageId = payload.mileageId || makeId_('MILE');
  const startOdo = toNumber_(payload.startOdometer);
  const endOdo = toNumber_(payload.endOdometer);
  const miles = payload.miles !== undefined && payload.miles !== ''
    ? toNumber_(payload.miles)
    : calculateMiles_(startOdo, endOdo);

  const row = [
    now_(),
    mileageId,
    clean_(payload.client),
    clean_(payload.site),
    clean_(payload.tripDate),
    startOdo,
    endOdo,
    miles,
    clean_(payload.from),
    clean_(payload.to),
    clean_(payload.purpose || 'Business/job travel'),
    clean_(payload.reimbursed || 'Unknown'),
    clean_(payload.notes),
    clean_(payload.syncSource || 'Online')
  ];

  appendRow_(APP.tabs.mileage, row);
  audit_('SAVE_MILEAGE', mileageId);
  return { ok: true, id: mileageId, message: 'Mileage saved.' };
}

function saveReceipt(payload) {
  setupSpreadsheet_();
  payload = payload || {};

  const receiptId = payload.receiptId || makeId_('RCPT');
  let fileUrl = clean_(payload.fileUrl);

  if (payload.file && payload.file.base64Data) {
    const file = saveBase64File_(payload.file, APP.receiptFolderName, receiptId);
    fileUrl = file.getUrl();
  }

  const row = [
    now_(),
    receiptId,
    clean_(payload.client),
    clean_(payload.site),
    clean_(payload.receiptDate),
    clean_(payload.vendor),
    toNumber_(payload.amount),
    clean_(payload.category),
    clean_(payload.reimbursable || 'Unknown'),
    clean_(payload.paidBy),
    clean_(payload.notes),
    fileUrl,
    clean_(payload.aiStatus || 'Manual entry'),
    clean_(payload.syncSource || 'Online')
  ];

  appendRow_(APP.tabs.receipts, row);
  audit_('SAVE_RECEIPT', receiptId);
  return { ok: true, id: receiptId, fileUrl: fileUrl, message: 'Receipt saved.' };
}

function saveNotePhoto(payload) {
  setupSpreadsheet_();
  payload = payload || {};

  const noteId = payload.noteId || makeId_('NOTE');
  let fileUrl = clean_(payload.fileUrl);

  if (payload.file && payload.file.base64Data) {
    const file = saveBase64File_(payload.file, APP.photoFolderName, noteId);
    fileUrl = file.getUrl();
  }

  const row = [
    now_(),
    noteId,
    clean_(payload.client),
    clean_(payload.site),
    clean_(payload.noteDate),
    clean_(payload.type || 'Note'),
    clean_(payload.note),
    fileUrl,
    clean_(payload.status || 'Open'),
    clean_(payload.syncSource || 'Online')
  ];

  appendRow_(APP.tabs.notes, row);
  audit_('SAVE_NOTE_PHOTO', noteId);
  return { ok: true, id: noteId, fileUrl: fileUrl, message: 'Note/photo saved.' };
}

function saveTaxNote(payload) {
  setupSpreadsheet_();
  payload = payload || {};

  const taxEventId = payload.taxEventId || makeId_('TAX');
  const row = [
    now_(),
    taxEventId,
    clean_(payload.eventDate),
    clean_(payload.type || 'Tax Review'),
    toNumber_(payload.amount),
    clean_(payload.notes),
    clean_(payload.status || 'Open')
  ];

  appendRow_(APP.tabs.tax, row);
  audit_('SAVE_TAX_NOTE', taxEventId);
  return { ok: true, id: taxEventId, message: 'Tax note saved.' };
}

function syncQueuedItems(items) {
  setupSpreadsheet_();
  items = Array.isArray(items) ? items : [];

  const results = [];
  items.forEach(function(item) {
    try {
      const type = item.type;
      const payload = item.payload || {};
      payload.syncSource = 'Offline queue';

      if (type === 'workLog') results.push(saveWorkLog(payload));
      else if (type === 'mileage') results.push(saveMileage(payload));
      else if (type === 'receipt') results.push(saveReceipt(payload));
      else if (type === 'notePhoto') results.push(saveNotePhoto(payload));
      else if (type === 'taxNote') results.push(saveTaxNote(payload));
      else results.push({ ok: false, message: 'Unknown queue item type: ' + type });
    } catch (err) {
      results.push({ ok: false, message: err.message });
    }
  });

  audit_('SYNC_QUEUE', 'Items: ' + items.length);
  return { ok: true, results: results };
}

function getWeeklyReview() {
  setupSpreadsheet_();

  const ss = getSs_();
  const work = readRows_(ss.getSheetByName(APP.tabs.workLog));
  const receipts = readRows_(ss.getSheetByName(APP.tabs.receipts));
  const mileage = readRows_(ss.getSheetByName(APP.tabs.mileage));

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentWork = work.filter(function(row) {
    return dateInRange_(row['Work Date'] || row.Timestamp, sevenDaysAgo);
  });

  const recentReceipts = receipts.filter(function(row) {
    return dateInRange_(row['Receipt Date'] || row.Timestamp, sevenDaysAgo);
  });

  const recentMileage = mileage.filter(function(row) {
    return dateInRange_(row['Trip Date'] || row.Timestamp, sevenDaysAgo);
  });

  const missingEndTime = recentWork.filter(function(row) { return !row['End Time']; }).length;
  const missingWorkNotes = recentWork.filter(function(row) { return !row['Work Performed'] && !row.Notes; }).length;
  const missingReceiptFile = recentReceipts.filter(function(row) { return !row['File URL']; }).length;
  const missingReceiptAmount = recentReceipts.filter(function(row) { return !row.Amount; }).length;
  const missingMileage = recentMileage.filter(function(row) { return !row.Miles; }).length;

  return {
    workLogs: recentWork.length,
    receipts: recentReceipts.length,
    mileageLogs: recentMileage.length,
    missingEndTime: missingEndTime,
    missingWorkNotes: missingWorkNotes,
    missingReceiptFile: missingReceiptFile,
    missingReceiptAmount: missingReceiptAmount,
    missingMileage: missingMileage,
    openItems: missingEndTime + missingWorkNotes + missingReceiptFile + missingReceiptAmount + missingMileage
  };
}


function getLogbook(limit) {
  setupSpreadsheet_();
  limit = Math.max(1, Math.min(50, Number(limit) || 25));

  return {
    work: getRecentRows_(APP.tabs.workLog, limit, mapWorkLogForApi_),
    mileage: getRecentRows_(APP.tabs.mileage, limit, mapMileageForApi_),
    receipts: getRecentRows_(APP.tabs.receipts, limit, mapReceiptForApi_),
    notes: getRecentRows_(APP.tabs.notes, limit, mapNoteForApi_)
  };
}

function getRecentRows_(tabName, limit, mapper) {
  const sheet = getSs_().getSheetByName(tabName);
  return readRows_(sheet)
    .filter(rowHasContent_)
    .reverse()
    .slice(0, limit)
    .map(mapper);
}

function rowHasContent_(row) {
  return Object.keys(row || {}).some(function(key) {
    const value = row[key];
    return value !== null && value !== undefined && String(value).trim() !== '';
  });
}

function mapWorkLogForApi_(row) {
  return {
    type: 'work',
    id: apiValue_(row['Entry ID']),
    timestamp: apiValue_(row.Timestamp),
    title: apiValue_(row['Project/Site'] || row.Client || 'Work Log'),
    client: apiValue_(row.Client),
    site: apiValue_(row['Project/Site']),
    date: apiValue_(row['Work Date']),
    startTime: apiValue_(row['Start Time']),
    endTime: apiValue_(row['End Time']),
    hours: apiValue_(row.Hours),
    status: apiValue_(row.Status),
    workPerformed: apiValue_(row['Work Performed']),
    notes: apiValue_(row.Notes),
    miles: apiValue_(row.Miles),
    billableDays: apiValue_(row['Billable Days']),
    rate: apiValue_(row.Rate),
    estimatedPay: apiValue_(row['Estimated Pay'])
  };
}

function mapMileageForApi_(row) {
  return {
    type: 'mileage',
    id: apiValue_(row['Mileage ID']),
    timestamp: apiValue_(row.Timestamp),
    title: apiValue_((row.From && row.To) ? row.From + ' → ' + row.To : (row['Project/Site'] || 'Mileage')),
    client: apiValue_(row.Client),
    site: apiValue_(row['Project/Site']),
    date: apiValue_(row['Trip Date']),
    miles: apiValue_(row.Miles),
    from: apiValue_(row.From),
    to: apiValue_(row.To),
    purpose: apiValue_(row.Purpose),
    reimbursed: apiValue_(row['Reimbursed?']),
    notes: apiValue_(row.Notes)
  };
}

function mapReceiptForApi_(row) {
  return {
    type: 'receipt',
    id: apiValue_(row['Receipt ID']),
    timestamp: apiValue_(row.Timestamp),
    title: apiValue_(row.Vendor || row.Category || 'Receipt'),
    client: apiValue_(row.Client),
    site: apiValue_(row['Project/Site']),
    date: apiValue_(row['Receipt Date']),
    vendor: apiValue_(row.Vendor),
    amount: apiValue_(row.Amount),
    category: apiValue_(row.Category),
    reimbursable: apiValue_(row['Reimbursable?']),
    paidBy: apiValue_(row['Paid By']),
    notes: apiValue_(row.Notes),
    fileUrl: apiValue_(row['File URL']),
    aiStatus: apiValue_(row['AI Status'])
  };
}

function mapNoteForApi_(row) {
  return {
    type: 'note',
    id: apiValue_(row['Note ID']),
    timestamp: apiValue_(row.Timestamp),
    title: apiValue_(row.Type || 'Note / Photo'),
    client: apiValue_(row.Client),
    site: apiValue_(row['Project/Site']),
    date: apiValue_(row['Note Date']),
    noteType: apiValue_(row.Type),
    note: apiValue_(row.Note),
    status: apiValue_(row.Status),
    fileUrl: apiValue_(row['File URL'])
  };
}

function apiValue_(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  }
  return String(value).trim();
}

function getTaxSummary() {
  setupSpreadsheet_();
  const settings = getSettings_();
  return {
    reservePercent: settings.taxReservePercent || '25',
    reminderEnabled: settings.quarterlyReminderEnabled || 'TRUE',
    nextReviewDate: settings.nextTaxReviewDate || '',
    note: 'Reminder only. Confirm real tax requirements with CPA/tax preparer.'
  };
}

function setupSpreadsheet_() {
  const ss = getSs_();
  Object.keys(APP.tabs).forEach(function(key) {
    const tabName = APP.tabs[key];
    const header = HEADERS[tabName];
    if (!header) return;
    ensureSheet_(ss, tabName, header);
  });
  seedSettings_();
}

function getSs_() {
  const props = PropertiesService.getScriptProperties();
  const savedId = props.getProperty('SPREADSHEET_ID');

  if (savedId) {
    return SpreadsheetApp.openById(savedId);
  }

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    props.setProperty('SPREADSHEET_ID', active.getId());
    return active;
  }

  const ss = SpreadsheetApp.create(APP.spreadsheetName);
  props.setProperty('SPREADSHEET_ID', ss.getId());
  return ss;
}

function ensureSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);

  const existingLastColumn = Math.max(sheet.getLastColumn(), headers.length);
  const firstRow = sheet.getRange(1, 1, 1, existingLastColumn).getValues()[0];
  const hasHeaders = firstRow.some(function(value) { return value !== ''; });

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
    return;
  }

  // Safe schema upgrade: append missing headers at the end without rewriting old columns.
  const existingHeaders = firstRow.map(function(value) { return clean_(value); }).filter(Boolean);
  const missingHeaders = headers.filter(function(header) {
    return existingHeaders.indexOf(header) === -1;
  });

  if (missingHeaders.length) {
    sheet.getRange(1, existingHeaders.length + 1, 1, missingHeaders.length).setValues([missingHeaders]);
    sheet.autoResizeColumns(1, existingHeaders.length + missingHeaders.length);
  }
}

function seedSettings_() {
  const sheet = getSs_().getSheetByName(APP.tabs.settings);
  const existing = readRows_(sheet).map(function(row) { return row.Setting; });

  const defaults = [
    ['appName', 'Bandito Taxito', 'Visible app name.'],
    ['defaultClientCompany', '', 'Optional default company/client to reduce phone typing.'],
    ['defaultPayType', 'Day rate', 'Options: Day rate, Hourly, No pay tracking, Unknown.'],
    ['defaultRate', '', 'Optional day/hour rate for estimated pay only.'],
    ['taxReservePercent', '25', 'Simple reminder percent only. Not tax advice.'],
    ['quarterlyReminderEnabled', 'TRUE', 'Used by the Tax Helper screen.'],
    ['nextTaxReviewDate', '', 'User/CPA should confirm exact date.'],
    ['defaultUser', '', 'Optional.'],
    ['defaultMileageRate', '', 'Optional. Confirm current rate before using.']
  ];

  defaults.forEach(function(row) {
    if (existing.indexOf(row[0]) === -1) sheet.appendRow(row);
  });
}

function getSettings_() {
  const rows = readRows_(getSs_().getSheetByName(APP.tabs.settings));
  const settings = {};
  rows.forEach(function(row) {
    if (row.Setting) settings[row.Setting] = row.Value;
  });
  return settings;
}

function getClients_() {
  const rows = readRows_(getSs_().getSheetByName(APP.tabs.clients));
  return rows
    .filter(function(row) { return String(row.Active || 'TRUE').toUpperCase() !== 'FALSE'; })
    .map(function(row) {
      return {
        name: row['Client Name'] || '',
        defaultSite: row['Default Site'] || '',
        contact: row.Contact || '',
        notes: row.Notes || ''
      };
    })
    .filter(function(row) { return row.name; });
}

function appendRow_(tabName, row) {
  const sheet = getSs_().getSheetByName(tabName);
  sheet.appendRow(row);
}

function readRows_(sheet) {
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0];
  return values.slice(1).map(function(row) {
    const obj = {};
    headers.forEach(function(header, index) {
      obj[header] = row[index];
    });
    return obj;
  });
}

function saveBase64File_(filePayload, folderName, idPrefix) {
  const folder = getOrCreateFolder_(folderName);
  const safeName = cleanFileName_(filePayload.name || idPrefix || 'upload');
  const contentType = filePayload.mimeType || 'application/octet-stream';
  const base64 = String(filePayload.base64Data).replace(/^data:[^,]+,/, '');
  const bytes = Utilities.base64Decode(base64);
  const blob = Utilities.newBlob(bytes, contentType, idPrefix + '_' + safeName);
  return folder.createFile(blob);
}

function getOrCreateFolder_(name) {
  const folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(name);
}

function audit_(action, details) {
  const sheet = getSs_().getSheetByName(APP.tabs.audit);
  sheet.appendRow([now_(), action, details || '']);
}

function makeId_(prefix) {
  return prefix + '-' + Utilities.getUuid().slice(0, 8).toUpperCase();
}

function now_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

function clean_(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function toNumber_(value) {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(String(value).replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? '' : num;
}

function calculateMiles_(startOdo, endOdo) {
  if (startOdo === '' || endOdo === '') return '';
  const miles = Number(endOdo) - Number(startOdo);
  return miles >= 0 ? miles : '';
}

function calculateHours_(startTime, endTime) {
  if (!startTime || !endTime) return '';
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
  const hours = (end.getTime() - start.getTime()) / 36e5;
  return hours >= 0 ? Math.round(hours * 100) / 100 : '';
}

function calculateBillableDays_(startDate, endDate) {
  if (!startDate && !endDate) return '';
  const start = startDate ? new Date(startDate) : new Date(endDate);
  const end = endDate ? new Date(endDate) : new Date(startDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
  const days = Math.floor((stripTime_(end).getTime() - stripTime_(start).getTime()) / 86400000) + 1;
  return days > 0 ? days : '';
}

function calculateEstimatedPay_(payType, billableDays, rate, hours) {
  if (rate === '' || rate === null || rate === undefined) return '';
  const type = String(payType || '').toLowerCase();
  let estimate = '';

  if (type.indexOf('day') !== -1 && billableDays !== '') estimate = Number(billableDays) * Number(rate);
  if (type.indexOf('hour') !== -1 && hours !== '') estimate = Number(hours) * Number(rate);

  return estimate === '' ? '' : Math.round(estimate * 100) / 100;
}

function stripTime_(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateInRange_(value, minDate) {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return false;
  return date >= minDate;
}

function cleanFileName_(name) {
  return String(name).replace(/[^a-zA-Z0-9._-]/g, '_');
}
