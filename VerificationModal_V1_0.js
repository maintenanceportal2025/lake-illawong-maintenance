/**
 * =====================================================================
 * VERIFICATION MODAL COMPONENT V1.0
 * =====================================================================
 * PURPOSE: Reusable OTP verification for all Lake Illawong modules
 * VERSION: 1.0
 * CREATED: February 16, 2026
 * LAST UPDATED: August 2026
 * DESIGN: Glass effect modal from Unified Design System V2.4
 *
 * CHANGE LOG (version number intentionally stays fixed at 1.0 -- this
 * file is shared across ~15+ modules by filename, so version-in-filename
 * doesn't apply here the way it does elsewhere. Track what changed by
 * date instead.):
 * - Aug 2026: show() fixed to always reset the modal to step 1
 *   (identifier entry) and clear any leftover expiry/resend timers.
 *   Previously, re-showing the modal after a prior incomplete attempt
 *   reached step 2 (code entry) left it stuck on that stale screen --
 *   affected every module's "Try Again"/reVerify pattern after Access
 *   Denied (clearVerification() + show(), no step reset), found via
 *   RelationsChronicle.html and confirmed identically broken in
 *   RelationsManager.html without either module having touched this
 *   file. Root cause was here, not per-module -- fixes all ~15+
 *   consumers at once. No legitimate prior behaviour relied on
 *   resuming mid-code-entry (already-verified sessions are handled
 *   entirely separately via init()'s storage check), so this is a
 *   strict bug fix with no functional trade-off for any caller.
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
 * 1. Include in HTML: <script src="VerificationModal_V1_0.js"></script>
 * 2. Initialize: VerificationModal.init({ ... })
 * 3. Show if needed: if (!alreadyVerified) VerificationModal.show();
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
    
    let modalInjected = false;
    let expiryTimerInterval = null;
    let resendTimerInterval = null;

    // Which Web Storage object backs this session -- 'local' persists across
    // sessionStorage being cleared (e.g. iOS reclaiming a backgrounded tab);
    // 'session' (default) is the original, unchanged behaviour.
    function _getStore() {
        return config.storageType === 'local' ? localStorage : sessionStorage;
    }
    
    // Initialize
    function init(options) {
        config = { ...config, ...options };
        
        // Check if already verified
        if (config.useSessionStorage && isVerified()) {
            const userData = getStoredUserData();
            if (config.onSuccess && userData) {
                setTimeout(() => config.onSuccess(userData), 0);
            }
            return true; // Already verified
        }
        
        return false; // Need to verify
    }
    
    // Show modal
    function show() {
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
        const step1El = document.getElementById('vmStep1');
        const step2El = document.getElementById('vmStep2');
        if (step1El && step2El) {
            step2El.classList.remove('active');
            step1El.classList.add('active');
        }
        if (config.smsOnly) {
            const emailOption = document.getElementById('vmEmailOption');
            if (emailOption) emailOption.style.display = 'none';
            _selectMethod('sms');
        }
        document.getElementById('vmModal').classList.add('active');
    }
    
    // Hide modal
    function hide() {
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
    
    // Check if verified
    function isVerified() {
        if (!config.useSessionStorage) return false;
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
    
    // Get stored user data
    function getStoredUserData() {
        if (!config.useSessionStorage) return null;
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
    
    // Store user data
    function storeUserData(userData) {
        if (!config.useSessionStorage) return;
        const store = _getStore();
        
        store.setItem(config.sessionKey, 'true');
        store.setItem(config.sessionKey + '_name', userData.name);
        store.setItem(config.sessionKey + '_unit', userData.unit);
        store.setItem(config.sessionKey + '_roles', JSON.stringify(userData.roleTags));
        store.setItem(config.sessionKey + '_identifier', verificationData.identifier);
        store.setItem(config.sessionKey + '_email', userData.email || '');
        store.setItem(config.sessionKey + '_phone', userData.phone || '');

        if (config.storageType === 'local' && config.expiryDays) {
            const expiresAt = Date.now() + (config.expiryDays * 24 * 60 * 60 * 1000);
            store.setItem(config.sessionKey + '_expires', String(expiresAt));
        }
    }
    
    // Clear verification
    function clearVerification() {
        if (config.useSessionStorage) {
            const store = _getStore();
            store.removeItem(config.sessionKey);
            store.removeItem(config.sessionKey + '_name');
            store.removeItem(config.sessionKey + '_unit');
            store.removeItem(config.sessionKey + '_roles');
            store.removeItem(config.sessionKey + '_identifier');
            store.removeItem(config.sessionKey + '_email');
            store.removeItem(config.sessionKey + '_phone');
            store.removeItem(config.sessionKey + '_expires');
        }
        verificationData = { method: null, identifier: null, verificationId: null };
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
        
        try {
            const response = await _callAPI('sendVerificationCode', { method, identifier });
            
            if (response.success) {
                verificationData = { method, identifier, verificationId: response.verificationId };
                
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
                errorEl.textContent = response.error || 'Failed to send code. Please try again.';
                errorEl.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Send code error:', error);
            errorEl.textContent = 'Connection error. Please try again.';
            errorEl.classList.remove('hidden');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Send Verification Code →';
        }
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
        
        try {
            const response = await _callAPI('verifyCode', {
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
    
    // API call (JSONP) - Using exact working code from QuickTest
    function _callAPI(action, params) {
        return new Promise((resolve, reject) => {
            const cb = 'cb_' + Date.now();
            const script = document.createElement('script');
            let settled = false;

            function cleanup() {
                window[cb] = function() {};
                try { document.head.removeChild(script); } catch (e) {}
            }
            
            window[cb] = function(r) {
                if (settled) return;
                settled = true;
                cleanup();
                resolve(r);
            };
            
            const query = new URLSearchParams({ action, callback: cb, ...params });
            script.src = MGMT_CENTRAL_URL + '?' + query.toString();
            
            // DEBUG
            console.log('📡 API Call:', action);
            console.log('🔗 URL:', script.src);
            
            script.onerror = () => {
                if (settled) return;
                settled = true;
                cleanup();
                reject(new Error('Network failed'));
            };
            
            document.head.appendChild(script);
            
            setTimeout(() => {
                if (settled) return;
                settled = true;
                cleanup();
                reject(new Error('Timeout'));
            }, 30000);
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
        // Internal methods (exposed for onclick handlers)
        _selectMethod: _selectMethod,
        _validateStep1: _validateStep1,
        _sendCode: _sendCode,
        _validateCode: _validateCode,
        _verifyCode: _verifyCode,
        _resend: _resend
    };
})();
