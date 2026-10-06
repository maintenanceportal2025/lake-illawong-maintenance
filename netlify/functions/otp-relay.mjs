/**
 * otp-relay.mjs V1.0.0 - Lake Illawong Netlify Function (OTP relay)
 * LAST UPDATED: October 2026
 *
 * PURPOSE:
 *   Carries the three OTP calls from VerificationModal to the ManagementCentral
 *   Apps Script web app SERVER-SIDE, so a lost or corrupted reply from Google
 *   is detected in about a second and retried here, instead of the browser
 *   waiting out a 10s timeout. The browser talks to this function with a plain
 *   same-origin fetch (no JSONP, no Google redirect hop in the browser).
 *
 * VERSION HISTORY:
 *   V1.0.0 (Oct 2026): OTP relay (POST). Probe mode (GET) retained from V0.1.0.
 *   V0.1.0 (Oct 2026): Probe only.
 *
 * ENDPOINT:  /.netlify/functions/otp-relay
 *   POST  JSON body { action, ...params }  - OTP relay (below)
 *   GET   ?n=5[&retry=1]                   - read-only probe (testConnection only)
 *
 * ACTIONS (allowlist - anything else is rejected with HTTP 400):
 *   checkVerificationStatus { method, identifier }
 *       Read-only. Retried on any bad reply.
 *   sendVerificationCode { method, identifier, requestId }
 *       requestId is REQUIRED. ManagementCentral V1.5.6 ignores a repeat of the
 *       same requestId, so a repeat can never email a second code. Retried only
 *       on a FAST bad reply; a timeout is returned as "unknown" (the backend may
 *       still be working) and the browser checks status instead of re-sending.
 *   verifyCode { method, identifier, code, verificationId? }
 *       Backend treats a repeat of a just-used code within 60s as a success,
 *       so it is retried on any bad reply.
 *
 * A "bad reply" = network error, timeout, non-200 status, or a body that is not
 * a JSON object. A real answer such as { success:false, error:'Invalid code' }
 * is NEVER retried - it is passed straight back.
 *
 * RESPONSE (HTTP 200):
 *   { ok:true,  data:<backend JSON>, relay:{ attempts, ms } }
 *   { ok:false, outcome:'unknown', reason, relay:{ attempts, ms, log } }
 *   HTTP 400 = rejected input, 405 = wrong method. The browser treats any other
 *   status as "relay unavailable" and falls back to its direct path.
 *
 * TIME BUDGET: BUDGET_MS (8.5s) in total per call, so it finishes inside
 *   Netlify's shortest synchronous limit (10s). Raise only if the site's
 *   function timeout is confirmed higher.
 *
 * SAFETY:
 *   - Backend URL is fixed in this file; nothing is taken from the caller.
 *   - Only the three actions above can be reached; only known fields forwarded.
 *   - The OTP code is never logged; identifiers are masked in logs.
 *   - No secrets are used (the Apps Script web app is public: Access = Anyone).
 *
 * TEST SWITCH (leave unset in normal use):
 *   Netlify environment variable RELAY_FAULT = 1 makes the FIRST attempt of
 *   every call run against the backend and then discard its reply, simulating
 *   a lost reply. Delete the variable after testing.
 *
 * CONNECTS TO: ManagementCentral V1.5.6+ (Apps Script web app)
 * CONSUMER:    VerificationModal_V1_0.js
 */

const VERSION = '1.0.0';
const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbzVF25ss7kEmhE42Sf-i_vpLIL1FpTe2AjNeb0b8MqP_eBXAxV9ghWcuwe25hdEuqBFjw/exec';

const BUDGET_MS = 8500;      // total per relay call
const MIN_ATTEMPT_MS = 1000; // do not start an attempt with less than this left
const BACKOFF_MS = 250;
const MAX_ATTEMPTS = 3;
const MAX_BODY_CHARS = 2000;

const ACTIONS = {
    checkVerificationStatus: { fields: ['method', 'identifier'], attemptMs: 3500, retryOnTimeout: true },
    verifyCode: { fields: ['method', 'identifier', 'code', 'verificationId'], attemptMs: 4500, retryOnTimeout: true },
    sendVerificationCode: { fields: ['method', 'identifier', 'requestId'], attemptMs: BUDGET_MS, retryOnTimeout: false }
};

// ---------------------------------------------------------------- helpers

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

function hostOf(u) {
    try { return new URL(u).host; } catch (e) { return ''; }
}

function jsonResponse(obj, status) {
    return new Response(JSON.stringify(obj, null, status === 200 && obj && obj.summary ? 2 : 0), {
        status: status || 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    });
}

function maskIdentifier(method, identifier) {
    const s = String(identifier || '');
    if (method === 'email') {
        const at = s.indexOf('@');
        return at > 0 ? s[0] + '***' + s.slice(at) : '***';
    }
    const digits = s.replace(/\D/g, '');
    return digits.length >= 2 ? '***' + digits.slice(-2) : '***';
}

// Returns { error } or { params } holding only the known, validated fields.
function validate(action, body) {
    const spec = ACTIONS[action];
    if (!spec) return { error: 'action not allowed' };

    const p = {};
    spec.fields.forEach((f) => {
        if (body[f] !== undefined && body[f] !== null) p[f] = String(body[f]);
    });

    if (p.method !== 'email' && p.method !== 'sms') return { error: 'bad method' };

    if (!p.identifier || p.identifier.length < 3 || p.identifier.length > 254 || /[\u0000-\u001f]/.test(p.identifier)) {
        return { error: 'bad identifier' };
    }

    if (action === 'sendVerificationCode') {
        if (!p.requestId || !/^[A-Za-z0-9_-]{8,64}$/.test(p.requestId)) return { error: 'bad requestId' };
    }
    if (action === 'verifyCode') {
        if (!p.code || !/^\d{6}$/.test(p.code)) return { error: 'bad code' };
        if (p.verificationId !== undefined && !/^[A-Za-z0-9_-]{1,80}$/.test(p.verificationId)) return { error: 'bad verificationId' };
    }
    return { params: p };
}

// One request to the backend. Never throws.
// Good reply = HTTP 200 and a body that parses as a JSON object.
async function attemptOnce(action, params, timeoutMs) {
    const q = new URLSearchParams(Object.assign({ action: action }, params));
    q.set('_', Date.now().toString(36) + Math.random().toString(36).slice(2, 6)); // defeat any intermediary caching
    const url = BACKEND_URL + '?' + q.toString();
    const t0 = Date.now();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { Accept: 'application/json' } });
        const text = await res.text();
        const ms = Date.now() - t0;
        let json = null;
        if (res.status === 200) {
            try { json = JSON.parse(text); } catch (e) { json = null; }
        }
        if (json && typeof json === 'object' && !Array.isArray(json)) {
            return { ok: true, ms, status: 200, json, finalHost: hostOf(res.url), contentType: res.headers.get('content-type') || '' };
        }
        return {
            ok: false,
            ms,
            status: res.status,
            reason: res.status !== 200 ? 'http-' + res.status : 'not-json',
            finalHost: hostOf(res.url),
            contentType: res.headers.get('content-type') || '',
            snippet: text.replace(/\s+/g, ' ').slice(0, 120)
        };
    } catch (e) {
        return {
            ok: false,
            ms: Date.now() - t0,
            reason: e && e.name === 'AbortError' ? 'timeout' : 'network',
            detail: String((e && e.message) || e).slice(0, 100)
        };
    } finally {
        clearTimeout(timer);
    }
}

// Runs the attempt loop for one action within BUDGET_MS.
async function callBackend(action, params, policy, budgetMs) {
    const fault = process.env.RELAY_FAULT === '1';
    const started = Date.now();
    const log = [];
    for (let n = 1; n <= MAX_ATTEMPTS; n++) {
        const remaining = budgetMs - (Date.now() - started);
        if (remaining < MIN_ATTEMPT_MS) break;
        const r = await attemptOnce(action, params, Math.min(policy.attemptMs, remaining));
        if (r.ok && fault && n === 1) { r.ok = false; r.reason = 'injected-lost-reply'; }
        log.push({ ok: r.ok, ms: r.ms, reason: r.reason || null, status: r.status || null });
        if (r.ok) return { ok: true, json: r.json, log, ms: Date.now() - started };
        if (r.reason === 'timeout' && !policy.retryOnTimeout) break; // backend may still be working: do not pile on
        if (n < MAX_ATTEMPTS) await sleep(BACKOFF_MS);
    }
    return { ok: false, log, ms: Date.now() - started };
}

// ---------------------------------------------------------------- relay (POST)

async function handleRelay(req) {
    let raw = '';
    try { raw = await req.text(); } catch (e) { raw = ''; }
    if (!raw || raw.length > MAX_BODY_CHARS) return jsonResponse({ error: 'bad body' }, 400);

    let body = null;
    try { body = JSON.parse(raw); } catch (e) { body = null; }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonResponse({ error: 'bad body' }, 400);

    const action = String(body.action || '');
    const v = validate(action, body);
    if (v.error) {
        console.log('otp-relay rejected', JSON.stringify({ action: action.slice(0, 40), error: v.error }));
        return jsonResponse({ error: v.error }, 400);
    }

    const r = await callBackend(action, v.params, ACTIONS[action], BUDGET_MS);

    // Log without the code; identifier masked.
    console.log('otp-relay', JSON.stringify({
        action,
        who: maskIdentifier(v.params.method, v.params.identifier),
        ok: r.ok,
        attempts: r.log.length,
        ms: r.ms,
        log: r.log.map((a) => (a.ok ? 'ok ' + a.ms + 'ms' : (a.reason || 'bad') + ' ' + a.ms + 'ms'))
    }));

    if (r.ok) {
        return jsonResponse({ ok: true, data: r.json, relay: { attempts: r.log.length, ms: r.ms } }, 200);
    }
    const last = r.log[r.log.length - 1] || {};
    return jsonResponse({
        ok: false,
        outcome: 'unknown',
        reason: last.reason || 'no-attempt',
        relay: { attempts: r.log.length, ms: r.ms, log: r.log }
    }, 200);
}

// ---------------------------------------------------------------- probe (GET)

async function handleProbe(req) {
    const params = new URL(req.url).searchParams;
    const n = Math.max(1, Math.min(10, parseInt(params.get('n'), 10) || 5));
    const useRetry = params.get('retry') === '1';
    const started = Date.now();
    const results = [];
    let stoppedEarly = false;
    const probePolicy = { attemptMs: 4500, retryOnTimeout: true };

    for (let i = 0; i < n; i++) {
        const remaining = BUDGET_MS + 500 - (Date.now() - started);
        if (remaining < 1500) { stoppedEarly = true; break; }
        if (useRetry) {
            const r = await callBackend('testConnection', {}, probePolicy, remaining);
            results.push({ call: i + 1, ok: r.ok, attemptsUsed: r.log.length, totalMs: r.ms, attempts: r.log,
                backendVersion: r.ok && r.json ? r.json.version || null : null });
        } else {
            const r = await attemptOnce('testConnection', {}, Math.min(8000, remaining));
            results.push({ call: i + 1, ok: r.ok, ms: r.ms, status: r.status || null, reason: r.reason || null,
                finalHost: r.finalHost || null, snippet: r.snippet || null,
                backendVersion: r.ok && r.json ? r.json.version || null : null });
        }
    }

    const good = results.filter((r) => r.ok);
    const bad = results.filter((r) => !r.ok);
    const times = good.map((r) => (useRetry ? r.totalMs : r.ms));
    const summary = {
        relayVersion: VERSION,
        mode: useRetry ? 'retry' : 'raw',
        callsMade: results.length,
        callsRequested: n,
        stoppedEarly,
        good: good.length,
        bad: bad.length,
        recoveredByRetry: useRetry ? results.filter((r) => r.ok && r.attemptsUsed > 1).length : null,
        msGood: times.length ? { min: Math.min(...times), avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length), max: Math.max(...times) } : null,
        region: process.env.AWS_REGION || null,
        wallMs: Date.now() - started,
        time: new Date().toISOString()
    };
    console.log('otp-relay probe', JSON.stringify(summary));
    return jsonResponse({ summary, results }, 200);
}

// ---------------------------------------------------------------- entry

export default async (req) => {
    if (req.method === 'POST') return handleRelay(req);
    if (req.method === 'GET') return handleProbe(req);
    return jsonResponse({ error: 'method not allowed' }, 405);
};
