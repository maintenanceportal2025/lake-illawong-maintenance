/**
 * =====================================================================
 * VERIFICATION MODAL COMPONENT V1.0
 * =====================================================================
 * PURPOSE: Reusable OTP verification for all Lake Illawong modules
 * VERSION: 1.0
 * CREATED: February 16, 2026
 * DESIGN: Glass effect modal from Unified Design System v1.4
 * 
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
        if (config.smsOnly) {
            const emailOption = document.getElementById('vmEmailOption');
            if (emailOption) emailOption.style.display = 'none';
            _selectMethod('sms');
        }

        

        document.getElementById('vmModal').classList.add('active');

        // Apply mobile styles via JavaScript (iOS Safari media query fix)
        if (window.innerWidth <= 480) {
            const content = document.querySelector('.vm-content');
            if (content) {
                content.style.padding = '16px 14px';
                content.style.maxHeight = '98vh';
                content.style.overflowY = 'auto';
                content.style.borderRadius = '8px';
            }
            const header = document.querySelector('.vm-header');
            if (header) {
                header.style.marginBottom = '12px';
                header.style.paddingBottom = '12px';
            }
            const icon = document.querySelector('.vm-header-icon');
            if (icon) icon.style.fontSize = '1.5rem';
            const title = document.querySelector('.vm-title');
            if (title) title.style.fontSize = '1.2rem';
            const subtitle = document.querySelector('.vm-subtitle');
            if (subtitle) subtitle.style.fontSize = '0.8rem';
        }
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
        return sessionStorage.getItem(config.sessionKey) === 'true';
    }
    
    // Get stored user data
    function getStoredUserData() {
        if (!config.useSessionStorage) return null;
        
        const name = sessionStorage.getItem(config.sessionKey + '_name');
        const unit = sessionStorage.getItem(config.sessionKey + '_unit');
        const roles = sessionStorage.getItem(config.sessionKey + '_roles');
        
        if (!roles) return null;
        
        return {
            name: name,
            unit: unit,
            roleTags: JSON.parse(roles)
        };
    }
    
    // Store user data
    function storeUserData(userData) {
        if (!config.useSessionStorage) return;
        
        sessionStorage.setItem(config.sessionKey, 'true');
        sessionStorage.setItem(config.sessionKey + '_name', userData.name);
        sessionStorage.setItem(config.sessionKey + '_unit', userData.unit);
        sessionStorage.setItem(config.sessionKey + '_roles', JSON.stringify(userData.roleTags));
        sessionStorage.setItem(config.sessionKey + '_identifier', verificationData.identifier);
    }
    
    // Clear verification
    function clearVerification() {
        if (config.useSessionStorage) {
            sessionStorage.removeItem(config.sessionKey);
            sessionStorage.removeItem(config.sessionKey + '_name');
            sessionStorage.removeItem(config.sessionKey + '_unit');
            sessionStorage.removeItem(config.sessionKey + '_roles');
            sessionStorage.removeItem(config.sessionKey + '_identifier');
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
    #vmModal {
        padding: 8px;
        align-items: center;
    }

    .vm-content {
        padding: 16px 14px;
        max-height: 98vh;
        overflow-y: auto;
        border-radius: 8px;
    }

    .vm-header {
        margin-bottom: 12px;
        padding-bottom: 12px;
    }

    .vm-header-icon {
        font-size: 1.5rem;
        margin-bottom: 6px;
    }

    .vm-title {
        font-size: 1.2rem;
    }

    .vm-subtitle {
        font-size: 0.8rem;
    }

    .vm-text-muted {
        font-size: 0.8rem;
        margin-bottom: 10px;
    }

    .vm-method-option {
        padding: 10px;
        margin-bottom: 8px;
    }

    .vm-method-title {
        font-size: 0.9rem;
        margin-bottom: 4px;
    }

    .vm-method-input {
        font-size: 0.85rem;
        padding: 8px 10px;
    }

    .vm-btn {
        padding: 10px;
        font-size: 0.9rem;
    }

    .vm-code-input {
        font-size: 1.1rem;
        letter-spacing: 6px;
        padding: 10px;
    }

    .vm-timer {
        font-size: 0.8rem;
        margin: 8px 0;
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
        
        if (method === 'email') {
            document.getElementById('vmEmailInput').focus();
        } else {
            document.getElementById('vmPhoneInput').focus();
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
                    roleTags: response.roleTags || ['Resident']
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
            
            window[cb] = function(r) {
                resolve(r);
                document.head.removeChild(script);
                delete window[cb];
            };
            
            const query = new URLSearchParams({ action, callback: cb, ...params });
            script.src = MGMT_CENTRAL_URL + '?' + query.toString();
            
            // DEBUG
            console.log('📡 API Call:', action);
            console.log('🔗 URL:', script.src);
            
            script.onerror = () => {
                reject(new Error('Network failed'));
                document.head.removeChild(script);
                delete window[cb];
            };
            
            document.head.appendChild(script);
            
            setTimeout(() => {
                if (window[cb]) {
                    reject(new Error('Timeout'));
                    document.head.removeChild(script);
                    delete window[cb];
                }
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
