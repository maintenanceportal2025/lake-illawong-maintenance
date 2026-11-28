/**
 * =====================================================================
 * VERIFICATION MODAL COMPONENT V2.7.0
 * =====================================================================
 * PURPOSE: Reusable OTP verification for all Lake Illawong modules
 * VERSION: 2.7.0
 * CREATED: February 16, 2026
 * LAST UPDATED: November 2026
 * FILE: VerificationModal.js (generic name, no version in the filename)
 * DESIGN: Glass effect modal from Unified Design System V2.4
 *
 * CHANGE LOG (version is tracked here in the header, not in the filename:
 * this file is shared by ~15+ modules by its generic name, same convention
 * as ApiClient.js and EventEntryModal.js. The frozen predecessor
 * VerificationModal_V1_0.js keeps the old "1.0" numbering and must not be
 * changed; ALL changes go in this file only.):
 * - V2.7.0 (Nov 2026, no double row for the portals): the Operations Portal and
 *   the Zone Rep Portal write their own Portal-Login row, so this file no
 *   longer writes a second (Module-Access) row for them. A portal connection is
 *   now ONE row. Done with the list SELF_LOGGING below; add a module name there
 *   if another page ever logs itself. Nothing else changed from V2.6.0.
 * - V2.6.0 (Nov 2026, access log retries a lost send): the once-a-day record
 *   was written BEFORE the log row was sent, so one lost request (Apps Script
 *   replies are sometimes dropped; seen 27 Nov on Periodic Reports) silenced
 *   that module for the rest of the day on that device. The record is now
 *   written only AFTER the server confirms the row ({success:true}); a send
 *   that fails or gets no reply is simply tried again the next time the module
 *   opens. A send already on its way is not repeated by a second load of the
 *   same module. Trade-off: if a reply is lost AFTER the row was written, the
 *   next open adds a second row (a duplicate is better than a gap). Nothing
 *   else changed from V2.5.0.
 * - V2.5.0 (Nov 2026, access log names the portal): a module that is opened
 *   from more than one portal (Desktop Explorer, Periodic Reports, Timeline
 *   Viewer, Problem Queue and others) was logged only once a day per person,
 *   so a visit from the second portal was silently skipped (seen 27 Nov: the
 *   Desktop Explorer row appeared for the Zone Rep Portal but not for the
 *   Operations Portal). The log detail now carries the portal named in the
 *   page's ?portal= address, e.g. "Desktop Explorer (Operations Portal)" or
 *   "Periodic Reports (Zone Rep Portal)", and the once-a-day record is kept
 *   per detail, so each route is logged. A page opened without ?portal= logs
 *   its plain module name, exactly as in V2.4.0. Nothing else changed.
 * - V2.4.0 (Nov 2026, module access log): every time a signed-in person
 *   opens a module, one row is added to the AccessLog sheet (type
 *   'Module-Access', name, unit, detail = the module's moduleName, e.g.
 *   'Document Library'). Why: with 90-day sessions the sign-in log no longer
 *   shows who is using what. It is written from init() when the person is
 *   already signed in, and from a successful verification, so every page
 *   that uses this file is covered with no page edits. At most ONE row per
 *   person, per module, per device, per calendar day (a small
 *   'lakeIllawongModuleLog' record in localStorage), so refreshes and
 *   navigating back and forth do not fill the sheet. It uses the existing
 *   logAccess action (no backend change), is sent once, never retried, and
 *   any failure is swallowed, so it can never delay or block a page. Name
 *   and unit are as held in the person's session (the same basis as the
 *   existing Portal-Login rows). The Operations Portal and Zone Rep Portal
 *   keep writing their own Portal-Login row as well. Kill switch: set
 *   USE_ACCESS_LOG to false below. Nothing else changed from V2.3.0.
 * - V2.3.0 (Nov 2026, longer session): the sliding window goes from 30 to
 *   90 days and the hard cap from 90 days to 365 days (12 months), both
 *   counted as before. Why: a resident who uses the portals regularly is
 *   no longer asked for a code every quarter, but everyone still verifies
 *   again at least once a year, which refreshes role tags and drops anyone
 *   who has left. Only the two constants SLIDE_DAYS and CAP_DAYS (and the
 *   comments that quote them) changed; no logic, UI or API change. Sessions
 *   already in a browser carry over: they keep their original verifiedAt, so
 *   the new 365-day cap counts from that date, and the next page load
 *   slides the expiry out to 90 days. Nobody is signed out by deploying.
 *   Shared-device warning: a longer session makes Log Out more important on
 *   a device other people use (e.g. a public library computer).
 * - V2.2.1 (Nov 2026, shared role check): new checkAccess(allowedRoles), a
 *   read-only helper so any page can make its role check in one line:
 *     const r = VerificationModal.checkAccess(['Relations-Manager']);
 *     r.ok (true/false), r.reason (null | 'not-signed-in' | 'no-role'),
 *     r.user (the signed-in person's data, or null).
 *   Rules: nobody signed in -> not ok, 'not-signed-in'. The 'Developer' tag
 *   always passes. An empty or missing list means "any signed-in person";
 *   a value that is not a list (e.g. a string by mistake) is refused.
 *   Otherwise the person needs at least one of the listed tags (exact match,
 *   same as the includes() checks pages use today). It only READS the
 *   session: it never shows the modal, clears anything or redirects, so the
 *   page decides what to do (existing denied screens are unchanged). No
 *   page uses it yet; nothing else in this file changed from V2.2.0.
 * - V2.2.0 (Nov 2026, shared session): ONE sign-in now covers every portal.
 *   (1) A single shared session is kept in localStorage under the key
 *   'lakeIllawongSession' (name, unit, roleTags, email, phone, identifier,
 *   verifiedAt, expiresAt). init() reads it first: a person who has verified
 *   on any page is already verified on every other page that uses this file.
 *   Each page still makes its OWN role check in onSuccess (unchanged), so a
 *   shared sign-in never grants access to anything the roles do not allow.
 *   (2) Lifetime (superseded by V2.3.0: now 90 sliding / 365 cap): 30 days SLIDING (every page that loads while signed in
 *   pushes the expiry out to 30 days from now) with a HARD CAP of 90 days
 *   from the original verification, after which a new code is required.
 *   This applies to every portal including Admin and SysAdmin. The
 *   storageType / expiryDays options are still accepted so no page needs
 *   editing, but the lifetime is now set here: Field Ops (storageType
 *   'local', expiryDays 30, formerly an absolute 30 days) follows the same
 *   30 / 90 rule as everyone else.
 *   (3) Pages that read the old per-portal keys directly (without this
 *   file) keep working: on every successful init() / verification the old
 *   keys for the calling page's sessionKey (<key>, _name, _unit, _roles,
 *   _identifier, _email, _phone, plus _expires for storageType 'local') are
 *   written into the SAME store as before (sessionStorage by default,
 *   localStorage for storageType 'local'). Those pages can be moved to this
 *   file one version at a time. NOTE: such a page opened directly in a new
 *   tab, before any page using this file has run in that tab, will not yet
 *   see its old key and will send the person to its portal page first.
 *   (4) clearVerification() now clears the shared session AND every old
 *   per-portal key (all six known keys, both stores, plus the calling
 *   page's own sessionKey). Without that, the next page load would simply
 *   read the shared session and sign the person straight back in. Every
 *   portal's Access Denied / Log Out path already calls it, so a Log Out on
 *   any page signs the person out of every portal (and a denied portal
 *   signs them out everywhere -- by design).
 *   (5) New logout(redirectUrl): clearVerification() + hide(), then goes to
 *   redirectUrl if one is given.
 *   (6) Step 1 now says: "You'll stay signed in on this device. Not your
 *   device? Log out when finished." (existing .vm-info style, no new CSS).
 *   (7) Safety net: if localStorage cannot be used (blocked / full), the
 *   file behaves exactly as V2.1.0 did (per-page session keys only).
 *   One-time effect of deploying: nobody is carried over from an old
 *   per-portal session -- each person verifies once more, and that sign-in
 *   then covers every portal. No change to the OTP send / verify / relay /
 *   warm-up code.
 * - V2.1.0 (Nov 2026, warm-up): when the modal is first shown on a page, it now makes
 *   one quiet, read-only call (checkVerificationStatus for a dummy address,
 *   via the same relay path a real send uses) so the Netlify function and
 *   ManagementCentral are already awake by the time the user has typed an
 *   email address and pressed Send. Prompted by intermittent slow first
 *   sends (17 Nov: the VerificationCodes row was created seconds before the
 *   email arrived, i.e. the wait was a cold start BEFORE the server began
 *   work; residents then press Send again and get two codes). The reply is
 *   ignored and any failure is swallowed -- if the first ping times out it is
 *   tried once more 2s later, because a timed-out request still wakes the
 *   backend. Sends nothing, issues no code, writes nothing, and changes no
 *   UI. Once per page load. Kill switch: set USE_WARMUP to false below.
 * - V2.0.0 (Nov 2026, rename -- baseline for this filename): the file was renamed
 *   from VerificationModal_V1_0.js and takes the number 2.0.0 because it already
 *   carries the whole Sep-Oct 2026 OTP rework (retry, status polling, requestId,
 *   Netlify relay), none of which was ever given a version number under the old
 *   fixed "1.0". The notes under "Sep/Oct 2026" below are that history.
 *   Original note for the rename itself: file renamed from VerificationModal_V1_0.js to the
 *   generic VerificationModal.js, matching ApiClient.js and EventEntryModal.js,
 *   so a consumer's <script src> never needs editing again when this file
 *   changes. NO CODE CHANGE: the code below is identical to
 *   VerificationModal_V1_0.js as it stood at the Oct 2026 (relay) change.
 *   Both files are deployed side by side during the phased switch-over:
 *   each module's <script src> moves to VerificationModal.js when that module
 *   is next edited. From now on ALL changes go in this file only;
 *   VerificationModal_V1_0.js is frozen and is deleted once nothing
 *   references it (search the repo for VerificationModal_V1_0). Sessions are
 *   unaffected by the rename (session keys do not depend on the filename).
 *   The Netlify relay netlify/functions/otp-relay.mjs is unchanged and is
 *   shared by both files.
 * - Oct 2026 (relay): the three OTP calls (sendVerificationCode,
 *   checkVerificationStatus, verifyCode) now go through the Netlify
 *   Function /.netlify/functions/otp-relay (same origin, plain fetch POST)
 *   instead of browser JSONP. Reason: the 3 Oct logs showed the server
 *   finishing in 1-3s while the reply never reached the browser (echo URL
 *   404 / nosniff on an HTML error page), so each failure cost a full 10s
 *   browser timeout. The relay calls ManagementCentral server-side, spots a
 *   bad reply in about a second and retries there. Behaviour kept from
 *   before: send is made once per press of Send with one requestId and is
 *   never repeated blindly; after a lost reply the modal asks the server
 *   (checkVerificationStatus) what happened. New: if the server shows NO
 *   trace of the send after 9s, the send is repeated ONCE with the SAME
 *   requestId (safe -- ManagementCentral V1.5.6 ignores a duplicate), and a
 *   reply of emailStatus 'pending' is waited out via status checks instead
 *   of being treated as sent. verifyCode: up to two relay calls; if the
 *   relay is unreachable or gives no answer twice, falls back to the old
 *   browser path with ONE retry (kept short so everything stays inside the
 *   backend's 60s re-confirm window). If the relay itself is unreachable
 *   (not deployed, offline, rejected input) every call falls back to the
 *   previous direct browser JSONP behaviour, so this change cannot be worse
 *   than before. Kill switch: set USE_RELAY to false below. Requires
 *   ManagementCentral V1.5.6 and netlify/functions/otp-relay.mjs V1.0.0.
 *   Text-only UI change: the Verify button reads 'Still verifying...' after
 *   6s. Still does NOT use ApiClient.js (shared by ~15+ pages, not all of
 *   which load it).
 * - Oct 2026: _sendCode() no longer re-sends on its own. The 3 Oct
 *   Executions log showed every duplicate verification email was one of
 *   this file's automatic retries (10s timeout + 2s pause = runs exactly
 *   12s apart), each firing a full server-side send, while the first send
 *   was often still running (32s cold-start run) with the email already
 *   delivered -- hence "code arrived but screen stuck on Sending". Now:
 *   the send request is made ONCE (45s ceiling, never repeated). If no
 *   reply has arrived after 15s the modal stops guessing and asks the
 *   server what happened via the new read-only checkVerificationStatus
 *   action (every 4s; read-only, sends nothing, never returns the code):
 *   'sent' -> carry on to code entry; 'failed' -> say so and let the user
 *   try again; 'pending'/'none' -> keep waiting. If still unconfirmed at
 *   45s the message tells the user to check their email before pressing
 *   Send again. A genuine second send is now only ever the user's own
 *   action. verifyCode keeps its existing retry (_callAPI) unchanged --
 *   the backend already treats a repeat within 60s as a re-confirmation.
 *   Requires ManagementCentral V1.5.5 or later (EmailStatus column,
 *   no-re-email on a live code, checkVerificationStatus). Deliberately
 *   does NOT use ApiClient.js: this file is shared by ~15+ modules by
 *   filename and not every one of them loads ApiClient.js, so a dependency
 *   here would break the pages that don't.
 * - Oct 2026 (later): each press of Send now carries a unique requestId
 *   to sendVerificationCode. ManagementCentral V1.5.6 stores it and ignores
 *   any later request bearing the same id, so a re-delivered copy of the
 *   same click can no longer create a second code (seen 3 Oct 14:29: one
 *   send call from the page, two codes on the server). Requires V1.5.6;
 *   against V1.5.5 the extra parameter is simply ignored.
 * - Sep 2026: _callAPI() gets retry-with-backoff (3 retries, 10s timeout,
 *   2s delay) -- previously the only JSONP caller anywhere in this system
 *   with none at all, despite being the single most-used path (every
 *   resident and Zone Rep, every session). Timeout deliberately shorter
 *   than the 30s used elsewhere (ReportsHub, DesktopExplorer): those read
 *   a large, growing sheet, where 30s is a defensible worst case; this
 *   file's two calls are trivial VerificationCodes lookups that should
 *   answer in under a second, so a live test (Tony) showing a real
 *   verifyCode retry only firing at the 30s mark -- "that took far too
 *   long to verify" -- meant the wait itself was closer to the whole
 *   problem than the retry logic was. Safe to add only because of
 *   two companion fixes in ManagementCentral V1.5.3: sendVerificationCode
 *   now retries its own call to NotificationServer server-side (a
 *   captured case showed the UI reporting "Failed to send verification
 *   code via email" while the email had genuinely arrived -- the
 *   response back from NotificationServer was corrupted in transit, the
 *   same Apps-Script echo/redirect flakiness seen from browsers all
 *   week, now confirmed happening server-to-server too), and verifyCode
 *   now treats a resubmission of a code marked used within the last 60s
 *   as a successful re-confirmation rather than "invalid code" -- which
 *   is exactly what a naive retry here would otherwise have triggered
 *   right after a real success. No dead-response fail-fast (onload fires
 *   without the callback running) added -- every real failure actually
 *   observed in this system fires onerror or the timeout directly, and
 *   ReportsHub V1.1.21 removed that same mechanism for the same reason.
 * - Aug 2026: show() fixed to always reset the modal to step 1
 *   (identifier entry), clear any leftover expiry/resend timers, AND
 *   clear step 2's own stale state (code input value, error message,
 *   Verify button re-disabled). Previously, re-showing the modal after
 *   a prior incomplete attempt reached step 2 (code entry) left it
 *   stuck on that stale screen -- affected every module's "Try Again"/
 *   reVerify pattern after Access Denied (clearVerification() + show(),
 *   no reset at all). First found via RelationsChronicle.html/
 *   RelationsManager.html's identically-broken "Try Again", both
 *   without either module touching this file -- root cause was here,
 *   not per-module, so this fixes all ~15+ consumers at once. Follow-up
 *   round caught by Tony testing the first fix: the step-visibility
 *   reset alone didn't clear vmCodeInput's actual DOM value, so a fresh
 *   code request could still land on step 2 with the previous attempt's
 *   6 digits still populated (worked if manually overwritten, but
 *   shouldn't have needed to be). No legitimate prior behaviour relied
 *   on any of this stale state surviving a re-show -- already-verified
 *   sessions are handled entirely separately via init()'s storage
 *   check, never through show() -- so this is a strict bug fix with no
 *   functional trade-off for any caller.
 * - Aug 2026: Optional persistent session support added -- new config
 *   options storageType ('session' [default, unchanged] or 'local') and
 *   expiryDays (only meaningful when storageType is 'local'; omit/null
 *   for no expiry). When storageType is 'local', the verified session
 *   survives sessionStorage being cleared by iOS backgrounding a tab
 *   (root cause of Field Ops staff being repeatedly dropped back to the
 *   OTP prompt during the working day). Every existing caller is
 *   unaffected -- default storageType remains 'session', identical
 *   behaviour to before this change. First (only, at introduction)
 *   consumer: FieldOperationsPortal.html / MaintenanceModule.html,
 *   storageType 'local', expiryDays 30.
 * - Aug 2026: System-wide JSONP audit fix -- _callAPI() had the same
 *   compounding bug found across most of the system: weak
 *   `if (window[cb])` timeout check (not a true settled-guard), so
 *   success/onerror/timeout could race each other, and a genuinely
 *   late cold-start response could throw "cb_... is not defined" or,
 *   worse, a second removeChild() error. Highest-leverage fix in the
 *   whole sweep given this file underpins OTP verification for ~15+
 *   modules. Also corrected stale "Design System v1.4" header label --
 *   actual CSS confirmed current (2px corners, backdrop-filter). No
 *   functional change to verification flow.
 * - Aug 2026: userData now also includes email and phone. ManagementCentral's
 *   verifyCode() already looked these up from the UnitList sheet during OTP
 *   verification (via lookupResidentByIdentifier) but never returned them --
 *   purely additive change, both fields are simply carried through from the
 *   existing backend response into userData and session storage. Existing
 *   modules that only read name/unit/roleTags are unaffected; modules can
 *   opt in to using userData.email / userData.phone where useful. Requires
 *   ManagementCentral V1.5 or later on the backend for these fields to
 *   actually be populated.
 *
 * USAGE:
 * 1. Include in HTML: <script src="VerificationModal.js"></script>
 * 2. Initialize: VerificationModal.init({ ... })
 * 3. Show if needed: if (!alreadyVerified) VerificationModal.show();
 * 4. Log Out: VerificationModal.logout()  (or clearVerification() then show())
 *
 * EXAMPLE:
 * const verified = VerificationModal.init({
 *     moduleName: 'Document Library',
 *     moduleIcon: '📚',
 *     sessionKey: 'lakeIllawongVerified',
 *     onSuccess: (userData) => {
 *         console.log('User verified:', userData);
 *         loadContent(userData.roleTags);
 *         // userData.email / userData.phone also available (see Change Log)
 *     }
 * });
 * if (!verified) VerificationModal.show();
 * =====================================================================
 */

const VerificationModal = (function() {
    // Configuration
    const MGMT_CENTRAL_URL = 'https://script.google.com/macros/s/AKfycbzVF25ss7kEmhE42Sf-i_vpLIL1FpTe2AjNeb0b8MqP_eBXAxV9ghWcuwe25hdEuqBFjw/exec';

    let config = {
        moduleName: 'Module',
        moduleIcon: '🔐',
        sessionKey: 'verified',
        useSessionStorage: true,
        storageType: 'session', // 'session' (default, unchanged) or 'local' for a persistent session
        expiryDays: null,       // only used when storageType is 'local'; null/omitted = no expiry
        smsOnly: false,
        onSuccess: null
    };

    let verificationData = {
        method: null,
        identifier: null,
        verificationId: null
    };

    // V Oct 2026: send handling -- see change log
    const SEND_QUIET_MS = 15000;    // no reply by now -> start asking the server what happened
    const SEND_CEILING_MS = 45000;  // stop waiting entirely
    const STATUS_POLL_MS = 4000;    // how often to ask while waiting
    const RESEND_AFTER_MS = 9000;   // server shows no trace of the send by now -> repeat it once (same requestId)
    let sendToken = 0;              // bumped by show()/hide() so a stale send can't touch the UI

    // Oct 2026 (relay): OTP calls go via the Netlify Function; see change log.
    const USE_RELAY = true;                          // false = previous direct browser-JSONP behaviour
    const RELAY_URL = '/.netlify/functions/otp-relay';
    const RELAY_TIMEOUT_MS = 13000;                  // the relay's own budget is ~8.5s

    // Nov 2026 (warm-up): see change log. false = no warm-up call.
    const USE_WARMUP = true;
    const WARMUP_IDENTIFIER = 'warmup@lakeillawong.invalid';
    let warmUpDone = false;

    // Nov 2026 (V2.2.0, shared session): see change log.
    const SHARED_KEY = 'lakeIllawongSession';   // one session for every portal (localStorage)
    const SLIDE_DAYS = 90;                      // sliding lifetime (V2.3.0: was 30)
    const CAP_DAYS = 365;                       // hard cap from the original verification (V2.3.0: was 90)
    const DAY_MS = 24 * 60 * 60 * 1000;
    // Every per-portal key used anywhere in the system (cleared on log out)
    const LEGACY_KEYS = [
        'lakeIllawongVerified',
        'portalAdminVerified',
        'portalZoneRepVerified',
        'portalFieldOpsVerified',
        'portalSysAdminVerified',
        'periodicReportsVerified'
    ];
    const LEGACY_SUFFIXES = ['', '_name', '_unit', '_roles', '_identifier', '_email', '_phone', '_expires'];
    let sharedUsable = null;                    // null = not tested yet

    // Nov 2026 (V2.4.0, module access log): see change log. false = no logging.
    const USE_ACCESS_LOG = true;
    const MODULE_LOG_KEY = 'lakeIllawongModuleLog';
    const SELF_LOGGING = ['Operations Portal', 'Zone Rep Portal'];   // V2.7.0: pages that write their own Portal-Login row
    const logInFlight = {};   // V2.6.0: key -> true while a log send is awaiting its reply

    let modalInjected = false;
    let expiryTimerInterval = null;
    let resendTimerInterval = null;

    // Which Web Storage object backs this session -- 'local' persists across
    // sessionStorage being cleared (e.g. iOS reclaiming a backgrounded tab);
    // 'session' (default) is the original, unchanged behaviour.
    // From V2.2.0 this is the store for the per-portal (old) keys that are
    // mirrored for pages that read them directly.
    function _getStore() {
        return config.storageType === 'local' ? localStorage : sessionStorage;
    }

    // ---------------------------------------------------------------
    // V2.2.0: shared session
    // ---------------------------------------------------------------

    // Can localStorage be used? (blocked / full storage -> false -> V2.1.0 behaviour)
    function _sharedOk() {
        if (sharedUsable !== null) return sharedUsable;
        try {
            const probe = '__vmProbe';
            localStorage.setItem(probe, '1');
            localStorage.removeItem(probe);
            sharedUsable = true;
        } catch (e) {
            sharedUsable = false;
        }
        return sharedUsable;
    }

    // Returns the shared session if there is one that is still valid, else null.
    // An expired (sliding or 365-day cap) session is cleared everywhere here.
    function _readShared() {
        if (!_sharedOk()) return null;
        let raw = null;
        try { raw = localStorage.getItem(SHARED_KEY); } catch (e) { return null; }
        if (!raw) return null;

        let s = null;
        try { s = JSON.parse(raw); } catch (e) { s = null; }
        if (!s || typeof s !== 'object' || !s.verifiedAt || !s.expiresAt || !Array.isArray(s.roleTags)) {
            try { localStorage.removeItem(SHARED_KEY); } catch (e) {}
            return null;
        }

        const now = Date.now();
        if (now > s.expiresAt || now > s.verifiedAt + CAP_DAYS * DAY_MS) {
            clearVerification();
            return null;
        }
        return s;
    }

    function _writeShared(s) {
        try {
            localStorage.setItem(SHARED_KEY, JSON.stringify(s));
            return true;
        } catch (e) {
            return false;
        }
    }

    // Push the sliding expiry out to 90 days from now, never past the 365-day cap.
    function _slide(s) {
        const now = Date.now();
        s.expiresAt = Math.min(now + SLIDE_DAYS * DAY_MS, s.verifiedAt + CAP_DAYS * DAY_MS);
        _writeShared(s);
    }

    // Write this page's old per-portal keys (same store, same names as before)
    // so pages that read them directly keep working.
    function _mirrorLegacy(s) {
        try {
            const store = _getStore();
            const key = config.sessionKey;
            const txt = function(v) { return v === undefined || v === null ? '' : String(v); };
            store.setItem(key, 'true');
            store.setItem(key + '_name', txt(s.name));
            store.setItem(key + '_unit', txt(s.unit));
            store.setItem(key + '_roles', JSON.stringify(s.roleTags || []));
            store.setItem(key + '_identifier', txt(s.identifier));
            store.setItem(key + '_email', txt(s.email));
            store.setItem(key + '_phone', txt(s.phone));
            if (config.storageType === 'local') {
                store.setItem(key + '_expires', String(s.expiresAt));
            }
        } catch (e) {
            // storage blocked: nothing more can be done here
        }
    }

    // Remove every per-portal key (all known keys + this page's own), both stores.
    function _clearLegacy() {
        const keys = LEGACY_KEYS.slice();
        if (config.sessionKey && keys.indexOf(config.sessionKey) === -1) keys.push(config.sessionKey);
        [function() { return sessionStorage; }, function() { return localStorage; }].forEach(function(getStore) {
            try {
                const store = getStore();
                keys.forEach(function(k) {
                    LEGACY_SUFFIXES.forEach(function(suffix) { store.removeItem(k + suffix); });
                });
            } catch (e) {}
        });
    }

    // V2.5.0: the log detail names the portal the module was opened from, when
    // the page was opened with ?portal=... (e.g. "Desktop Explorer (Operations
    // Portal)"). The once-a-day record is kept per detail, so a module used from
    // two portals is logged once for each, not once in total.
    function _logDetail(moduleName) {
        try {
            const p = new URLSearchParams(window.location.search).get('portal');
            if (!p) return moduleName;
            const labels = { operations: 'Operations Portal', zonerep: 'Zone Rep Portal', residents: 'Resident Portal' };
            return moduleName + ' (' + (labels[p.toLowerCase()] || p) + ')';
        } catch (e) { return moduleName; }
    }

    // V2.4.0: record that this person opened this module (once per person,
    // module, device and calendar day). Fire-and-forget; never throws.
    function _logModuleAccess(userData) {
        try {
            if (!USE_ACCESS_LOG || !userData || !userData.name) return;
            if (SELF_LOGGING.indexOf(config.moduleName) !== -1) return;
            const moduleName = _logDetail(config.moduleName || document.title || 'Module');
            const d = new Date();
            const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            const key = userData.name + '|' + moduleName;
            // V2.6.0: the once-a-day record is only written AFTER the server has
            // confirmed the row, so a lost send is tried again on the next open.
            if (logInFlight[key]) return;   // a send for this module is already on its way
            if (_sharedOk()) {
                let seen = {};
                try { seen = JSON.parse(localStorage.getItem(MODULE_LOG_KEY) || '{}') || {}; } catch (e) { seen = {}; }
                if (seen[key] === today) return;
            }
            logInFlight[key] = true;
            _callOnce('logAccess', {
                type: 'Module-Access',
                name: userData.name,
                unit: userData.unit || '',
                detail: moduleName
            }, 15000).then(function (r) {
                logInFlight[key] = false;
                if (!r || !r.success || !_sharedOk()) return;
                let seen = {};
                try { seen = JSON.parse(localStorage.getItem(MODULE_LOG_KEY) || '{}') || {}; } catch (e) { seen = {}; }
                // keep only today's entries so the record stays tiny
                Object.keys(seen).forEach(function (k) { if (seen[k] !== today) delete seen[k]; });
                seen[key] = today;
                try { localStorage.setItem(MODULE_LOG_KEY, JSON.stringify(seen)); } catch (e) {}
            }, function () { logInFlight[key] = false; });
        } catch (e) {
            // logging must never affect the page
        }
    }

    // Initialize
    function init(options) {
        config = { ...config, ...options };

        // Check if already verified
        if (config.useSessionStorage && isVerified()) {
            const userData = getStoredUserData();
            _logModuleAccess(userData);
            if (config.onSuccess && userData) {
                setTimeout(() => config.onSuccess(userData), 0);
            }
            return true; // Already verified
        }

        return false; // Need to verify
    }

    // Nov 2026 (warm-up): quiet read-only ping so the relay + ManagementCentral are
    // awake before the first real send. Fire-and-forget; never throws, never
    // touches the UI, once per page load.
    function _warmUp() {
        if (!USE_WARMUP || !USE_RELAY || warmUpDone) return;
        warmUpDone = true;
        const params = { method: 'email', identifier: WARMUP_IDENTIFIER };
        _relayCall('checkVerificationStatus', params, 6000).then(
            function () { console.log('Warm-up ping answered'); },
            function () {
                // A timed-out request still wakes the backend; one more try shortly after.
                setTimeout(function () {
                    _relayCall('checkVerificationStatus', params, 6000).catch(function () {});
                }, 2000);
            }
        );
    }

    // Show modal
    function show() {
        _warmUp();
        if (!modalInjected) {
            injectModal();
            modalInjected = true;
        }
        // Always reset to step 1 (identifier entry) when the modal is
        // shown. Without this, re-showing the modal after a previous
        // incomplete attempt reached step 2 (code entry) -- e.g. a
        // module's "Try Again" button after Access Denied, calling
        // clearVerification() then show() -- left the modal stuck
        // displaying the stale code-entry screen instead of starting
        // over. There's no legitimate case where resuming mid-code-
        // entry from a prior attempt is correct: already-verified
        // sessions are handled entirely separately via init()'s storage
        // check, never through show(). Found via RelationsChronicle.html
        // and confirmed identically broken in RelationsManager.html's
        // own "Try Again" -- both call this same show(), so the defect
        // was here, not in either module. Also clears any leftover
        // expiry/resend timers from that prior attempt (same cleanup
        // hide() already does), so a stale countdown can't fire against
        // step 2's elements once it's reached again.
        if (expiryTimerInterval) { clearInterval(expiryTimerInterval); expiryTimerInterval = null; }
        if (resendTimerInterval) { clearInterval(resendTimerInterval); resendTimerInterval = null; }
        sendToken++;   // abandon any send still in flight from a previous attempt
        const sendBtnEl = document.getElementById('vmSendBtn');
        if (sendBtnEl) { sendBtnEl.textContent = 'Send Verification Code →'; _validateStep1(); }
        const step1El = document.getElementById('vmStep1');
        const step2El = document.getElementById('vmStep2');
        if (step1El && step2El) {
            step2El.classList.remove('active');
            step1El.classList.add('active');
        }
        // Step reset above only controls which step is *visible* -- the
        // code input's DOM value survives that untouched, so a fresh
        // code request could still land on step 2 with the previous
        // attempt's 6 digits still sitting in the field (Tony: "the
        // previous code is there" -- works if overwritten, but
        // shouldn't need to be). Clear the stale value, error message,
        // and re-disable Verify to match the now-empty field.
        const codeInputEl = document.getElementById('vmCodeInput');
        const error2El    = document.getElementById('vmError2');
        const verifyBtnEl = document.getElementById('vmVerifyBtn');
        if (codeInputEl) codeInputEl.value = '';
        if (error2El) { error2El.classList.add('hidden'); error2El.textContent = ''; }
        if (verifyBtnEl) verifyBtnEl.disabled = true;
        if (config.smsOnly) {
            const emailOption = document.getElementById('vmEmailOption');
            if (emailOption) emailOption.style.display = 'none';
            _selectMethod('sms');
        }
        document.getElementById('vmModal').classList.add('active');
    }

    // Hide modal
    function hide() {
        sendToken++;   // abandon any send still in flight
        // Clear all timers
        if (expiryTimerInterval) {
            clearInterval(expiryTimerInterval);
            expiryTimerInterval = null;
        }
        if (resendTimerInterval) {
            clearInterval(resendTimerInterval);
            resendTimerInterval = null;
        }

        const modal = document.getElementById('vmModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // V2.1.0 per-page check, used only when localStorage cannot be used.
    function _legacyIsVerified() {
        const store = _getStore();

        if (store.getItem(config.sessionKey) !== 'true') return false;

        // Persistent sessions with an expiry: check it, and clear+fail if past.
        if (config.storageType === 'local' && config.expiryDays) {
            const expiresAt = parseInt(store.getItem(config.sessionKey + '_expires'), 10);
            if (!expiresAt || Date.now() > expiresAt) {
                clearVerification();
                return false;
            }
        }

        return true;
    }

    // Check if verified. V2.2.0: reads the shared session; when it is valid the
    // sliding expiry is renewed and this page's old keys are refreshed.
    function isVerified() {
        if (!config.useSessionStorage) return false;
        if (!_sharedOk()) return _legacyIsVerified();

        const s = _readShared();
        if (!s) return false;

        _slide(s);
        _mirrorLegacy(s);
        return true;
    }

    // Get stored user data
    function getStoredUserData() {
        if (!config.useSessionStorage) return null;

        if (!_sharedOk()) {
            const store = _getStore();

            const name = store.getItem(config.sessionKey + '_name');
            const unit = store.getItem(config.sessionKey + '_unit');
            const roles = store.getItem(config.sessionKey + '_roles');
            const email = store.getItem(config.sessionKey + '_email');
            const phone = store.getItem(config.sessionKey + '_phone');

            if (!roles) return null;

            return {
                name: name,
                unit: unit,
                roleTags: JSON.parse(roles),
                email: email || '',
                phone: phone || ''
            };
        }

        const s = _readShared();
        if (!s) return null;

        return {
            name: s.name,
            unit: s.unit,
            roleTags: s.roleTags,
            email: s.email || '',
            phone: s.phone || ''
        };
    }

    // Store user data (a new verification: starts a fresh 90-day / 365-day clock)
    function storeUserData(userData) {
        if (!config.useSessionStorage) return;

        const now = Date.now();
        const s = {
            v: 1,
            name: userData.name,
            unit: userData.unit,
            roleTags: userData.roleTags,
            email: userData.email || '',
            phone: userData.phone || '',
            identifier: verificationData.identifier,
            verifiedAt: now,
            expiresAt: now + SLIDE_DAYS * DAY_MS
        };

        if (_sharedOk()) _writeShared(s);
        _mirrorLegacy(s);
    }

    // Clear verification: the shared session AND every per-portal key, so the
    // next page load cannot sign the person straight back in (see V2.2.0 notes).
    function clearVerification() {
        try { localStorage.removeItem(SHARED_KEY); } catch (e) {}
        _clearLegacy();
        verificationData = { method: null, identifier: null, verificationId: null };
    }

    // Log out of every portal; optionally go somewhere afterwards.
    function logout(redirectUrl) {
        clearVerification();
        hide();
        if (redirectUrl) window.location.href = redirectUrl;
    }

    // Role check (V2.2.1). Read-only: see the change log.
    function checkAccess(allowedRoles) {
        const user = getStoredUserData();
        if (!user) return { ok: false, reason: 'not-signed-in', user: null };
        const tags = Array.isArray(user.roleTags) ? user.roleTags : [];
        if (tags.indexOf('Developer') !== -1) return { ok: true, reason: null, user: user };
        if (allowedRoles === undefined || allowedRoles === null ||
            (Array.isArray(allowedRoles) && allowedRoles.length === 0)) {
            return { ok: true, reason: null, user: user };
        }
        // Anything that is not a list (e.g. a string by mistake) is refused, never opened.
        if (!Array.isArray(allowedRoles)) return { ok: false, reason: 'no-role', user: user };
        const has = allowedRoles.some(function (r) { return tags.indexOf(r) !== -1; });
        return has ? { ok: true, reason: null, user: user }
                   : { ok: false, reason: 'no-role', user: user };
    }

    // Inject modal HTML and CSS
    function injectModal() {
        const modalHTML = `
<style>
/* Verification Modal Styles - Matching Field Operations Portal Glass Effect */
#vmModal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, #1e40af 0%, #1e3a8a 100%);
    z-index: 10000;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

#vmModal.active {
    display: flex;
}

.vm-content {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 2px;
    padding: 40px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
}

.vm-header {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.vm-header-icon {
    font-size: 3rem;
    margin-bottom: 15px;
}

.vm-title {
    font-size: 2rem;
    color: white;
    font-weight: 600;
    margin: 0 0 8px 0;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
}

.vm-subtitle {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.95rem;
    font-weight: 500;
    margin: 0;
}

.vm-step {
    display: none;
}

.vm-step.active {
    display: block;
}

.vm-method-choice {
    margin-bottom: 25px;
}

.vm-method-option {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 18px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.vm-method-option:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
}

.vm-method-option.selected {
    background: rgba(255, 255, 255, 0.25);
    border-color: white;
    border-width: 2px;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.3);
}

.vm-method-option input[type="radio"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
    accent-color: white;
}

.vm-method-label {
    flex: 1;
}

.vm-method-title {
    font-weight: 600;
    color: white;
    margin-bottom: 8px;
    font-size: 1rem;
}

.vm-method-input {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 2px;
    font-size: 0.95rem;
    transition: border-color 0.2s ease;
    color: #1e293b;
    background: rgba(255, 255, 255, 0.9);
    box-sizing: border-box;
    caret-color: #1e293b;
}

.vm-method-input::placeholder {
    color: #94a3b8;
}

.vm-method-input:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.15);
}

.vm-error {
    background: rgba(239, 68, 68, 0.15);
    border-left: 3px solid rgba(239, 68, 68, 0.6);
    color: rgba(255, 255, 255, 0.9);
    padding: 12px 16px;
    margin-bottom: 20px;
    font-size: 0.9rem;
    border-radius: 2px;
}

.vm-error.hidden {
    display: none;
}

.vm-info {
    background: rgba(14, 165, 233, 0.15);
    border-left: 3px solid rgba(14, 165, 233, 0.6);
    color: rgba(255, 255, 255, 0.9);
    padding: 12px 16px;
    margin-bottom: 20px;
    font-size: 0.9rem;
    border-radius: 2px;
    line-height: 1.5;
}

.vm-btn {
    width: 100%;
    padding: 12px;
    background: rgba(255, 255, 255, 0.15);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 10px;
    backdrop-filter: blur(10px);
}

.vm-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
}

.vm-btn:disabled {
    background: rgba(255, 255, 255, 0.1);
    cursor: not-allowed;
}

.vm-code-group {
    margin-bottom: 25px;
}

.vm-code-group label {
    display: block;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 6px;
    font-size: 0.9rem;
}

.vm-code-input {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    font-size: 1.5rem;
    text-align: center;
    letter-spacing: 12px;
    font-weight: 600;
    transition: border-color 0.2s ease;
    color: white;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    box-sizing: border-box;
}

.vm-code-input::placeholder {
    color: rgba(255, 255, 255, 0.6);
}

.vm-code-input:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.15);
}

.vm-timer {
    text-align: center;
    margin-bottom: 20px;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.8);
}

.vm-countdown {
    font-weight: 600;
    color: white;
}

.vm-resend {
    text-align: center;
    margin-top: 20px;
}

.vm-resend p {
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 8px;
    font-size: 0.9rem;
}

.vm-resend-btn {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.9);
    text-decoration: underline;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
}

.vm-resend-btn:hover:not(:disabled) {
    color: white;
}

.vm-resend-btn:disabled {
    color: rgba(255, 255, 255, 0.5);
    cursor: not-allowed;
}

.vm-text-muted {
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 20px;
    font-size: 0.9rem;
}

/* Scrollbar styling */
.vm-content::-webkit-scrollbar {
    width: 6px;
}

.vm-content::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
}

.vm-content::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
}

.vm-content::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
}

/* Mobile responsive */
@media (max-width: 480px) {
    .vm-content {
        padding: 30px 20px;
    }

    .vm-title {
        font-size: 1.5rem;
    }

    .vm-code-input {
        font-size: 1.2rem;
        letter-spacing: 8px;
    }
}
</style>

<div id="vmModal">
    <div class="vm-content">
        <!-- Step 1: Choose Method -->
        <div id="vmStep1" class="vm-step active">
            <div class="vm-header">
                <div class="vm-header-icon" id="vmIcon"></div>
                <div class="vm-title" id="vmTitle"></div>
                <div class="vm-subtitle">Verify your identity to access</div>
            </div>

            <div class="vm-info">
                🔒 For your security, please verify your identity using your ${config.smsOnly ? 'mobile number' : 'email address or mobile number'}.
            </div>

            <div class="vm-info" id="vmStayNote">
                You'll stay signed in on this device. Not your device? Log out when finished.
            </div>

            <div id="vmError1" class="vm-error hidden"></div>

            <p class="vm-text-muted">Choose how you'd like to receive your verification code:</p>

            <div class="vm-method-choice">
               <div class="vm-method-option" id="vmEmailOption" onclick="VerificationModal._selectMethod('email')">
                    <input type="radio" name="vmMethod" value="email" id="vmEmailRadio" onclick="event.stopPropagation(); VerificationModal._selectMethod('email')">
                    <div class="vm-method-label">
                        <div class="vm-method-title">📧 Email</div>
                        <input type="email"
                               id="vmEmailInput"
                               class="vm-method-input"
                               placeholder="Enter your email address"
                               onclick="event.stopPropagation(); VerificationModal._selectMethod('email')"
                               oninput="VerificationModal._validateStep1()">
                    </div>
                </div>

                <div class="vm-method-option" onclick="VerificationModal._selectMethod('sms')">
                    <input type="radio" name="vmMethod" value="sms" id="vmSmsRadio" onclick="event.stopPropagation(); VerificationModal._selectMethod('sms')">
                    <div class="vm-method-label">
                        <div class="vm-method-title">📱 SMS</div>
                        <input type="tel"
                               id="vmPhoneInput"
                               class="vm-method-input"
                               placeholder="Enter your mobile number"
                               onclick="event.stopPropagation(); VerificationModal._selectMethod('sms')"
                               oninput="VerificationModal._validateStep1()">
                    </div>
                </div>
            </div>

            <button id="vmSendBtn" class="vm-btn" onclick="VerificationModal._sendCode()" disabled>
                Send Verification Code →
            </button>
        </div>

        <!-- Step 2: Enter Code -->
        <div id="vmStep2" class="vm-step">
            <div class="vm-header">
                <div class="vm-header-icon">✉️</div>
                <div class="vm-title">Enter Verification Code</div>
                <div class="vm-subtitle" id="vmSentTo"></div>
            </div>

            <div id="vmError2" class="vm-error hidden"></div>

            <div class="vm-code-group">
                <label>6-Digit Code</label>
                <input type="text"
                       id="vmCodeInput"
                       class="vm-code-input"
                       maxlength="6"
                       placeholder="000000"
                       oninput="VerificationModal._validateCode()">
            </div>

            <div class="vm-timer">
                Code expires in: <span class="vm-countdown" id="vmExpiry">10:00</span>
            </div>

            <button id="vmVerifyBtn" class="vm-btn" onclick="VerificationModal._verifyCode()" disabled>
                Verify →
            </button>

            <div class="vm-resend">
                <p style="color: #666; margin-bottom: 8px;">Didn't receive the code?</p>
                <button id="vmResendBtn" class="vm-resend-btn" onclick="VerificationModal._resend()" disabled>
                    Resend code (<span id="vmResendTimer">60</span>s)
                </button>
            </div>
        </div>
    </div>
</div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Set module-specific content
        document.getElementById('vmIcon').textContent = config.moduleIcon;
        document.getElementById('vmTitle').textContent = config.moduleName;
    }

    // Select verification method
    function _selectMethod(method) {
        document.getElementById('vmEmailRadio').checked = (method === 'email');
        document.getElementById('vmSmsRadio').checked = (method === 'sms');

        const options = document.querySelectorAll('.vm-method-option');
        options[0].classList.toggle('selected', method === 'email');
        options[1].classList.toggle('selected', method === 'sms');

        // Only auto-focus on desktop - on mobile this triggers keyboard and distorts layout
        if (window.innerWidth > 480) {
            if (method === 'email') {
                document.getElementById('vmEmailInput').focus();
            } else {
                document.getElementById('vmPhoneInput').focus();
            }
        }

        _validateStep1();
    }

    // Validate step 1
    function _validateStep1() {
        const method = document.querySelector('input[name="vmMethod"]:checked')?.value;
        const identifier = method === 'email' ?
            document.getElementById('vmEmailInput').value.trim() :
            document.getElementById('vmPhoneInput').value.trim();

        document.getElementById('vmSendBtn').disabled = !identifier;
    }

    // Send verification code
    async function _sendCode() {
        const method = document.querySelector('input[name="vmMethod"]:checked').value;
        const identifier = method === 'email' ?
            document.getElementById('vmEmailInput').value.trim() :
            document.getElementById('vmPhoneInput').value.trim();

        const errorEl = document.getElementById('vmError1');
        const btn = document.getElementById('vmSendBtn');

        errorEl.classList.add('hidden');

        if (!identifier) {
            errorEl.textContent = `Please enter your ${method === 'email' ? 'email address' : 'mobile number'}`;
            errorEl.classList.remove('hidden');
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Sending...';

        const token = ++sendToken;
        const isCurrent = () => token === sendToken;

        try {
            const requestId = 'r' + Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
            const outcome = await _sendWithStatusCheck(method, identifier, isCurrent, requestId);
            if (!isCurrent()) return;

            if (outcome.success) {
                verificationData = { method, identifier, verificationId: outcome.verificationId };

                // Show step 2
                document.getElementById('vmStep1').classList.remove('active');
                document.getElementById('vmStep2').classList.add('active');

                // Update subtitle
                document.getElementById('vmSentTo').textContent =
                    `Code sent to: ${_maskIdentifier(identifier, method)}`;

                // Start timers
                _startExpiryTimer();
                _startResendTimer();
            } else {
                errorEl.textContent = outcome.error || 'Failed to send code. Please try again.';
                errorEl.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Send code error:', error);
            if (!isCurrent()) return;
            errorEl.textContent = 'Connection error. Please try again.';
            errorEl.classList.remove('hidden');
        } finally {
            if (isCurrent()) {
                btn.disabled = false;
                btn.textContent = 'Send Verification Code →';
            }
        }
    }

    // Oct 2026: sends the code request exactly ONCE per press and never
    // repeats it blindly. If the reply is slow or lost, asks the server
    // (read-only) what became of it. Only if the server shows NO trace of the
    // send after RESEND_AFTER_MS is it repeated -- once, with the SAME
    // requestId, which ManagementCentral V1.5.6 ignores if it has already
    // seen it, so a repeat can never email a second code. Resolves
    // { success, verificationId } or { success:false, error }.
    function _sendWithStatusCheck(method, identifier, isCurrent, requestId) {
        return new Promise((resolve) => {
            const startedAt = Date.now();
            let done = false;
            let polling = false;
            let statusInFlight = false;
            let resent = false;
            let quietTimer = null;
            let ceilingTimer = null;
            let pollTimer = null;

            function finish(result) {
                if (done) return;
                done = true;
                clearTimeout(quietTimer);
                clearTimeout(ceilingTimer);
                clearInterval(pollTimer);
                resolve(result);
            }

            const UNCONFIRMED = 'We could not confirm the code was sent. Please check your email (and spam folder) first -- if nothing arrives within a minute, press Send again.';

            // A reply to the send request (the original, or the one safe repeat).
            function handleSendReply(r) {
                if (done) return;
                if (r && r.success) {
                    if (r.emailStatus === 'pending') {
                        // The server is still emailing this code: wait for 'sent'
                        // via the status check rather than reporting success early.
                        startPolling();
                        return;
                    }
                    finish({ success: true, verificationId: r.verificationId });
                } else {
                    finish({ success: false, error: (r && r.error) || 'Failed to send code. Please try again.' });
                }
            }

            // The server shows no trace of this send: repeat it once, same requestId.
            function resendOnce() {
                if (resent || done) return;
                resent = true;
                console.warn('No trace of the send on the server -- repeating it once with the same requestId');
                _transport('sendVerificationCode', { method, identifier, requestId }, SEND_CEILING_MS)
                    .then(handleSendReply)
                    .catch(() => { /* status polling carries on */ });
            }

            // Ask the server what happened. final=true is the last look before giving up.
            function checkStatus(final) {
                if (done) return;
                if (!isCurrent()) { finish({ success: false, error: '' }); return; }
                if (statusInFlight && !final) return;
                statusInFlight = true;
                _transport('checkVerificationStatus', { method, identifier }, 10000)
                    .then((r) => {
                        statusInFlight = false;
                        if (done) return;
                        if (r && r.success) {
                            if (r.state === 'sent') {
                                finish({ success: true, verificationId: r.verificationId });
                                return;
                            }
                            // Only believe 'failed' if that code was created since THIS click --
                            // an older failed row must not mask a send that is still in progress.
                            const elapsedSec = (Date.now() - startedAt) / 1000;
                            if (r.state === 'failed' && r.ageSeconds <= elapsedSec + 2) {
                                finish({ success: false, error: 'The code could not be sent. Please try again.' });
                                return;
                            }
                            if (r.state === 'none' && !resent && (Date.now() - startedAt) >= RESEND_AFTER_MS) {
                                resendOnce();
                            }
                        }
                        if (final) finish({ success: false, error: UNCONFIRMED });
                    })
                    .catch(() => {
                        statusInFlight = false;
                        if (final) finish({ success: false, error: UNCONFIRMED });
                    });
            }

            function startPolling() {
                if (done || polling) return;
                polling = true;
                const btn = document.getElementById('vmSendBtn');
                if (btn && isCurrent()) btn.textContent = 'Still working...';
                pollTimer = setInterval(() => checkStatus(false), STATUS_POLL_MS);
                checkStatus(false);
            }

            // The one and only (first) send.
            _transport('sendVerificationCode', { method, identifier, requestId }, SEND_CEILING_MS)
                .then(handleSendReply)
                .catch(() => {
                    // No usable reply (network error / timeout). Do NOT re-send blindly:
                    // find out what the server actually did.
                    startPolling();
                });

            quietTimer = setTimeout(startPolling, SEND_QUIET_MS);
            ceilingTimer = setTimeout(() => { startPolling(); checkStatus(true); }, SEND_CEILING_MS);
        });
    }

    // Validate code input
    function _validateCode() {
        const code = document.getElementById('vmCodeInput').value;
        document.getElementById('vmVerifyBtn').disabled = code.length !== 6;
    }

    // Verify code
    async function _verifyCode() {
        const code = document.getElementById('vmCodeInput').value.trim();
        const errorEl = document.getElementById('vmError2');
        const btn = document.getElementById('vmVerifyBtn');

        errorEl.classList.add('hidden');

        if (code.length !== 6) {
            errorEl.textContent = 'Please enter the 6-digit code';
            errorEl.classList.remove('hidden');
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Verifying...';
        const slowTimer = setTimeout(() => { btn.textContent = 'Still verifying...'; }, 6000);

        try {
            const response = await _verifyTransport({
                method: verificationData.method,
                identifier: verificationData.identifier,
                code: code,
                verificationId: verificationData.verificationId
            });

            if (response.success && response.verified) {
                const userData = {
                    name: response.name,
                    unit: response.unit,
                    roleTags: response.roleTags || ['Resident'],
                    email: response.email || '',
                    phone: response.phone || ''
                };

                storeUserData(userData);
                _logModuleAccess(userData);
                hide();

                if (config.onSuccess) {
                    config.onSuccess(userData);
                }
            } else {
                errorEl.textContent = response.error || 'Invalid or expired code';
                errorEl.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Verify code error:', error);
            errorEl.textContent = 'Connection error. Please try again.';
            errorEl.classList.remove('hidden');
        } finally {
            clearTimeout(slowTimer);
            btn.disabled = false;
            btn.textContent = 'Verify →';
        }
    }

    // Resend code
    function _resend() {
        document.getElementById('vmStep2').classList.remove('active');
        document.getElementById('vmStep1').classList.add('active');
    }

    // Mask identifier
    function _maskIdentifier(identifier, method) {
        if (method === 'email') {
            const parts = identifier.split('@');
            if (parts.length === 2) {
                return parts[0][0] + '***@' + parts[1];
            }
        } else {
            const digits = identifier.replace(/\D/g, '');
            if (digits.length >= 4) {
                return digits.substring(0, 2) + '** *** **' + digits.substring(digits.length - 1);
            }
        }
        return identifier;
    }

    // Start expiry countdown
    function _startExpiryTimer() {
        // Clear any existing timer
        if (expiryTimerInterval) {
            clearInterval(expiryTimerInterval);
        }

        let seconds = 600; // 10 minutes
        const el = document.getElementById('vmExpiry');

        if (!el) return; // Element doesn't exist

        expiryTimerInterval = setInterval(() => {
            seconds--;
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;

            if (el) { // Check element still exists
                el.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
            }

            if (seconds <= 0) {
                clearInterval(expiryTimerInterval);
                expiryTimerInterval = null;
            }
        }, 1000);
    }

    // Start resend countdown
    function _startResendTimer() {
        // Clear any existing timer
        if (resendTimerInterval) {
            clearInterval(resendTimerInterval);
        }

        let seconds = 60;
        const btn = document.getElementById('vmResendBtn');
        const timer = document.getElementById('vmResendTimer');

        if (!btn || !timer) return; // Elements don't exist

        btn.disabled = true;

        resendTimerInterval = setInterval(() => {
            seconds--;

            if (timer) { // Check element still exists
                timer.textContent = seconds;
            }

            if (seconds <= 0) {
                clearInterval(resendTimerInterval);
                resendTimerInterval = null;
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = 'Resend code';
                }
            }
        }, 1000);
    }

    // ---------------------------------------------------------------
    // Oct 2026 (relay): transport via the Netlify Function
    // ---------------------------------------------------------------

    function _relayError(kind, message) {
        const e = new Error(message);
        e.relayKind = kind;   // 'down' = relay unavailable (use the direct path); 'unknown' = relay tried, no usable reply
        return e;
    }

    // One call through the relay. Resolves with the backend's JSON (which may be a
    // genuine { success:false } answer -- that is a real reply, passed straight back).
    // Rejects with relayKind 'down' or 'unknown'.
    async function _relayCall(action, params, timeoutMs) {
        const limit = Math.min(timeoutMs || RELAY_TIMEOUT_MS, RELAY_TIMEOUT_MS);
        const ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        let timedOut = false;
        const timer = setTimeout(() => { timedOut = true; if (ctrl) { try { ctrl.abort(); } catch (e) {} } }, limit);
        console.log('📡 Relay Call:', action);

        let res;
        try {
            res = await fetch(RELAY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.assign({ action: action }, params)),
                cache: 'no-store',
                signal: ctrl ? ctrl.signal : undefined
            });
        } catch (e) {
            clearTimeout(timer);
            throw _relayError(timedOut ? 'unknown' : 'down', timedOut ? 'relay timeout' : 'relay unreachable');
        }

        // Not deployed / rejected input / wrong method: nothing reached the backend.
        if (res.status === 404 || res.status === 400 || res.status === 405) {
            clearTimeout(timer);
            throw _relayError('down', 'relay HTTP ' + res.status);
        }

        let payload = null;
        try { payload = await res.json(); } catch (e) { payload = null; }
        clearTimeout(timer);

        if (timedOut) throw _relayError('unknown', 'relay timeout');
        if (res.status !== 200) throw _relayError('unknown', 'relay HTTP ' + res.status);   // e.g. 502/504: it may have been mid-call
        if (!payload || typeof payload !== 'object') throw _relayError('down', 'relay returned non-JSON');

        if (payload.relay) console.log('📡 Relay result:', action, payload.relay);
        if (payload.ok === true && payload.data && typeof payload.data === 'object') return payload.data;
        throw _relayError('unknown', 'relay got no usable reply (' + (payload.reason || 'unknown') + ')');
    }

    // Single-attempt call for send / status. Uses the relay; if the relay itself is
    // unavailable falls back to the previous direct browser call. If the relay tried
    // but got no usable reply it rejects, and the caller (which already knows how to
    // find out what happened) takes over -- no blind repeat here.
    async function _transport(action, params, timeoutMs) {
        if (USE_RELAY) {
            try {
                return await _relayCall(action, params, timeoutMs);
            } catch (e) {
                if (e && e.relayKind === 'unknown') throw e;
                console.warn('Relay unavailable (' + (e && e.message) + ') -- using the direct path for ' + action);
            }
        }
        return _callOnce(action, params, timeoutMs);
    }

    // verifyCode: the backend treats a repeat of a just-used code within 60s as a
    // success, so repeating is safe. Up to two relay calls; if the relay is down or
    // gives no answer twice, the old browser path is the last resort with ONE retry
    // so the whole sequence stays inside that 60s window.
    async function _verifyTransport(params) {
        if (USE_RELAY) {
            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    return await _relayCall('verifyCode', params, RELAY_TIMEOUT_MS);
                } catch (e) {
                    if (!e || e.relayKind !== 'unknown') {
                        console.warn('Relay unavailable (' + (e && e.message) + ') -- using the direct path for verifyCode');
                        break;
                    }
                    console.warn('Relay gave no reply for verifyCode (attempt ' + attempt + ' of 2)');
                }
            }
            return _callAPI('verifyCode', params, 1);
        }
        return _callAPI('verifyCode', params);
    }

    // Single-attempt JSONP call (Oct 2026): same settled-guard / no-op callback
    // replacement pattern as _callAPI, but NO retry -- used for the send request
    // (must never repeat) and the read-only status check (the caller polls).
    // Now the fallback path when the relay is unavailable (see _transport).
    function _callOnce(action, params, timeoutMs) {
        return new Promise((resolve, reject) => {
            const cb = 'cb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
            const script = document.createElement('script');
            let settled = false;
            let timeoutId = null;

            function cleanup() {
                window[cb] = function() {};
                try { document.head.removeChild(script); } catch (e) {}
            }

            window[cb] = function(r) {
                if (settled) return;
                settled = true;
                clearTimeout(timeoutId);
                cleanup();
                resolve(r);
            };

            script.onerror = () => {
                if (settled) return;
                settled = true;
                clearTimeout(timeoutId);
                cleanup();
                reject(new Error('Network failed'));
            };

            const query = new URLSearchParams({ action, callback: cb, ...params });
            script.src = MGMT_CENTRAL_URL + '?' + query.toString();
            console.log('📡 API Call (single attempt):', action);
            document.head.appendChild(script);

            timeoutId = setTimeout(() => {
                if (settled) return;
                settled = true;
                cleanup();
                reject(new Error('Timeout'));
            }, timeoutMs);
        });
    }

    // API call (JSONP) - Using exact working code from QuickTest
    // Retry-with-backoff added (v1.0, Sep 2026 -- see header) -- this function had none at all
    // before now, unlike every other module's JSONP caller in this
    // system. Safe to add now specifically because of two companion
    // fixes in ManagementCentral V1.5.3: sendVerificationCode's call to
    // NotificationServer now retries on its own side (so a retried send
    // here is redundant rather than harmful -- worst case a duplicate
    // email with the same still-valid code), and verifyCode now treats a
    // resubmission of a just-used code (within 60s) as a successful re-
    // confirmation rather than "invalid code" -- which is exactly what a
    // naive retry would have triggered before that fix existed. No dead-
    // response fail-fast (see ReportsHub V1.1.21's reasoning) -- every
    // real failure seen in this system fires onerror or the timeout
    // directly.
    // Oct 2026 (relay): now only used for verifyCode, as the fallback when
    // the relay is unavailable (see _verifyTransport).
    function _callAPI(action, params, retries) {
        if (retries === undefined) retries = 3;
        return new Promise((resolve, reject) => {
            const cb = 'cb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
            const script = document.createElement('script');
            let settled = false;

            function cleanup() {
                window[cb] = function() {};
                try { document.head.removeChild(script); } catch (e) {}
            }

            function failOrRetry(reason) {
                if (settled) return;
                settled = true;
                clearTimeout(timeoutId);
                cleanup();
                if (retries > 0) {
                    console.warn('Retrying ' + action + ' (' + reason + ', ' + retries + ' attempt(s) left)');
                    setTimeout(() => {
                        _callAPI(action, params, retries - 1).then(resolve).catch(reject);
                    }, 2000);
                } else {
                    reject(new Error(reason));
                }
            }

            window[cb] = function(r) {
                if (settled) return;
                settled = true;
                clearTimeout(timeoutId);
                cleanup();
                resolve(r);
            };

            const query = new URLSearchParams({ action, callback: cb, ...params });
            script.src = MGMT_CENTRAL_URL + '?' + query.toString();

            // DEBUG
            console.log('📡 API Call:', action);
            console.log('🔗 URL:', script.src);

            script.onerror = () => failOrRetry('Network failed');

            document.head.appendChild(script);

            // 10s, not the 30s used elsewhere in this system (ReportsHub,
            // DesktopExplorer) -- those calls can legitimately be reading
            // a large, growing sheet. sendVerificationCode/verifyCode are
            // trivial lookups against VerificationCodes; under normal
            // conditions they answer in well under a second, so a response
            // that hasn't arrived by 10s is already effectively lost, not
            // "still working" -- waiting a further 20s before retrying
            // was pure dead time for the one call in this whole system
            // where users expect near-instant feedback (Tony: "that took
            // far too long to verify", captured retrying at the full 30s
            // mark). 3 retries still gives a worst case of ~34s total
            // instead of the previous ~96s+.
            const timeoutId = setTimeout(() => failOrRetry('Timeout'), 10000);
        });
    }

    // Public API
    return {
        init: init,
        show: show,
        hide: hide,
        isVerified: isVerified,
        getUserData: getStoredUserData,
        clearVerification: clearVerification,
        logout: logout,
        checkAccess: checkAccess,
        // Internal methods (exposed for onclick handlers)
        _selectMethod: _selectMethod,
        _validateStep1: _validateStep1,
        _sendCode: _sendCode,
        _validateCode: _validateCode,
        _verifyCode: _verifyCode,
        _resend: _resend
    };
})();
