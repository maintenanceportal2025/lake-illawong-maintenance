/**
 * =====================================================================
 * EventEntryModal V1.2
 * Lake Illawong Management Central System
 * =====================================================================
 *
 * PURPOSE:
 *   Reusable Event Entry modal for ComplaintsManager and DisputesManager.
 *   Single point of entry for all Board-recorded events in the Matter
 *   History. Writes to the Events sheet tab via the calling module's
 *   backend (addEvent action).
 *
 * VERSION HISTORY:
 *   V1.2 (Jun 2026): Type filtering delegated to Dropdowns sheet.
 *     Complaint Event Type and Dispute Event Type are now separate
 *     categories in the Dropdowns sheet. Backend passes correct list
 *     per module. Modal renders whatever it receives -- no client-side
 *     filtering needed. COMPLAINT_EXCLUDED_TYPES removed.
 *
 *   V1.1 (Jun 2026): All added to visibility options for both matter types.
 *     Complaints: Resident, Board, All.
 *     Disputes: Party A, Party B, Shared, Board, All.
 *
 *   V1.0 (Jun 2026): Initial build.
 *     Self-contained IIFE -- injects its own HTML and CSS on first call.
 *     Exposes one public function: EventEntryModal.open(config).
 *     Two-panel layout: Panel 1 always shown (Event Type, Visibility,
 *     Summary). Panel 2 conditional on Event Type:
 *       Email Received / Email Sent: EmailFrom, EmailTo, EmailSubject,
 *         EmailDate (all mandatory), ExtendedNotes (optional).
 *       Meeting / Phone Call / Inspection: Reference (optional),
 *         ExtendedNotes (optional).
 *       Evidence Received: Reference (mandatory), ExtendedNotes (optional).
 *       All other types: ExtendedNotes only (optional).
 *     Visibility options vary by matterType:
 *       Complaint: Resident, Board, All.
 *       Dispute: Party A, Party B, Shared, Board, All.
 *     Event types loaded from backend getActivityEntryTypes action.
 *     Falls back to hardcoded defaults if backend call fails.
 *     On success: calls config.onSuccess(event) with saved event object.
 *     JSONP communication -- no POST/CORS.
 *
 * USAGE:
 *   1. Include: <script src="EventEntryModal_V1_0.js"></script>
 *   2. Call:
 *      EventEntryModal.open({
 *        matterRef:   'COMP-20260610-001',
 *        matterType:  'Complaint',         // or 'Dispute'
 *        backendUrl:  CONFIG.BACKEND_URL,
 *        userName:    currentUser.name,
 *        onSuccess:   function(event) { }  // receives saved event object
 *      });
 *
 * =====================================================================
 */

const EventEntryModal = (function () {

  // ── Email event types that require extra mandatory fields
  const EMAIL_TYPES = ['Email Received', 'Email Sent'];


  // ── Evidence Received requires mandatory Reference field
  const EVIDENCE_TYPES = ['Evidence Received'];

  // ── Types with Reference field (optional)
  const REFERENCE_TYPES = ['Meeting', 'Phone Call', 'Inspection'];

  // ── Fallback event types if backend call fails
  const DEFAULT_TYPES = [
    'Email Received', 'Email Sent', 'Phone Call', 'Meeting',
    'Inspection', 'Evidence Received', 'Board Assessment',
    'Status Update', 'Resolution Proposal', 'Resolution Accepted',
    'Resolution Rejected', 'Administrative', 'Note'
  ];

  let _injected  = false;
  let _config    = null;
  let _types     = [];

  // ── Public: open the modal with config
  function open(config) {
    _config = config;
    if (!_injected) { _inject(); _injected = true; }
    _reset();
    _loadTypes();
    document.getElementById('eem-overlay').style.display = 'flex';
  }

  // ── Public: close the modal
  function close() {
    var overlay = document.getElementById('eem-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  // ── Load event types from backend
  function _loadTypes() {
    if (!_config || !_config.backendUrl) {
      _populateTypes(DEFAULT_TYPES);
      return;
    }
    var cbName = 'eemTypesCallback_' + Date.now();
    var url    = _config.backendUrl + '?action=getActivityEntryTypes&callback=' + cbName;
    var timeout = setTimeout(function () {
      _cleanup(cbName);
      _populateTypes(DEFAULT_TYPES);
    }, 8000);

    window[cbName] = function (data) {
      clearTimeout(timeout);
      _cleanup(cbName);
      _populateTypes(data.success && data.types && data.types.length ? data.types : DEFAULT_TYPES);
    };

    var s = document.createElement('script');
    s.onerror = function () { clearTimeout(timeout); _cleanup(cbName); _populateTypes(DEFAULT_TYPES); };
    s.src = url;
    document.head.appendChild(s);
  }

  // ── Populate event type dropdown
  function _populateTypes(types) {
    _types = types;
    var sel = document.getElementById('eem-event-type');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Select event type —</option>';
    types.forEach(function (t) {
      var opt = document.createElement('option');
      opt.value = t; opt.textContent = t;
      sel.appendChild(opt);
    });
  }

  // ── Reset modal to initial state
  function _reset() {
    // Title
    var title = document.getElementById('eem-title');
    if (title) title.textContent = 'Add Event — ' + (_config ? _config.matterRef : '');

    // Visibility options
    var visSel = document.getElementById('eem-visibility');
    if (visSel) {
      visSel.innerHTML = '<option value="">— Select visibility —</option>';
      var opts = _config && _config.matterType === 'Dispute'
        ? ['Party A', 'Party B', 'Shared', 'Board', 'All']
        : ['Resident', 'Board', 'All'];
      opts.forEach(function (o) {
        var opt = document.createElement('option');
        opt.value = o; opt.textContent = o;
        visSel.appendChild(opt);
      });
    }

    // Clear fields
    ['eem-event-type', 'eem-visibility', 'eem-summary',
     'eem-reference', 'eem-extended-notes', 'eem-email-notes',
     'eem-email-from', 'eem-email-to', 'eem-email-subject', 'eem-email-date'
    ].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });

    // Hide conditional panels
    _showPanel('eem-panel-email',      false);
    _showPanel('eem-panel-reference',  false);
    _showPanel('eem-panel-notes',      false);

    // Clear feedback
    var fb = document.getElementById('eem-feedback');
    if (fb) { fb.textContent = ''; fb.className = 'eem-feedback'; }

    // Reset button
    var btn = document.getElementById('eem-save-btn');
    if (btn) { btn.textContent = 'Save Event'; btn.disabled = false; }
  }

  // ── Show/hide a conditional panel
  function _showPanel(id, show) {
    var el = document.getElementById(id);
    if (el) el.style.display = show ? 'block' : 'none';
  }

  // ── Handle event type change -- show conditional fields
  function _onTypeChange() {
    var sel  = document.getElementById('eem-event-type');
    var type = sel ? sel.value : '';

    var isEmail     = EMAIL_TYPES.indexOf(type) !== -1;
    var isEvidence  = EVIDENCE_TYPES.indexOf(type) !== -1;
    var isReference = REFERENCE_TYPES.indexOf(type) !== -1;

    _showPanel('eem-panel-email',     isEmail);
    _showPanel('eem-panel-reference', isReference || isEvidence);
    _showPanel('eem-panel-notes',     !isEmail); // ExtendedNotes always shown except email (already has it)

    // Reference label and mandatory marker
    var refLabel = document.getElementById('eem-reference-label');
    if (refLabel) {
      refLabel.innerHTML = isEvidence
        ? 'Where Stored <span class="eem-required">*</span>'
        : 'Reference <span class="eem-optional">(optional)</span>';
    }

    // For email types show ExtendedNotes inside email panel
    _showPanel('eem-panel-email-notes', isEmail);
  }

  // ── Save event
  function _save() {
    var type        = (document.getElementById('eem-event-type')     || {}).value || '';
    var visibility  = (document.getElementById('eem-visibility')     || {}).value || '';
    var summary     = ((document.getElementById('eem-summary')       || {}).value || '').trim();
    var reference   = ((document.getElementById('eem-reference')     || {}).value || '').trim();
    var isEmailType = EMAIL_TYPES.indexOf(type) !== -1;
    var extNotesId  = isEmailType ? 'eem-email-notes' : 'eem-extended-notes';
    var extNotes    = ((document.getElementById(extNotesId) || {}).value || '').trim();
    var emailFrom   = ((document.getElementById('eem-email-from')    || {}).value || '').trim();
    var emailTo     = ((document.getElementById('eem-email-to')      || {}).value || '').trim();
    var emailSubj   = ((document.getElementById('eem-email-subject') || {}).value || '').trim();
    var emailDate   = ((document.getElementById('eem-email-date')    || {}).value || '').trim();

    var fb  = document.getElementById('eem-feedback');
    var btn = document.getElementById('eem-save-btn');

    // Validation
    var err = '';
    if (!type)       err = 'Please select an event type.';
    else if (!visibility) err = 'Please select visibility.';
    else if (!summary)    err = 'Summary is required.';
    else if (EMAIL_TYPES.indexOf(type) !== -1) {
      if (!emailFrom) err = 'Email From is required.';
      else if (!emailTo)   err = 'Email To is required.';
      else if (!emailSubj) err = 'Email Subject is required.';
      else if (!emailDate) err = 'Email Date is required.';
    } else if (EVIDENCE_TYPES.indexOf(type) !== -1 && !reference) {
      err = 'Where Stored is required for Evidence Received.';
    }

    if (err) {
      if (fb) { fb.textContent = err; fb.className = 'eem-feedback eem-error'; }
      return;
    }

    if (btn) { btn.textContent = 'Saving\u2026'; btn.disabled = true; }
    if (fb)  { fb.textContent = ''; fb.className = 'eem-feedback'; }

    var cbName = 'eemSaveCallback_' + Date.now();
    var url = _config.backendUrl
      + '?action=addEvent'
      + '&matterRef='     + encodeURIComponent(_config.matterRef)
      + '&matterType='    + encodeURIComponent(_config.matterType)
      + '&user='          + encodeURIComponent(_config.userName || 'Unknown')
      + '&eventType='     + encodeURIComponent(type)
      + '&visibility='    + encodeURIComponent(visibility)
      + '&summary='       + encodeURIComponent(summary)
      + '&reference='     + encodeURIComponent(reference)
      + '&extendedNotes=' + encodeURIComponent(extNotes)
      + '&emailFrom='     + encodeURIComponent(emailFrom)
      + '&emailTo='       + encodeURIComponent(emailTo)
      + '&emailSubject='  + encodeURIComponent(emailSubj)
      + '&emailDate='     + encodeURIComponent(emailDate)
      + '&callback='      + cbName;

    var timeout = setTimeout(function () {
      _cleanup(cbName);
      if (btn) { btn.textContent = 'Save Event'; btn.disabled = false; }
      if (fb)  { fb.textContent = 'Timed out \u2014 please try again.'; fb.className = 'eem-feedback eem-error'; }
    }, 15000);

    window[cbName] = function (data) {
      clearTimeout(timeout);
      _cleanup(cbName);
      if (data.success) {
        close();
        if (_config.onSuccess) _config.onSuccess(data.event);
      } else {
        if (btn) { btn.textContent = 'Save Event'; btn.disabled = false; }
        if (fb)  { fb.textContent = 'Error: ' + (data.error || 'Unknown error.'); fb.className = 'eem-feedback eem-error'; }
      }
    };

    var s = document.createElement('script');
    s.onerror = function () {
      clearTimeout(timeout); _cleanup(cbName);
      if (btn) { btn.textContent = 'Save Event'; btn.disabled = false; }
      if (fb)  { fb.textContent = 'Network error \u2014 please try again.'; fb.className = 'eem-feedback eem-error'; }
    };
    s.src = url;
    document.head.appendChild(s);
  }

  // ── JSONP cleanup
  function _cleanup(name) {
    try { delete window[name]; } catch(e) {}
    var s = document.querySelector('script[src*="' + name + '"]');
    if (s && s.parentNode) s.parentNode.removeChild(s);
  }

  // ── Inject modal HTML and CSS into page
  function _inject() {
    // ── CSS
    var style = document.createElement('style');
    style.textContent = [
      '#eem-overlay {',
      '  display:none; position:fixed; inset:0; z-index:9000;',
      '  background:rgba(0,0,0,0.6); backdrop-filter:blur(4px);',
      '  align-items:center; justify-content:center; padding:16px;',
      '}',
      '#eem-modal {',
      '  background:linear-gradient(135deg,rgba(30,64,175,0.95) 0%,rgba(30,58,138,0.98) 100%);',
      '  border:1px solid rgba(255,255,255,0.15); border-radius:4px;',
      '  padding:24px; width:100%; max-width:560px; max-height:90vh;',
      '  overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,0.5);',
      '  position:relative;',
      '}',
      '#eem-modal h2 {',
      '  font-size:1rem; font-weight:700; color:white; margin:0 0 20px;',
      '  padding-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.1);',
      '}',
      '.eem-close {',
      '  position:absolute; top:16px; right:16px; background:none; border:none;',
      '  color:rgba(255,255,255,0.5); font-size:1.2rem; cursor:pointer; line-height:1;',
      '}',
      '.eem-close:hover { color:white; }',
      '.eem-field { margin-bottom:14px; }',
      '.eem-label {',
      '  display:block; font-size:0.75rem; font-weight:600;',
      '  text-transform:uppercase; letter-spacing:0.4px;',
      '  color:rgba(255,255,255,0.6); margin-bottom:5px;',
      '}',
      '.eem-required { color:#f87171; margin-left:2px; }',
      '.eem-optional { color:rgba(255,255,255,0.35); font-weight:400; text-transform:none; letter-spacing:0; font-size:0.72rem; }',
      '.eem-input, .eem-select, .eem-textarea {',
      '  width:100%; background:rgba(255,255,255,0.08);',
      '  border:1px solid rgba(255,255,255,0.2); border-radius:2px;',
      '  color:white; padding:8px 10px; font-size:0.85rem;',
      '  font-family:inherit; box-sizing:border-box;',
      '}',
      '.eem-input:focus, .eem-select:focus, .eem-textarea:focus {',
      '  outline:none; border-color:rgba(255,255,255,0.45);',
      '  background:rgba(255,255,255,0.12);',
      '}',
      '.eem-select option { background:#1e3a8a; color:white; }',
      '.eem-textarea { resize:vertical; min-height:72px; }',
      '.eem-input::placeholder, .eem-textarea::placeholder { color:rgba(255,255,255,0.35); }',
      '.eem-panel {',
      '  margin-top:14px; padding:14px;',
      '  background:rgba(0,0,0,0.15); border-radius:2px;',
      '  border-left:3px solid rgba(255,255,255,0.15);',
      '}',
      '.eem-panel-title {',
      '  font-size:0.72rem; font-weight:700; text-transform:uppercase;',
      '  letter-spacing:0.5px; color:rgba(255,255,255,0.45); margin-bottom:12px;',
      '}',
      '.eem-row { display:flex; gap:10px; }',
      '.eem-row .eem-field { flex:1; }',
      '.eem-divider {',
      '  border:none; border-top:1px solid rgba(255,255,255,0.08); margin:18px 0;',
      '}',
      '.eem-actions { display:flex; gap:10px; align-items:center; margin-top:20px; }',
      '.eem-btn-save {',
      '  background:rgba(13,148,136,0.25); border:1px solid rgba(13,148,136,0.6);',
      '  color:#99f6e4; padding:9px 20px; border-radius:2px;',
      '  font-size:0.85rem; font-weight:600; cursor:pointer;',
      '}',
      '.eem-btn-save:hover:not(:disabled) { background:rgba(13,148,136,0.4); }',
      '.eem-btn-save:disabled { opacity:0.5; cursor:not-allowed; }',
      '.eem-btn-cancel {',
      '  background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15);',
      '  color:rgba(255,255,255,0.7); padding:9px 16px; border-radius:2px;',
      '  font-size:0.85rem; cursor:pointer;',
      '}',
      '.eem-btn-cancel:hover { background:rgba(255,255,255,0.1); }',
      '.eem-feedback { font-size:0.82rem; }',
      '.eem-error { color:#f87171; }',
      '.eem-success { color:#6ee7b7; }',
    ].join('\n');
    document.head.appendChild(style);

    // ── HTML
    var div = document.createElement('div');
    div.id = 'eem-overlay';
    div.innerHTML = [
      '<div id="eem-modal">',
      '  <button class="eem-close" onclick="EventEntryModal.close()" title="Close">&times;</button>',
      '  <h2 id="eem-title">Add Event</h2>',

      '  <!-- Panel 1: Always shown -->',
      '  <div class="eem-field">',
      '    <label class="eem-label" for="eem-event-type">Event Type <span class="eem-required">*</span></label>',
      '    <select id="eem-event-type" class="eem-select" onchange="EventEntryModal._onTypeChange()">',
      '      <option value="">— Select event type —</option>',
      '    </select>',
      '  </div>',

      '  <div class="eem-field">',
      '    <label class="eem-label" for="eem-visibility">Visibility <span class="eem-required">*</span></label>',
      '    <select id="eem-visibility" class="eem-select">',
      '      <option value="">— Select visibility —</option>',
      '    </select>',
      '  </div>',

      '  <div class="eem-field">',
      '    <label class="eem-label" for="eem-summary">Summary <span class="eem-required">*</span></label>',
      '    <input id="eem-summary" class="eem-input" type="text" placeholder="Brief description of the event\u2026" />',
      '  </div>',

      '  <hr class="eem-divider" />',

      '  <!-- Panel 2a: Email fields (Email Received / Email Sent) -->',
      '  <div id="eem-panel-email" class="eem-panel" style="display:none;">',
      '    <div class="eem-panel-title">Email Details</div>',
      '    <div class="eem-row">',
      '      <div class="eem-field">',
      '        <label class="eem-label" for="eem-email-from">From <span class="eem-required">*</span></label>',
      '        <input id="eem-email-from" class="eem-input" type="text" placeholder="sender@example.com" />',
      '      </div>',
      '      <div class="eem-field">',
      '        <label class="eem-label" for="eem-email-to">To <span class="eem-required">*</span></label>',
      '        <input id="eem-email-to" class="eem-input" type="text" placeholder="recipient@example.com" />',
      '      </div>',
      '    </div>',
      '    <div class="eem-field">',
      '      <label class="eem-label" for="eem-email-subject">Subject <span class="eem-required">*</span></label>',
      '      <input id="eem-email-subject" class="eem-input" type="text" placeholder="Email subject line\u2026" />',
      '    </div>',
      '    <div class="eem-field">',
      '      <label class="eem-label" for="eem-email-date">Email Date <span class="eem-required">*</span></label>',
      '      <input id="eem-email-date" class="eem-input" type="date" />',
      '    </div>',
      '    <div id="eem-panel-email-notes" style="display:none;">',
      '      <div class="eem-field">',
      '        <label class="eem-label" for="eem-email-notes">Notes <span class="eem-optional">(optional)</span></label>',
      '        <textarea id="eem-email-notes" class="eem-textarea" placeholder="Additional context or key points from the email\u2026"></textarea>',
      '      </div>',
      '    </div>',
      '  </div>',

      '  <!-- Panel 2b: Reference field (Meeting, Phone Call, Inspection, Evidence Received) -->',
      '  <div id="eem-panel-reference" class="eem-panel" style="display:none;">',
      '    <div class="eem-field">',
      '      <label class="eem-label" id="eem-reference-label" for="eem-reference">Reference <span class="eem-optional">(optional)</span></label>',
      '      <input id="eem-reference" class="eem-input" type="text" placeholder="e.g. location, file reference, Drive link\u2026" />',
      '    </div>',
      '  </div>',

      '  <!-- Panel 2c: Extended notes (all types except email -- which uses its own) -->',
      '  <div id="eem-panel-notes" class="eem-panel" style="display:none;">',
      '    <div class="eem-field">',
      '      <label class="eem-label" for="eem-extended-notes">Extended Notes <span class="eem-optional">(optional)</span></label>',
      '      <textarea id="eem-extended-notes" class="eem-textarea" placeholder="Additional detail\u2026"></textarea>',
      '    </div>',
      '  </div>',

      '  <!-- Actions -->',
      '  <div class="eem-actions">',
      '    <button id="eem-save-btn" class="eem-btn-save" onclick="EventEntryModal._save()">Save Event</button>',
      '    <button class="eem-btn-cancel" onclick="EventEntryModal.close()">Cancel</button>',
      '    <span id="eem-feedback" class="eem-feedback"></span>',
      '  </div>',
      '</div>',
    ].join('\n');
    document.body.appendChild(div);

    // Close on overlay click
    div.addEventListener('click', function (e) {
      if (e.target === div) close();
    });
  }

  // ── Public API
  return {
    open:          open,
    close:         close,
    _onTypeChange: _onTypeChange,
    _save:         _save
  };

})();
