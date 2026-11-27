/**
 * =====================================================================
 * ACCESS LOG V1.1.0 - records that someone opened a module
 * =====================================================================
 * FILE: AccessLog.js (generic name, no version in the filename; the version
 *       is tracked here. Same convention as ApiClient.js and VerificationModal.js)
 * CREATED: November 2026
 * V1.1.0 (Nov 2026): the detail names the portal in the page's ?portal= address, and the
 *   once-a-day record is kept per detail (see VerificationModal V2.5.0). No other change.
 *
 * PURPOSE: For modules that do NOT use VerificationModal.js (open modules and
 *   the Zone Rep pages that check the old per-portal session). Modules that
 *   use VerificationModal.js (V2.4.0+) are logged by that file and do not
 *   need this one. Writes one row to the AccessLog sheet (the sheet System
 *   Logs shows on its Access Log tab) through ManagementCentral's existing
 *   logAccess action: type 'Module-Access', name, unit, detail = module name.
 *
 * USAGE (one line in the page, anywhere after the page has loaded its HTML):
 *   <script src="AccessLog.js" data-module="Community Surveys"></script>
 *   The page is logged when it loads. Nothing else is needed.
 *
 * RULES:
 *   - Who: the shared sign-in (localStorage 'lakeIllawongSession') if it is
 *     valid; otherwise the old per-portal session keys (sessionStorage);
 *     otherwise the name is 'Not signed in'. Read-only: it never signs
 *     anyone in or out and never shows anything.
 *   - At most ONE row per person, per module, per device, per calendar day
 *     (same 'lakeIllawongModuleLog' record VerificationModal V2.4.0 uses, so
 *     a page that has both files is still logged once).
 *   - Fire-and-forget: one request, never repeated; any failure is ignored
 *     and can never delay, change or break the page.
 *   - Needs no other file (no ApiClient.js, no jQuery, nothing).
 *   - Kill switch: set ENABLED to false.
 * =====================================================================
 */
(function () {
    'use strict';
    var ENABLED = true;
    var URL_ = 'https://script.google.com/macros/s/AKfycbzVF25ss7kEmhE42Sf-i_vpLIL1FpTe2AjNeb0b8MqP_eBXAxV9ghWcuwe25hdEuqBFjw/exec';
    var SHARED_KEY = 'lakeIllawongSession';
    var LOG_KEY = 'lakeIllawongModuleLog';
    var LEGACY_KEYS = ['lakeIllawongVerified', 'portalAdminVerified', 'portalZoneRepVerified',
                       'portalFieldOpsVerified', 'portalSysAdminVerified', 'periodicReportsVerified'];

    // The <script> tag that loaded this file carries the module name.
    var tag = document.currentScript;
    var moduleName = (tag && tag.getAttribute('data-module')) || document.title || 'Module';

    // V1.1.0: when the page was opened with ?portal=..., the detail names that
    // portal (e.g. "Desktop Explorer (Operations Portal)"), and the once-a-day
    // record is kept per detail, so each route into a module is logged.
    try {
        var portalParam = new URLSearchParams(window.location.search).get('portal');
        if (portalParam) {
            var labels = { operations: 'Operations Portal', zonerep: 'Zone Rep Portal', residents: 'Resident Portal' };
            moduleName = moduleName + ' (' + (labels[portalParam.toLowerCase()] || portalParam) + ')';
        }
    } catch (e) {}

    function who() {
        try {
            var s = JSON.parse(localStorage.getItem(SHARED_KEY) || 'null');
            if (s && s.name && s.expiresAt && Date.now() < s.expiresAt) return { name: s.name, unit: s.unit || '' };
        } catch (e) {}
        try {
            for (var i = 0; i < LEGACY_KEYS.length; i++) {
                var k = LEGACY_KEYS[i];
                if (sessionStorage.getItem(k) === 'true' && sessionStorage.getItem(k + '_name')) {
                    return { name: sessionStorage.getItem(k + '_name'), unit: sessionStorage.getItem(k + '_unit') || '' };
                }
            }
        } catch (e) {}
        return null;
    }

    function send(name, unit) {
        var cb = 'alcb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        var script = document.createElement('script');
        function cleanup() {
            window[cb] = function () {};
            try { document.head.removeChild(script); } catch (e) {}
        }
        window[cb] = cleanup;
        script.onerror = cleanup;
        var q = '?action=logAccess&callback=' + cb +
            '&type=Module-Access' +
            '&name=' + encodeURIComponent(name) +
            '&unit=' + encodeURIComponent(unit || '') +
            '&detail=' + encodeURIComponent(moduleName);
        script.src = URL_ + q;
        document.head.appendChild(script);
    }

    function logOpen() {
        try {
            if (!ENABLED) return;
            var p = who();
            var name = p ? p.name : 'Not signed in';
            var d = new Date();
            var today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            var key = name + '|' + moduleName;
            try {
                var seen = JSON.parse(localStorage.getItem(LOG_KEY) || '{}') || {};
                if (seen[key] === today) return;
                Object.keys(seen).forEach(function (k) { if (seen[k] !== today) delete seen[k]; });
                seen[key] = today;
                localStorage.setItem(LOG_KEY, JSON.stringify(seen));
            } catch (e) { /* storage blocked: log anyway */ }
            send(name, p ? p.unit : '');
        } catch (e) { /* logging must never affect the page */ }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', logOpen);
    else logOpen();
})();
