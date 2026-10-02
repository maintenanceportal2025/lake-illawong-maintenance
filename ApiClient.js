/**
 * ApiClient V1.0.0 — Shared JSONP client for all Lake Illawong frontend modules
 * LAST UPDATED: October 2026
 *
 * FILENAME NOTE: deployed as plain ApiClient.js (no version in the filename),
 * like every other frontend module, so every consumer's <script src> stays
 * stable. The version is tracked in this header only; keep each version as a
 * versioned desktop copy (e.g. ApiClient_V1_0_0.js) for backup.
 *
 * PURPOSE:
 *   Replaces the ~40 hand-rolled makeRequest()/JSONP functions with one
 *   implementation, so a reliability fix made here reaches every module.
 *   Built from DesktopExplorer's proven makeRequest (3 retries, 30s timeout,
 *   settled-guard, no-op callback cleanup) plus per-call read/write safety.
 *
 * VERSION HISTORY:
 * • V1.0.0 (Oct 2026): Initial release.
 *
 * BEHAVIOUR:
 *   - READS (default): up to 3 retries (4 attempts) on network error or
 *     timeout, backoff 2s / 4s / 6s between attempts.
 *   - WRITES ({ write: true }): NEVER retried automatically, because a
 *     retry can duplicate a sheet row or burn a one-time code (e.g.
 *     submitFault, updateComplaint, verifyCode). A failed write rejects with
 *     error.outcomeUnknown = true, because the request may have reached the
 *     backend even though the response never arrived. A write can opt in to
 *     retries with { write: true, retries: N } ONLY if its backend action is
 *     known to be idempotent.
 *   - 30s timeout per attempt (override with { timeout: ms }).
 *   - Callback is replaced with a no-op on cleanup, NEVER deleted, so a
 *     genuinely late cold-start response cannot throw "callback is not
 *     defined". A late response after a timeout is ignored.
 *   - Settled-guard: success / onerror / timeout can each fire at most once
 *     per attempt, and the script tag is removed at most once.
 *   - Requests whose URL exceeds 7500 characters are rejected up front
 *     (Apps Script GET limit is ~8000), with reason 'url-too-long'.
 *   - Heavy calls should be awaited one after another by the caller, not
 *     fired concurrently.
 *
 * USAGE:
 *   <script src="ApiClient.js"></script>
 *
 *   // Read
 *   const res = await ApiClient.call(API_URL, 'getFaultLogData', { lean: 1 });
 *
 *   // Write (no auto-retry)
 *   const res = await ApiClient.call(API_URL, 'submitFault', params, { write: true });
 *
 *   // Optional UI hook while a retry is pending
 *   ApiClient.call(API_URL, 'getX', {}, {
 *       onRetry: function (info) { // { action, attempt, maxAttempts, reason, delayMs }
 *       }
 *   });
 *
 *   Errors are ApiError: { name, message, reason: 'timeout' | 'network' |
 *   'url-too-long', action, attempts, outcomeUnknown }.
 *
 * NOTE: the caller still checks response.success; this client only handles
 *   transport. A backend { success:false } is a normal resolved response and
 *   is never retried here.
 *
 * CONSUMERS: none yet — migrating module by module (ReportsHub,
 *   ZoneRepReports, RelationsManager, FacilitiesBooking first).
 */
(function (global) {
    'use strict';

    var DEFAULTS = {
        timeout: 30000,
        readRetries: 3,
        retryDelayStep: 2000,   // delay before retry n = n * step
        maxUrlLength: 7500
    };

    var seq = 0;

    function ApiError(message, reason, action, attempts, outcomeUnknown) {
        this.name = 'ApiError';
        this.message = message;
        this.reason = reason;
        this.action = action;
        this.attempts = attempts;
        this.outcomeUnknown = !!outcomeUnknown;
        if (Error.captureStackTrace) Error.captureStackTrace(this, ApiError);
        else this.stack = (new Error(message)).stack;
    }
    ApiError.prototype = Object.create(Error.prototype);
    ApiError.prototype.constructor = ApiError;

    function buildUrl(baseUrl, action, params, callbackName) {
        var parts = ['action=' + encodeURIComponent(action),
                     'callback=' + encodeURIComponent(callbackName)];
        if (params) {
            Object.keys(params).forEach(function (k) {
                var v = params[k];
                if (v === undefined || v === null) return;
                if (typeof v === 'object') v = JSON.stringify(v);
                parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
            });
        }
        return baseUrl + (baseUrl.indexOf('?') === -1 ? '?' : '&') + parts.join('&');
    }

    // One attempt. Resolves with the response, rejects with ApiError
    // (reason 'timeout' | 'network' | 'url-too-long').
    function attemptOnce(baseUrl, action, params, timeoutMs, attemptNo) {
        return new Promise(function (resolve, reject) {
            var cbName = 'ac_' + Date.now() + '_' + (++seq) + '_' + Math.random().toString(36).slice(2, 7);
            var url = buildUrl(baseUrl, action, params, cbName);

            if (url.length > DEFAULTS.maxUrlLength) {
                reject(new ApiError('Request URL too long (' + url.length + ' chars): ' + action,
                    'url-too-long', action, attemptNo, false));
                return;
            }

            var script = document.createElement('script');
            var settled = false;
            var timer = null;

            function cleanup() {
                // Replace, never delete: a late response must not throw.
                global[cbName] = function () {};
                if (script.parentNode) {
                    try { script.parentNode.removeChild(script); } catch (e) {}
                }
            }

            function finish(fn) {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                cleanup();
                fn();
            }

            global[cbName] = function (data) {
                finish(function () { resolve(data); });
            };
            script.onerror = function () {
                finish(function () {
                    reject(new ApiError('Network error: ' + action, 'network', action, attemptNo, false));
                });
            };
            timer = setTimeout(function () {
                finish(function () {
                    reject(new ApiError('Timeout: ' + action, 'timeout', action, attemptNo, false));
                });
            }, timeoutMs);

            script.src = url;
            (document.head || document.body).appendChild(script);
        });
    }

    function sleep(ms) {
        return new Promise(function (r) { setTimeout(r, ms); });
    }

    /**
     * ApiClient.call(baseUrl, action, params, opts) -> Promise
     * opts: { write:boolean, retries:number, timeout:ms, onRetry:function }
     */
    function call(baseUrl, action, params, opts) {
        opts = opts || {};
        var isWrite = opts.write === true;
        var retries = (typeof opts.retries === 'number') ? opts.retries
                    : (isWrite ? 0 : DEFAULTS.readRetries);
        var timeoutMs = opts.timeout || DEFAULTS.timeout;
        var maxAttempts = retries + 1;

        function run(attemptNo) {
            return attemptOnce(baseUrl, action, params, timeoutMs, attemptNo).catch(function (err) {
                // URL-too-long can never succeed on retry.
                if (err.reason === 'url-too-long' || attemptNo >= maxAttempts) {
                    err.attempts = attemptNo;
                    // A failed write may still have reached the backend.
                    err.outcomeUnknown = isWrite && err.reason !== 'url-too-long';
                    if (typeof console !== 'undefined') {
                        console.warn('ApiClient: ' + action + ' failed after ' + attemptNo +
                            ' attempt(s) (' + err.reason + ')' +
                            (err.outcomeUnknown ? ' — write outcome unknown' : ''));
                    }
                    throw err;
                }
                var delay = attemptNo * DEFAULTS.retryDelayStep;
                if (typeof console !== 'undefined') {
                    console.warn('ApiClient: retrying ' + action + ' (' + err.reason + ', attempt ' +
                        attemptNo + ' of ' + maxAttempts + ', waiting ' + delay + 'ms)');
                }
                if (typeof opts.onRetry === 'function') {
                    try {
                        opts.onRetry({ action: action, attempt: attemptNo, maxAttempts: maxAttempts,
                                       reason: err.reason, delayMs: delay });
                    } catch (e) {}
                }
                return sleep(delay).then(function () { return run(attemptNo + 1); });
            });
        }
        return run(1);
    }

    global.ApiClient = { call: call, ApiError: ApiError, VERSION: '1.0.0', _defaults: DEFAULTS };

})(typeof window !== 'undefined' ? window : globalThis);
