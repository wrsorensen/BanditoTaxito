/**
 * v0.3.12 - Feedback email alerts
 * Google Apps Script backend for a simple consultant work tracker.
 * Source of truth: Google Sheets.
 */

const APP = {
  version: 'v0.3.12',
  spreadsheetName: 'Bandito Taxito Backend',
  receiptFolderName: 'Bandito Taxito Receipt Uploads',
  photoFolderName: 'Bandito Taxito Photo Uploads',
  feedbackEmail: 'wrsorensen@gmail.com',
  tabs: {
    settings: 'Settings',
    clients: 'Clients',
    workLog: 'Work Log',
    mileage: 'Mileage',
    receipts: 'Receipts',
    notes: 'Photos Notes',
    tax: 'Tax Helper',
    feedback: 'Feedback',
    audit: 'Audit Log'
  }
};

const RECEIPT_AI = {
  defaultModel: 'gemini-3.6-flash',
  cachePrefix: 'BT_RECEIPT_AI_',
  cacheSeconds: 300,
  maxImageBytes: 6 * 1024 * 1024,
  maxImageCount: 4,
  categories: ['Materials', 'Fuel', 'Tools', 'Meals', 'Parking/Tolls', 'Supplies', 'Other'],
  reimbursableValues: ['Unknown', 'Yes', 'No'],
  paymentMethodValues: ['Unknown', 'Card', 'Cash', 'Check', 'Bank / ACH', 'Other'],
  missingFields: ['vendor', 'receiptDate', 'invoiceNumber', 'totalAmount', 'subtotal', 'salesTax', 'paymentMethod', 'cardLast4', 'category', 'client', 'site', 'notes', 'reimbursable']
};

const RECORD_META_HEADERS = ['Deleted', 'Deleted At', 'Delete Reason', 'Updated At', 'Updated Source'];

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
  ].concat(RECORD_META_HEADERS),
  Mileage: [
    'Timestamp', 'Mileage ID', 'Client', 'Project/Site', 'Trip Date',
    'Start Odometer', 'End Odometer', 'Miles', 'From', 'To', 'Purpose',
    'Reimbursed?', 'Notes', 'Sync Source'
  ].concat(RECORD_META_HEADERS),
  Receipts: [
    'Timestamp', 'Receipt ID', 'Client', 'Project/Site', 'Receipt Date',
    'Vendor', 'Amount', 'Category', 'Reimbursable?', 'Paid By', 'Notes',
    'File URL', 'AI Status', 'Sync Source'
  ].concat(RECORD_META_HEADERS).concat([
    'Receipt / Invoice Number', 'Subtotal', 'Sales Tax', 'Payment Method', 'Card Last 4'
  ]),
  'Photos Notes': [
    'Timestamp', 'Note ID', 'Client', 'Project/Site', 'Note Date',
    'Type', 'Note', 'File URL', 'Status', 'Sync Source'
  ].concat(RECORD_META_HEADERS),
  'Tax Helper': [
    'Timestamp', 'Tax Event ID', 'Event Date', 'Type', 'Amount', 'Notes', 'Status'
  ].concat(RECORD_META_HEADERS),
  Feedback: [
    'Timestamp', 'Feedback ID', 'Type', 'Message', 'Contact', 'App Version',
    'Page URL', 'User Agent', 'Sync Source', 'Status'
  ].concat(RECORD_META_HEADERS),
  'Audit Log': ['Timestamp', 'Action', 'Details']
};

const LOGBOOK_ENTRY_TYPES = {
  work: {
    tabName: APP.tabs.workLog,
    idHeader: 'Entry ID',
    fields: {
      client: 'Client',
      site: 'Project/Site',
      date: 'Work Date',
      notes: 'Notes',
      status: 'Status',
      workPerformed: 'Work Performed'
    }
  },
  mileage: {
    tabName: APP.tabs.mileage,
    idHeader: 'Mileage ID',
    fields: {
      client: 'Client',
      site: 'Project/Site',
      date: 'Trip Date',
      notes: 'Notes',
      from: 'From',
      to: 'To',
      purpose: 'Purpose'
    }
  },
  receipt: {
    tabName: APP.tabs.receipts,
    idHeader: 'Receipt ID',
    fields: {
      client: 'Client',
      site: 'Project/Site',
      date: 'Receipt Date',
      notes: 'Notes',
      vendor: 'Vendor',
      amount: 'Amount',
      category: 'Category'
    },
    numberFields: ['amount']
  },
  note: {
    tabName: APP.tabs.notes,
    idHeader: 'Note ID',
    fields: {
      client: 'Client',
      site: 'Project/Site',
      date: 'Note Date',
      status: 'Status',
      noteType: 'Type',
      note: 'Note'
    }
  },
  tax: {
    tabName: APP.tabs.tax,
    idHeader: 'Tax Event ID',
    fields: {
      date: 'Event Date',
      status: 'Status',
      taxType: 'Type',
      amount: 'Amount',
      notes: 'Notes'
    },
    numberFields: ['amount']
  }
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

  if (action === 'reportData' || action === 'getReportData') {
    return { ok: true, report: getReportData(payload, request) };
  }

  if (action === 'updateLogbookEntry') return updateLogbookEntry(payload);
  if (action === 'softDeleteLogbookEntry') return softDeleteLogbookEntry(payload);
  if (action === 'restoreLogbookEntry') return restoreLogbookEntry(payload);

  if (action === 'analyzeReceipt') return analyzeReceiptDraft(payload);
  if (action === 'getReceiptDraft') return getReceiptDraft(payload, request);

  if (action === 'save') {
    return saveByType_(payload.type || (request && request.type), payload.payload || payload);
  }

  if (action === 'saveWorkLog') return saveWorkLog(payload);
  if (action === 'saveMileage') return saveMileage(payload);
  if (action === 'saveReceipt') return saveReceipt(payload);
  if (action === 'saveNotePhoto') return saveNotePhoto(payload);
  if (action === 'saveTaxNote') return saveTaxNote(payload);
  if (action === 'saveFeedback') return saveFeedback(payload);

  if (action === 'syncQueuedItems') {
    const items = Array.isArray(payload) ? payload : (payload.items || []);
    return syncQueuedItems(items);
  }

  return { ok: false, message: 'Unknown API action: ' + action };
}

function analyzeReceiptDraft(payload) {
  payload = payload || {};
  const requestId = validateReceiptAiRequestId_(payload.requestId);
  const cache = CacheService.getScriptCache();
  const cacheKey = RECEIPT_AI.cachePrefix + requestId;
  cache.put(cacheKey, JSON.stringify({ state: 'pending' }), RECEIPT_AI.cacheSeconds);

  try {
    const draft = callGeminiReceiptDraft_(normalizeReceiptAiFiles_(payload));
    cache.put(cacheKey, JSON.stringify({ state: 'complete', draft: draft }), RECEIPT_AI.cacheSeconds);
    return { ok: true, requestId: requestId, state: 'complete' };
  } catch (err) {
    const message = safeReceiptAiError_(err);
    cache.put(cacheKey, JSON.stringify({ state: 'error', message: message }), RECEIPT_AI.cacheSeconds);
    return { ok: true, requestId: requestId, state: 'error' };
  }
}

function getReceiptDraft(payload, request) {
  payload = payload || {};
  const params = (request && request.params) || {};
  const requestId = validateReceiptAiRequestId_(payload.requestId || params.requestId);
  const cached = CacheService.getScriptCache().get(RECEIPT_AI.cachePrefix + requestId);
  if (!cached) return { ok: true, state: 'pending' };
  const result = parseJsonSafe_(cached, { state: 'pending' });
  result.ok = true;
  return result;
}

function callGeminiReceiptDraft_(filePayloads) {
  const props = PropertiesService.getScriptProperties();
  const apiKey = clean_(props.getProperty('GEMINI_API_KEY'));
  if (!apiKey) throw new Error('CONFIG_MISSING');

  let model = clean_(props.getProperty('GEMINI_RECEIPT_MODEL')) || RECEIPT_AI.defaultModel;
  if (!/^[a-zA-Z0-9._-]+$/.test(model)) model = RECEIPT_AI.defaultModel;

  const preparedFiles = validateReceiptAiFiles_(filePayloads);
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent';
  const prompt = [
    'Read the attached receipt or invoice image(s) and return one JSON object only.',
    'The images may be multiple proofs for one purchase, such as a detailed invoice plus a credit-card receipt.',
    'Treat them as one transaction. Do not double-count totals. Prefer detailed invoice lines for purchase notes and the payment slip for payment/card proof.',
    'Do not use markdown, code fences, commentary, or extra text.',
    'Use exactly these keys: vendor, receiptDate, invoiceNumber, subtotal, salesTax, totalAmount, paymentMethod, cardLast4, category, client, site, notes, reimbursable, confidence, needsCpaReview, cpaReviewReason, missingFields.',
    'vendor: visible vendor, shop, restaurant, or service-provider name, otherwise empty string.',
    'receiptDate: YYYY-MM-DD when visible, otherwise empty string.',
    'invoiceNumber: only an explicitly labeled receipt or invoice number. Do not use authorization, approval, terminal, merchant, or unrelated reference codes.',
    'subtotal: printed subtotal as a number. Do not calculate or infer it when it is not shown.',
    'salesTax: printed sales tax as a number. Do not calculate or infer it when it is not shown.',
    'totalAmount: final charged total as a number, otherwise 0.',
    'paymentMethod: exactly Unknown, Card, Cash, Check, Bank / ACH, or Other. Normalize credit card, debit card, Visa, Mastercard, Amex, and Discover to Card.',
    'cardLast4: exactly four digits only when the last four card digits are visible, otherwise empty string. Never return a full card number.',
    'category: exactly one of Materials, Fuel, Tools, Meals, Parking/Tolls, Supplies, Other.',
    'client and site: empty strings unless clearly printed and identifiable on the receipt.',
    'notes: concise readable purchase summary, maximum 240 characters, with no claim that anything is deductible.',
    'reimbursable: exactly Unknown, Yes, or No. Use Unknown unless the receipt clearly supports another value.',
    'confidence: integer from 0 to 100.',
    'needsCpaReview: boolean.',
    'cpaReviewReason: short reason or empty string.',
    'missingFields: array containing only vendor, receiptDate, invoiceNumber, totalAmount, subtotal, salesTax, paymentMethod, cardLast4, category, client, site, notes, reimbursable.',
    'Do not mark invoiceNumber, subtotal, salesTax, or cardLast4 missing merely because the document does not print them.',
    'Set needsCpaReview true for low confidence, missing essential fields, uncertain category, meals or entertainment, possible mixed personal/business items, fuel or vehicle ambiguity, or equipment that may need capitalization.',
    'Do not include full payment-card numbers or unrelated personal information.',
    'Example shape: {"vendor":"","receiptDate":"","invoiceNumber":"","subtotal":0,"salesTax":0,"totalAmount":0,"paymentMethod":"Unknown","cardLast4":"","category":"Other","client":"","site":"","notes":"","reimbursable":"Unknown","confidence":0,"needsCpaReview":true,"cpaReviewReason":"","missingFields":[]}'
  ].join(' ');

  const parts = preparedFiles.map(function(prepared) {
    return { inlineData: { mimeType: prepared.mimeType, data: prepared.base64 } };
  });
  parts.push({ text: prompt });

  const requestBody = {
    contents: [{
      parts: parts
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1600
    }
  };

  const response = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-goog-api-key': apiKey },
    payload: JSON.stringify(requestBody),
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  const responseText = response.getContentText();
  if (status < 200 || status >= 300) {
    logReceiptAiFailure_('HTTP_' + status, model, responseText);
    throw new Error('GEMINI_HTTP_' + status);
  }

  const body = parseJsonSafe_(responseText, null);
  if (!body) {
    logReceiptAiFailure_('BAD_RESPONSE', model, responseText);
    throw new Error('GEMINI_BAD_RESPONSE');
  }
  if (body.promptFeedback && body.promptFeedback.blockReason) {
    logReceiptAiFailure_('BLOCKED', model, JSON.stringify(body.promptFeedback));
    throw new Error('GEMINI_BLOCKED');
  }

  const responseParts = body.candidates && body.candidates[0] && body.candidates[0].content && body.candidates[0].content.parts;
  const modelText = Array.isArray(responseParts) ? responseParts.filter(function(part) {
    return part && part.thought !== true && typeof part.text === 'string';
  }).map(function(part) {
    return part.text;
  }).join('\n').trim() : '';

  const jsonText = extractReceiptJsonText_(modelText);
  const rawDraft = parseJsonSafe_(jsonText, null);
  if (!rawDraft || typeof rawDraft !== 'object' || Array.isArray(rawDraft)) {
    logReceiptAiFailure_('BAD_JSON', model, modelText);
    throw new Error('GEMINI_BAD_JSON');
  }

  return sanitizeReceiptAiDraft_(rawDraft);
}

function extractReceiptJsonText_(text) {
  text = String(text || '').replace(/^\uFEFF/, '').trim();
  if (!text) return '';

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced && fenced[1]) text = fenced[1].trim();
  if (parseJsonSafe_(text, null)) return text;

  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === '{') {
      if (depth === 0) start = i;
      depth++;
      continue;
    }
    if (char === '}') {
      if (depth > 0) depth--;
      if (depth === 0 && start !== -1) return text.slice(start, i + 1);
    }
  }

  return '';
}

function logReceiptAiFailure_(code, model, details) {
  const safeDetails = String(details || '')
    .replace(/AQ\.[A-Za-z0-9_-]+/g, '[REDACTED_API_KEY]')
    .slice(0, 5000);
  console.error('BT_RECEIPT_AI_ERROR code=' + clean_(code) + ' model=' + clean_(model) + ' details=' + safeDetails);
}

function normalizeReceiptAiFiles_(payload) {
  payload = payload || {};
  let files = Array.isArray(payload.files) ? payload.files : [];
  if (!files.length && payload.file) files = [payload.file];
  files = files.filter(function(filePayload) {
    return filePayload && filePayload.base64Data;
  });
  if (!files.length) throw new Error('IMAGE_MISSING');
  return files.slice(0, RECEIPT_AI.maxImageCount);
}

function validateReceiptAiFiles_(filePayloads) {
  filePayloads = Array.isArray(filePayloads) ? filePayloads : [filePayloads];
  if (!filePayloads.length) throw new Error('IMAGE_MISSING');
  if (filePayloads.length > RECEIPT_AI.maxImageCount) throw new Error('TOO_MANY_IMAGES');
  return filePayloads.map(validateReceiptAiFile_);
}

function validateReceiptAiFile_(filePayload) {
  filePayload = filePayload || {};
  const mimeType = clean_(filePayload.mimeType).toLowerCase();
  const supported = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (supported.indexOf(mimeType) === -1) throw new Error('UNSUPPORTED_IMAGE');

  const base64 = String(filePayload.base64Data || '').replace(/^data:[^,]+,/, '').replace(/\s/g, '');
  if (!base64) throw new Error('IMAGE_MISSING');
  let bytes;
  try {
    bytes = Utilities.base64Decode(base64);
  } catch (err) {
    throw new Error('IMAGE_INVALID');
  }
  if (!bytes.length || bytes.length > RECEIPT_AI.maxImageBytes) throw new Error('IMAGE_TOO_LARGE');
  return { mimeType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType, base64: base64 };
}

function sanitizeReceiptAiDraft_(raw) {
  raw = raw || {};
  const missing = Array.isArray(raw.missingFields) ? raw.missingFields.map(function(value) {
    return clean_(value);
  }).filter(function(value, index, list) {
    return RECEIPT_AI.missingFields.indexOf(value) !== -1 && list.indexOf(value) === index;
  }) : [];

  const vendor = cleanAiText_(raw.vendor, 120);
  let receiptDate = clean_(raw.receiptDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(receiptDate)) receiptDate = '';
  const invoiceNumber = cleanAiText_(raw.invoiceNumber, 80);
  const subtotal = roundReceiptMoney_(raw.subtotal);
  const salesTax = roundReceiptMoney_(raw.salesTax);
  const totalAmount = roundReceiptMoney_(raw.totalAmount);
  let paymentMethod = normalizeReceiptPaymentMethod_(raw.paymentMethod);
  let cardLast4 = String(raw.cardLast4 || '').replace(/\D/g, '');
  cardLast4 = cardLast4.length >= 4 ? cardLast4.slice(-4) : '';
  if (paymentMethod !== 'Card') cardLast4 = '';

  let category = clean_(raw.category);
  if (RECEIPT_AI.categories.indexOf(category) === -1) category = 'Other';
  let reimbursable = clean_(raw.reimbursable);
  if (RECEIPT_AI.reimbursableValues.indexOf(reimbursable) === -1) reimbursable = 'Unknown';
  const confidence = Math.max(0, Math.min(100, Math.round(Number(raw.confidence) || 0)));

  if (!vendor && missing.indexOf('vendor') === -1) missing.push('vendor');
  if (!receiptDate && missing.indexOf('receiptDate') === -1) missing.push('receiptDate');
  if ((totalAmount === '' || Number(totalAmount) <= 0) && missing.indexOf('totalAmount') === -1) missing.push('totalAmount');
  if (paymentMethod === 'Unknown' && missing.indexOf('paymentMethod') === -1) missing.push('paymentMethod');

  let needsCpaReview = raw.needsCpaReview === true || confidence < 75 || category === 'Meals' || category === 'Other';
  if (missing.indexOf('vendor') !== -1 || missing.indexOf('receiptDate') !== -1 || missing.indexOf('totalAmount') !== -1) {
    needsCpaReview = true;
  }
  let cpaReviewReason = cleanAiText_(raw.cpaReviewReason, 280);
  if (needsCpaReview && !cpaReviewReason) {
    cpaReviewReason = missing.length ? 'Missing or uncertain receipt fields: ' + missing.join(', ') + '.' : 'Category or tax treatment is uncertain.';
  }
  if (!needsCpaReview) cpaReviewReason = '';

  return {
    vendor: vendor,
    receiptDate: receiptDate,
    invoiceNumber: invoiceNumber,
    subtotal: subtotal === '' ? 0 : subtotal,
    salesTax: salesTax === '' ? 0 : salesTax,
    totalAmount: totalAmount === '' ? 0 : totalAmount,
    paymentMethod: paymentMethod,
    cardLast4: cardLast4,
    category: category,
    client: cleanAiText_(raw.client, 120),
    site: cleanAiText_(raw.site, 120),
    notes: cleanAiText_(raw.notes, 240),
    reimbursable: reimbursable,
    confidence: confidence,
    needsCpaReview: needsCpaReview,
    cpaReviewReason: cpaReviewReason,
    missingFields: missing
  };
}

function roundReceiptMoney_(value) {
  const number = toNumber_(value);
  if (number === '' || Number(number) < 0) return '';
  return Math.round(Number(number) * 100) / 100;
}

function normalizeReceiptPaymentMethod_(value) {
  const raw = clean_(value);
  const lower = raw.toLowerCase();
  if (!lower || lower === 'unknown' || lower === 'not shown' || lower === 'not found') return 'Unknown';
  if (lower.indexOf('cash') !== -1) return 'Cash';
  if (lower.indexOf('check') !== -1 || lower.indexOf('cheque') !== -1) return 'Check';
  if (lower.indexOf('ach') !== -1 || lower.indexOf('bank') !== -1 || lower.indexOf('electronic transfer') !== -1) return 'Bank / ACH';
  if (lower.indexOf('card') !== -1 || lower.indexOf('visa') !== -1 || lower.indexOf('mastercard') !== -1 || lower.indexOf('amex') !== -1 || lower.indexOf('discover') !== -1 || lower.indexOf('debit') !== -1 || lower.indexOf('credit') !== -1) return 'Card';
  if (RECEIPT_AI.paymentMethodValues.indexOf(raw) !== -1) return raw;
  return 'Other';
}

function cleanAiText_(value, maxLength) {
  return clean_(value).replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').slice(0, maxLength);
}

function validateReceiptAiRequestId_(requestId) {
  requestId = clean_(requestId);
  if (!/^[A-Za-z0-9_-]{12,80}$/.test(requestId)) throw new Error('Invalid AI request ID.');
  return requestId;
}

function safeReceiptAiError_(err) {
  const message = String((err && err.message) || err || '');
  if (message.indexOf('CONFIG_MISSING') !== -1) return 'Gemini API key is not configured in Apps Script.';
  if (message.indexOf('GEMINI_HTTP_400') !== -1) return 'Gemini rejected the receipt request. Check the latest Apps Script execution for BT_RECEIPT_AI_ERROR.';
  if (message.indexOf('GEMINI_HTTP_401') !== -1) return 'Gemini rejected the API key. Create a replacement key and update Script Properties.';
  if (message.indexOf('GEMINI_HTTP_403') !== -1) return 'Gemini API access was denied. Check the API key and project permissions.';
  if (message.indexOf('GEMINI_HTTP_404') !== -1) return 'The configured Gemini model is unavailable. Check GEMINI_RECEIPT_MODEL.';
  if (message.indexOf('GEMINI_HTTP_429') !== -1) return 'Gemini free-tier limit reached. Try again later or enter the receipt manually.';
  if (message.indexOf('GEMINI_HTTP_5') !== -1) return 'Gemini is temporarily unavailable. Try again or enter the receipt manually.';
  if (message.indexOf('GEMINI_BAD_JSON') !== -1) return 'Gemini returned an unreadable draft response. Retry once or enter the receipt manually.';
  if (message.indexOf('GEMINI_BAD_RESPONSE') !== -1) return 'Gemini returned an incomplete response. Retry once or enter the receipt manually.';
  if (message.indexOf('UNSUPPORTED_IMAGE') !== -1) return 'AI reading supports JPG, PNG, and WebP receipt photos.';
  if (message.indexOf('TOO_MANY_IMAGES') !== -1) return 'AI reading supports up to 4 receipt photos at a time.';
  if (message.indexOf('IMAGE_TOO_LARGE') !== -1) return 'Receipt photo is too large for AI reading. Retake it closer or continue manually.';
  if (message.indexOf('GEMINI_BLOCKED') !== -1) return 'Gemini could not analyze this image. Manual entry remains available.';
  return 'AI could not read this receipt. Manual entry remains available.';
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
  if (type === 'feedback') return saveFeedback(payload);

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
    now_(), entryId, clean_(payload.client), clean_(payload.site), clean_(payload.workDate),
    clean_(payload.startTime), clean_(payload.endTime), hours,
    clean_(payload.status || 'Complete'), clean_(payload.workPerformed), clean_(payload.notes),
    startOdo, endOdo, miles, clean_(payload.readyForReport || 'No'),
    clean_(payload.photoUrls), clean_(payload.receiptUrls), clean_(payload.createdBy),
    clean_(payload.syncSource || 'Online'), payType,
    clean_(payload.workSpan || 'Single-day'),
    clean_(payload.workStartDate || payload.workDate),
    clean_(payload.workEndDate || payload.workDate),
    billableDays, rate, estimatedPay
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
    now_(), mileageId, clean_(payload.client), clean_(payload.site), clean_(payload.tripDate),
    startOdo, endOdo, miles, clean_(payload.from), clean_(payload.to),
    clean_(payload.purpose || 'Business/job travel'),
    clean_(payload.reimbursed || 'Unknown'), clean_(payload.notes),
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

  const savedFiles = saveReceiptProofFiles_(payload, receiptId);
  if (savedFiles.length) {
    fileUrl = savedFiles.map(function(file) { return file.getUrl(); }).join('\n');
  }

  const row = [
    now_(), receiptId, clean_(payload.client), clean_(payload.site), clean_(payload.receiptDate),
    clean_(payload.vendor), toNumber_(payload.amount), clean_(payload.category),
    clean_(payload.reimbursable || 'Unknown'), '', clean_(payload.notes),
    fileUrl, clean_(payload.aiStatus || 'Manual entry'), clean_(payload.syncSource || 'Online'),
    '', '', '', '', '',
    clean_(payload.invoiceNumber), toNumber_(payload.subtotal), toNumber_(payload.salesTax),
    normalizeReceiptPaymentMethod_(payload.paymentMethod), clean_(payload.cardLast4).replace(/\D/g, '').slice(-4)
  ];

  appendRow_(APP.tabs.receipts, row);
  audit_('SAVE_RECEIPT', receiptId);
  return { ok: true, id: receiptId, fileUrl: fileUrl, message: 'Receipt saved.' };
}

function saveReceiptProofFiles_(payload, receiptId) {
  let files = Array.isArray(payload.files) ? payload.files : [];
  if (!files.length && payload.file) files = [payload.file];
  files = files.filter(function(filePayload) {
    return filePayload && filePayload.base64Data;
  });
  return files.map(function(filePayload, index) {
    const suffix = files.length > 1 ? '-' + (index + 1) : '';
    return saveBase64File_(filePayload, APP.receiptFolderName, receiptId + suffix);
  });
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
    now_(), noteId, clean_(payload.client), clean_(payload.site), clean_(payload.noteDate),
    clean_(payload.type || 'Note'), clean_(payload.note), fileUrl,
    clean_(payload.status || 'Open'), clean_(payload.syncSource || 'Online')
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
    now_(), taxEventId, clean_(payload.eventDate), clean_(payload.type || 'Tax Review'),
    toNumber_(payload.amount), clean_(payload.notes), clean_(payload.status || 'Open')
  ];

  appendRow_(APP.tabs.tax, row);
  audit_('SAVE_TAX_NOTE', taxEventId);
  return { ok: true, id: taxEventId, message: 'Tax note saved.' };
}

function saveFeedback(payload) {
  setupSpreadsheet_();
  payload = payload || {};

  if (!clean_(payload.message)) throw new Error('Feedback message is required.');

  const feedbackId = payload.feedbackId || makeId_('FDBK');
  const row = [
    now_(), feedbackId, clean_(payload.type || 'Suggestion'), clean_(payload.message),
    clean_(payload.contact), clean_(payload.appVersion || APP.version),
    clean_(payload.pageUrl), clean_(payload.userAgent), clean_(payload.syncSource || 'Online'),
    clean_(payload.status || 'New')
  ].concat(['', '', '', '', '']);

  appendRow_(APP.tabs.feedback, row);
  audit_('SAVE_FEEDBACK', feedbackId);
  notifyFeedbackSubmitted_(feedbackId, payload);
  return { ok: true, id: feedbackId, message: 'Feedback saved.' };
}

function notifyFeedbackSubmitted_(feedbackId, payload) {
  if (!APP.feedbackEmail) return;

  try {
    const feedbackType = clean_(payload.type || 'Suggestion');
    const message = clean_(payload.message);
    const contact = clean_(payload.contact) || 'Not provided';
    const appVersion = clean_(payload.appVersion || APP.version);
    const pageUrl = clean_(payload.pageUrl) || 'Not provided';
    const userAgent = clean_(payload.userAgent) || 'Not provided';
    const syncSource = clean_(payload.syncSource || 'Online');
    const submittedAt = now_();
    const subject = '[Bandito Taxito] New ' + feedbackType + ' feedback';
    const body = [
      'Bandito Taxito feedback received.',
      '',
      'Feedback ID: ' + feedbackId,
      'Submitted: ' + submittedAt,
      'Type: ' + feedbackType,
      'Contact: ' + contact,
      'App Version: ' + appVersion,
      'Sync Source: ' + syncSource,
      '',
      'Message:',
      message,
      '',
      'Page URL:',
      pageUrl,
      '',
      'User Agent:',
      userAgent
    ].join('\n');

    MailApp.sendEmail(APP.feedbackEmail, subject, body);
    audit_('SEND_FEEDBACK_EMAIL', feedbackId + ' -> ' + APP.feedbackEmail);
  } catch (err) {
    audit_('SEND_FEEDBACK_EMAIL_FAILED', feedbackId + ': ' + (err.message || String(err)));
  }
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
      else if (type === 'feedback') results.push(saveFeedback(payload));
      else results.push({ ok: false, message: 'Unknown queue item type: ' + type });
    } catch (err) {
      results.push({ ok: false, message: err.message });
    }
  });

  audit_('SYNC_QUEUE', 'Items: ' + items.length);
  return { ok: true, results: results };
}

function updateLogbookEntry(payload) {
  setupSpreadsheet_();
  payload = payload || {};

  const context = getLogbookRowContext_(payload.type, payload.id);
  const updates = payload.updates || {};
  const config = context.config;
  const numberFields = config.numberFields || [];
  let changed = 0;

  Object.keys(config.fields).forEach(function(key) {
    if (!Object.prototype.hasOwnProperty.call(updates, key)) return;
    const header = config.fields[key];
    const column = context.headerMap[header];
    if (!column) return;
    const value = numberFields.indexOf(key) !== -1 ? toNumber_(updates[key]) : clean_(updates[key]);
    context.sheet.getRange(context.rowNumber, column).setValue(value);
    changed += 1;
  });

  if (!changed) throw new Error('No editable fields were supplied.');

  setRowMetadata_(context, {
    'Updated At': now_(),
    'Updated Source': clean_(payload.source || 'Logbook controls')
  });

  audit_('UPDATE_LOGBOOK_ENTRY', context.type + ':' + context.id);
  return { ok: true, id: context.id, type: context.type, message: 'Logbook entry updated.' };
}

function softDeleteLogbookEntry(payload) {
  setupSpreadsheet_();
  payload = payload || {};

  const context = getLogbookRowContext_(payload.type, payload.id);
  const timestamp = now_();
  setRowMetadata_(context, {
    Deleted: 'Yes',
    'Deleted At': timestamp,
    'Delete Reason': clean_(payload.reason || 'Deleted from Logbook'),
    'Updated At': timestamp,
    'Updated Source': clean_(payload.source || 'Logbook controls')
  });

  audit_('SOFT_DELETE_LOGBOOK_ENTRY', context.type + ':' + context.id);
  return { ok: true, id: context.id, type: context.type, message: 'Logbook entry hidden and recoverable.' };
}

function restoreLogbookEntry(payload) {
  setupSpreadsheet_();
  payload = payload || {};

  const context = getLogbookRowContext_(payload.type, payload.id);
  setRowMetadata_(context, {
    Deleted: '',
    'Deleted At': '',
    'Delete Reason': '',
    'Updated At': now_(),
    'Updated Source': clean_(payload.source || 'Logbook restore')
  });

  audit_('RESTORE_LOGBOOK_ENTRY', context.type + ':' + context.id);
  return { ok: true, id: context.id, type: context.type, message: 'Logbook entry restored.' };
}

function getLogbookRowContext_(type, id) {
  type = clean_(type).toLowerCase();
  id = clean_(id);
  const config = LOGBOOK_ENTRY_TYPES[type];
  if (!config) throw new Error('Unsupported logbook entry type.');
  if (!id) throw new Error('Record ID is required.');

  const sheet = getSs_().getSheetByName(config.tabName);
  if (!sheet) throw new Error('Source sheet not found.');

  const values = sheet.getDataRange().getValues();
  if (!values.length) throw new Error('Source sheet is empty.');

  const headers = values[0].map(function(value) { return clean_(value); });
  const headerMap = {};
  headers.forEach(function(header, index) {
    if (header) headerMap[header] = index + 1;
  });

  const idColumn = headerMap[config.idHeader];
  if (!idColumn) throw new Error('Record ID column not found.');

  let rowNumber = 0;
  for (let index = 1; index < values.length; index += 1) {
    if (clean_(values[index][idColumn - 1]) === id) {
      rowNumber = index + 1;
      break;
    }
  }

  if (!rowNumber) throw new Error('Record not found.');
  return { type: type, id: id, config: config, sheet: sheet, rowNumber: rowNumber, headerMap: headerMap };
}

function setRowMetadata_(context, valuesByHeader) {
  Object.keys(valuesByHeader).forEach(function(header) {
    const column = context.headerMap[header];
    if (!column) throw new Error('Required metadata column not found: ' + header);
    context.sheet.getRange(context.rowNumber, column).setValue(valuesByHeader[header]);
  });
}

function getWeeklyReview() {
  setupSpreadsheet_();

  const ss = getSs_();
  const work = readRows_(ss.getSheetByName(APP.tabs.workLog)).filter(notDeletedRow_);
  const receipts = readRows_(ss.getSheetByName(APP.tabs.receipts)).filter(notDeletedRow_);
  const mileage = readRows_(ss.getSheetByName(APP.tabs.mileage)).filter(notDeletedRow_);

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

function getReportData(payload, request) {
  setupSpreadsheet_();
  payload = payload || {};
  const params = (request && request.params) || {};
  const startDate = clean_(payload.startDate || params.startDate);
  const endDate = clean_(payload.endDate || params.endDate);

  const ss = getSs_();
  const work = readRows_(ss.getSheetByName(APP.tabs.workLog))
    .filter(rowHasContent_)
    .filter(notDeletedRow_)
    .filter(function(row) { return rowInReportRange_(row['Work Date'] || row.Timestamp, startDate, endDate); })
    .map(mapWorkLogForApi_);
  const receipts = readRows_(ss.getSheetByName(APP.tabs.receipts))
    .filter(rowHasContent_)
    .filter(notDeletedRow_)
    .filter(function(row) { return rowInReportRange_(row['Receipt Date'] || row.Timestamp, startDate, endDate); })
    .map(mapReceiptForApi_);
  const mileage = readRows_(ss.getSheetByName(APP.tabs.mileage))
    .filter(rowHasContent_)
    .filter(notDeletedRow_)
    .filter(function(row) { return rowInReportRange_(row['Trip Date'] || row.Timestamp, startDate, endDate); })
    .map(mapMileageForApi_);
  const taxNotes = readRows_(ss.getSheetByName(APP.tabs.tax))
    .filter(rowHasContent_)
    .filter(notDeletedRow_)
    .filter(function(row) { return rowInReportRange_(row['Event Date'] || row.Timestamp, startDate, endDate); })
    .map(mapTaxNoteForApi_);

  return {
    generatedAt: now_(),
    range: { startDate: startDate, endDate: endDate },
    summary: buildReportSummary_(work, receipts, mileage),
    expenseByCategory: buildExpenseByCategory_(receipts),
    reimbursements: buildReimbursementSummary_(receipts),
    reviewFlags: buildReportReviewFlags_(work, receipts, mileage),
    missingInfo: buildReportMissingInfo_(work, receipts, mileage),
    work: sortReportRows_(work),
    receipts: sortReportRows_(receipts),
    mileage: sortReportRows_(mileage),
    taxNotes: sortReportRows_(taxNotes)
  };
}

function rowInReportRange_(value, startDate, endDate) {
  const key = dateKey_(value);
  if (!key) return false;
  if (startDate && key < startDate) return false;
  if (endDate && key > endDate) return false;
  return true;
}

function dateKey_(value) {
  if (!value) return '';
  if (value instanceof Date) return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const raw = clean_(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const date = new Date(raw);
  if (isNaN(date.getTime())) return '';
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function mapTaxNoteForApi_(row) {
  return {
    type: 'tax', id: apiValue_(row['Tax Event ID']), timestamp: apiValue_(row.Timestamp),
    title: apiValue_(row.Type || 'Tax Note'), date: apiValue_(row['Event Date']),
    taxType: apiValue_(row.Type), amount: apiValue_(row.Amount), notes: apiValue_(row.Notes),
    status: apiValue_(row.Status)
  };
}

function sortReportRows_(rows) {
  return (rows || []).sort(function(a, b) {
    return String(a.date || a.timestamp || '').localeCompare(String(b.date || b.timestamp || ''));
  });
}

function buildReportSummary_(work, receipts, mileage) {
  const workTotals = (work || []).reduce(function(total, row) {
    total.hours += toReportNumber_(row.hours);
    total.billableDays += toReportNumber_(row.billableDays);
    total.estimatedPay += toReportNumber_(row.estimatedPay);
    return total;
  }, { hours: 0, billableDays: 0, estimatedPay: 0 });
  const expenseTotal = (receipts || []).reduce(function(total, row) {
    return total + toReportNumber_(row.amount);
  }, 0);
  const miles = (mileage || []).reduce(function(total, row) {
    return total + toReportNumber_(row.miles);
  }, 0);

  return {
    workCount: (work || []).length,
    receiptCount: (receipts || []).length,
    mileageCount: (mileage || []).length,
    hours: roundReportNumber_(workTotals.hours),
    billableDays: roundReportNumber_(workTotals.billableDays),
    estimatedPay: roundReportMoney_(workTotals.estimatedPay),
    expenseTotal: roundReportMoney_(expenseTotal),
    businessMiles: roundReportNumber_(miles)
  };
}

function buildExpenseByCategory_(receipts) {
  const totals = {};
  (receipts || []).forEach(function(row) {
    const category = clean_(row.category || 'Other') || 'Other';
    totals[category] = (totals[category] || 0) + toReportNumber_(row.amount);
  });
  return Object.keys(totals).sort().map(function(category) {
    return { category: category, total: roundReportMoney_(totals[category]) };
  });
}

function buildReimbursementSummary_(receipts) {
  const summary = { Yes: 0, No: 0, Unknown: 0 };
  (receipts || []).forEach(function(row) {
    const key = summary.hasOwnProperty(row.reimbursable) ? row.reimbursable : 'Unknown';
    summary[key] += toReportNumber_(row.amount);
  });
  return {
    yes: roundReportMoney_(summary.Yes),
    no: roundReportMoney_(summary.No),
    unknown: roundReportMoney_(summary.Unknown)
  };
}

function buildReportReviewFlags_(work, receipts, mileage) {
  const flags = [];
  (receipts || []).forEach(function(row) {
    const category = clean_(row.category);
    const haystack = [row.vendor, row.category, row.notes, row.aiStatus].join(' ').toLowerCase();
    if (category === 'Other') addReportFlag_(flags, row, 'Receipt', 'Category is Other.');
    if (category === 'Meals') addReportFlag_(flags, row, 'Receipt', 'Meals may need CPA review.');
    if (clean_(row.reimbursable) === 'Unknown') addReportFlag_(flags, row, 'Receipt', 'Reimbursement status is Unknown.');
    if (haystack.indexOf('mixed') !== -1 || haystack.indexOf('personal') !== -1 || haystack.indexOf('split') !== -1) addReportFlag_(flags, row, 'Receipt', 'Possible mixed business/personal expense.');
    if (haystack.indexOf('fuel') !== -1 || haystack.indexOf('vehicle') !== -1 || haystack.indexOf('tire') !== -1 || haystack.indexOf('maintenance') !== -1 || haystack.indexOf('repair') !== -1) addReportFlag_(flags, row, 'Vehicle', 'Vehicle-related expense.');
    if (haystack.indexOf('tool') !== -1 || haystack.indexOf('equipment') !== -1 || haystack.indexOf('computer') !== -1) addReportFlag_(flags, row, 'Receipt', 'Tool/equipment purchase may need classification.');
    if (clean_(row.aiStatus).toLowerCase().indexOf('needs cpa review') !== -1) addReportFlag_(flags, row, 'Receipt', row.aiStatus);
  });
  (mileage || []).forEach(function(row) {
    if (!row.purpose) addReportFlag_(flags, row, 'Mileage', 'Missing trip purpose.');
    if (!row.miles) addReportFlag_(flags, row, 'Mileage', 'Missing calculated miles.');
  });
  (work || []).forEach(function(row) {
    if (!row.endTime) addReportFlag_(flags, row, 'Work', 'Missing end time.');
    if (!row.workPerformed && !row.notes) addReportFlag_(flags, row, 'Work', 'Missing work description/notes.');
  });
  return flags;
}

function buildReportMissingInfo_(work, receipts, mileage) {
  const missing = [];
  (receipts || []).forEach(function(row) {
    if (!row.date) addReportMissing_(missing, row, 'Receipt date');
    if (!row.vendor) addReportMissing_(missing, row, 'Receipt vendor');
    if (!row.amount) addReportMissing_(missing, row, 'Receipt amount');
    if (!row.fileUrl) addReportMissing_(missing, row, 'Receipt proof file');
    if (row.reimbursable === 'Unknown') addReportMissing_(missing, row, 'Reimbursement status');
  });
  (mileage || []).forEach(function(row) {
    if (!row.date) addReportMissing_(missing, row, 'Mileage date');
    if (!row.miles) addReportMissing_(missing, row, 'Mileage miles');
    if (!row.purpose) addReportMissing_(missing, row, 'Mileage purpose');
  });
  (work || []).forEach(function(row) {
    if (!row.endTime) addReportMissing_(missing, row, 'Work end time');
    if (!row.workPerformed && !row.notes) addReportMissing_(missing, row, 'Work performed/notes');
  });
  return missing;
}

function addReportFlag_(flags, row, bucket, reason) {
  flags.push({
    bucket: bucket,
    id: row.id || '',
    date: row.date || row.timestamp || '',
    title: row.title || row.vendor || row.site || '',
    reason: clean_(reason)
  });
}

function addReportMissing_(missing, row, field) {
  missing.push({
    id: row.id || '',
    date: row.date || row.timestamp || '',
    title: row.title || row.vendor || row.site || '',
    field: field
  });
}

function toReportNumber_(value) {
  const number = toNumber_(value);
  return number === '' ? 0 : Number(number);
}

function roundReportMoney_(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function roundReportNumber_(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function getRecentRows_(tabName, limit, mapper) {
  const sheet = getSs_().getSheetByName(tabName);
  return readRows_(sheet)
    .filter(rowHasContent_)
    .filter(notDeletedRow_)
    .reverse()
    .slice(0, limit)
    .map(mapper);
}

function notDeletedRow_(row) {
  const value = clean_(row && row.Deleted).toUpperCase();
  return value !== 'YES' && value !== 'TRUE' && value !== '1';
}

function rowHasContent_(row) {
  return Object.keys(row || {}).some(function(key) {
    const value = row[key];
    return value !== null && value !== undefined && String(value).trim() !== '';
  });
}

function mapWorkLogForApi_(row) {
  return {
    type: 'work', id: apiValue_(row['Entry ID']), timestamp: apiValue_(row.Timestamp),
    title: apiValue_(row['Project/Site'] || row.Client || 'Work Log'),
    client: apiValue_(row.Client), site: apiValue_(row['Project/Site']), date: apiValue_(row['Work Date']),
    startTime: apiValue_(row['Start Time']), endTime: apiValue_(row['End Time']),
    hours: apiValue_(row.Hours), status: apiValue_(row.Status),
    workPerformed: apiValue_(row['Work Performed']), notes: apiValue_(row.Notes),
    miles: apiValue_(row.Miles), billableDays: apiValue_(row['Billable Days']),
    rate: apiValue_(row.Rate), estimatedPay: apiValue_(row['Estimated Pay'])
  };
}

function mapMileageForApi_(row) {
  return {
    type: 'mileage', id: apiValue_(row['Mileage ID']), timestamp: apiValue_(row.Timestamp),
    title: apiValue_((row.From && row.To) ? row.From + ' → ' + row.To : (row['Project/Site'] || 'Mileage')),
    client: apiValue_(row.Client), site: apiValue_(row['Project/Site']), date: apiValue_(row['Trip Date']),
    miles: apiValue_(row.Miles), from: apiValue_(row.From), to: apiValue_(row.To),
    purpose: apiValue_(row.Purpose), reimbursed: apiValue_(row['Reimbursed?']), notes: apiValue_(row.Notes)
  };
}

function mapReceiptForApi_(row) {
  return {
    type: 'receipt', id: apiValue_(row['Receipt ID']), timestamp: apiValue_(row.Timestamp),
    title: apiValue_(row.Vendor || row.Category || 'Receipt'),
    client: apiValue_(row.Client), site: apiValue_(row['Project/Site']), date: apiValue_(row['Receipt Date']),
    vendor: apiValue_(row.Vendor), amount: apiValue_(row.Amount), category: apiValue_(row.Category),
    reimbursable: apiValue_(row['Reimbursable?']), notes: apiValue_(row.Notes),
    invoiceNumber: apiValue_(row['Receipt / Invoice Number']), subtotal: apiValue_(row.Subtotal),
    salesTax: apiValue_(row['Sales Tax']), paymentMethod: apiValue_(row['Payment Method']),
    cardLast4: apiValue_(row['Card Last 4']), fileUrl: apiValue_(row['File URL']), aiStatus: apiValue_(row['AI Status'])
  };
}

function mapNoteForApi_(row) {
  return {
    type: 'note', id: apiValue_(row['Note ID']), timestamp: apiValue_(row.Timestamp),
    title: apiValue_(row.Type || 'Note / Photo'), client: apiValue_(row.Client),
    site: apiValue_(row['Project/Site']), date: apiValue_(row['Note Date']),
    noteType: apiValue_(row.Type), note: apiValue_(row.Note), status: apiValue_(row.Status),
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

  if (savedId) return SpreadsheetApp.openById(savedId);

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

  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const firstRow = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const hasHeaders = firstRow.some(function(value) { return value !== ''; });

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
    return;
  }

  const existingHeaders = firstRow.map(function(value) { return clean_(value); });
  const missingHeaders = headers.filter(function(header) {
    return existingHeaders.indexOf(header) === -1;
  });

  if (missingHeaders.length) {
    const appendColumn = sheet.getLastColumn() + 1;
    sheet.getRange(1, appendColumn, 1, missingHeaders.length).setValues([missingHeaders]);
    sheet.autoResizeColumns(appendColumn, missingHeaders.length);
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
