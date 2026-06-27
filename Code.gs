/**
 * v0.1.2 — Bandito Taxito cosmetic polish
 * Google Apps Script backend for a simple consultant work tracker.
 * Source of truth: Google Sheets.
 */

const APP = {
  version: 'v0.1.2',
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

function doGet() {
  setupSpreadsheet_();
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Bandito Taxito')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
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
