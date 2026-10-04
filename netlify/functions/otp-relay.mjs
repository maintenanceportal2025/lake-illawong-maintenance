/**
 * otp-relay.mjs V0.1.0 (PROBE ONLY) - Lake Illawong Netlify Function
 * LAST UPDATED: October 2026
 *
 * PURPOSE (this version):
 *   Measure whether a server-side call to the ManagementCentral Apps Script
 *   web app gets clean replies more reliably than the browser's JSONP path.
 *   It does NOT relay OTP traffic yet and changes nothing in the system.
 *
 * VERSION HISTORY:
 *   V0.1.0 (Oct 2026): Probe only. Calls the read-only testConnection action
 *                      a few times and reports what came back.
 *
 * HOW TO USE (open in a browser address bar):
 *   /.netlify/functions/otp-relay?n=5            raw: 5 single attempts, no retry
 *   /.netlify/functions/otp-relay?n=5&retry=1    each call uses the retry logic
 *   n = number of sequential calls (default 5, maximum 10)
 *
 * SAFETY:
 *   - Read-only. Only testConnection is called. No sheet is touched, no email
 *     or SMS is sent, no OTP code is created or read.
 *   - Backend URL is fixed in this file; nothing is taken from the caller.
 *   - Delete this file once measurement is finished (or replace with V1.0.0).
 *
 * CONNECTS TO: ManagementCentral Apps Script web app (Access: Anyone)
 */

const VERSION = '0.1.0-probe';
const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbzVF25ss7kEmhE42Sf-i_vpLIL1FpTe2AjNeb0b8MqP_eBXAxV9ghWcuwe25hdEuqBFjw/exec';

const GLOBAL_BUDGET_MS = 9000;   // stop starting new calls after this (safe under a 10s function limit)
const RAW_ATTEMPT_MS = 8000;     // raw mode: one attempt, long enough to see true latency
const RETRY_ATTEMPT_MS = 4500;   // retry mode: per-attempt timeout
const RETRY_MAX_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 300;

function hostOf(u) {
    try { return new URL(u).host; } catch (e) { return ''; }
}

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

// One request to the backend. Never throws. A "good" reply is HTTP 200 with a
// body that parses as a JSON object. Anything else is a bad reply.
async function attemptOnce(action, timeoutMs) {
    const url = BACKEND_URL + '?action=' + encodeURIComponent(action) + '&_=' + Date.now() + Math.random().toString(36).slice(2, 6);
    const t0 = Date.now();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { Accept: 'application/json' } });
        const text = await res.text();
        const ms = Date.now() - t0;
        const contentType = res.headers.get('content-type') || '';
        const finalHost = hostOf(res.url);
        let json = null;
        if (res.status === 200) {
            try { json = JSON.parse(text); } catch (e) { json = null; }
        }
        if (json && typeof json === 'object') {
            return { ok: true, ms, status: 200, contentType, finalHost, json };
        }
        return {
            ok: false,
            ms,
            status: res.status,
            contentType,
            finalHost,
            reason: res.status !== 200 ? 'http-' + res.status : 'not-json',
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

// Retry wrapper - the same logic the real relay will use. Retries only bad
// replies (never a real {success:false} answer). Stays within budgetMs.
async function callWithRetry(action, budgetMs) {
    const started = Date.now();
    const attempts = [];
    for (let i = 1; i <= RETRY_MAX_ATTEMPTS; i++) {
        const remaining = budgetMs - (Date.now() - started);
        if (remaining < 800) break;
        const r = await attemptOnce(action, Math.min(RETRY_ATTEMPT_MS, remaining));
        attempts.push({ ok: r.ok, ms: r.ms, reason: r.reason || null, status: r.status || null });
        if (r.ok) {
            return { ok: true, attempts, totalMs: Date.now() - started, json: r.json, finalHost: r.finalHost };
        }
        if (i < RETRY_MAX_ATTEMPTS) await sleep(RETRY_BACKOFF_MS);
    }
    return { ok: false, attempts, totalMs: Date.now() - started };
}

function jsonResponse(obj, status) {
    return new Response(JSON.stringify(obj, null, 2), {
        status: status || 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    });
}

export default async (req) => {
    if (req.method !== 'GET') {
        return jsonResponse({ error: 'GET only (probe version)' }, 405);
    }

    const params = new URL(req.url).searchParams;
    const n = Math.max(1, Math.min(10, parseInt(params.get('n'), 10) || 5));
    const useRetry = params.get('retry') === '1';
    const started = Date.now();
    const results = [];
    let stoppedEarly = false;

    for (let i = 0; i < n; i++) {
        const remaining = GLOBAL_BUDGET_MS - (Date.now() - started);
        if (remaining < 1500) { stoppedEarly = true; break; }

        if (useRetry) {
            const r = await callWithRetry('testConnection', remaining);
            results.push({
                call: i + 1,
                ok: r.ok,
                attemptsUsed: r.attempts.length,
                totalMs: r.totalMs,
                attempts: r.attempts,
                backendVersion: r.ok && r.json ? r.json.version || null : null
            });
        } else {
            const r = await attemptOnce('testConnection', Math.min(RAW_ATTEMPT_MS, remaining));
            results.push({
                call: i + 1,
                ok: r.ok,
                ms: r.ms,
                status: r.status || null,
                reason: r.reason || null,
                contentType: r.contentType || null,
                finalHost: r.finalHost || null,
                snippet: r.snippet || null,
                detail: r.detail || null,
                backendVersion: r.ok && r.json ? r.json.version || null : null
            });
        }
    }

    // Summary
    const good = results.filter((r) => r.ok);
    const bad = results.filter((r) => !r.ok);
    const times = good.map((r) => (useRetry ? r.totalMs : r.ms));
    const reasons = {};
    bad.forEach((r) => {
        const key = useRetry
            ? (r.attempts[r.attempts.length - 1] || {}).reason || 'unknown'
            : r.reason || 'unknown';
        reasons[key] = (reasons[key] || 0) + 1;
    });
    const retriedButRecovered = useRetry
        ? results.filter((r) => r.ok && r.attemptsUsed > 1).length
        : null;

    const summary = {
        probeVersion: VERSION,
        mode: useRetry ? 'retry (up to ' + RETRY_MAX_ATTEMPTS + ' attempts per call)' : 'raw (single attempt per call)',
        callsMade: results.length,
        callsRequested: n,
        stoppedEarly,
        good: good.length,
        bad: bad.length,
        badReasons: reasons,
        recoveredByRetry: retriedButRecovered,
        msGood: times.length
            ? { min: Math.min(...times), avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length), max: Math.max(...times) }
            : null,
        region: process.env.AWS_REGION || null,
        wallMs: Date.now() - started,
        time: new Date().toISOString()
    };

    console.log('otp-relay probe', JSON.stringify(summary));
    return jsonResponse({ summary, results });
};
