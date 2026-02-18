/**
 * =====================================================================
 * VERIFICATION MODAL COMPONENT V1.0
 * =====================================================================
 * PURPOSE: Reusable OTP verification for all Lake Illawong modules
 * VERSION: 1.0
 * CREATED: February 16, 2026
 * DESIGN: Glass effect modal from Unified Design System v1.4
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
    }
    
    // Clear verification
    function clearVerification() {
        if (config.useSessionStorage) {
            sessionStorage.removeItem(config.sessionKey);
            sessionStorage.removeItem(config.sessionKey + '_name');
            sessionStorage.removeItem(config.sessionKey + '_unit');
            sessionStorage.removeItem(config.sessionKey + '_roles');
        }
        verificationData = { method: null, identifier: null, verificationId: null };
    }
    
    // Inject modal HTML and CSS
    function injectModal() {
        const modalHTML = `
<style>
/* Verification Modal Styles - Glass Effect */
#vmModal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
    z-index: 10000;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

#vmModal.active {
    display: flex;
}

.vm-content {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 40px;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.vm-header {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid rgba(30, 64, 175, 0.1);
}

.vm-header-icon {
    font-size: 48px;
    margin-bottom: 15px;
}

.vm-title {
    font-size: 24px;
    font-weight: 700;
    color: #1e40af;
    margin: 0 0 8px 0;
}

.vm-subtitle {
    font-size: 14px;
    color: #64748b;
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
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(30, 64, 175, 0.2);
    border-radius: 12px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.vm-method-option:hover {
    background: rgba(255, 255, 255, 0.8);
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.vm-method-option.selected {
    background: rgba(59, 130, 246, 0.1);
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.vm-method-option input[type="radio"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
    accent-color: #3b82f6;
}

.vm-method-label {
    flex: 1;
}

.vm-method-title {
    font-weight: 600;
    color: #1e40af;
    margin-bottom: 8px;
    font-size: 16px;
}

.vm-method-input {
    width: 100%;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.8);
    border: 2px solid rgba(30, 64, 175, 0.2);
    border-radius: 8px;
    font-size: 14px;
    box-sizing: border-box;
    transition: all 0.2s;
}

.vm-method-input:focus {
    outline: none;
    background: rgba(255, 255, 255, 1);
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.vm-error {
    background: rgba(254, 226, 226, 0.9);
    backdrop-filter: blur(10px);
    border-left: 4px solid #ef4444;
    padding: 14px 18px;
    border-radius: 8px;
    margin-bottom: 20px;
    color: #991b1b;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15);
}

.vm-error.hidden {
    display: none;
}

.vm-info {
    background: rgba(239, 246, 255, 0.9);
    backdrop-filter: blur(10px);
    border-left: 4px solid #3b82f6;
    padding: 14px 18px;
    border-radius: 8px;
    margin-bottom: 25px;
    color: #1e40af;
    font-size: 14px;
    line-height: 1.6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.vm-btn {
    width: 100%;
    padding: 14px 24px;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    font-size: 15px;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.vm-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.vm-btn:active:not(:disabled) {
    transform: translateY(0);
}

.vm-btn:disabled {
    background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.vm-code-group {
    margin-bottom: 25px;
}

.vm-code-group label {
    display: block;
    font-weight: 600;
    color: #1e40af;
    margin-bottom: 10px;
    font-size: 15px;
}

.vm-code-input {
    width: 100%;
    padding: 18px;
    background: rgba(255, 255, 255, 0.9);
    border: 2px solid rgba(30, 64, 175, 0.2);
    border-radius: 10px;
    font-size: 28px;
    text-align: center;
    letter-spacing: 12px;
    font-weight: 700;
    box-sizing: border-box;
    color: #1e40af;
    transition: all 0.2s;
}

.vm-code-input:focus {
    outline: none;
    background: rgba(255, 255, 255, 1);
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.vm-timer {
    text-align: center;
    margin-bottom: 20px;
    font-size: 14px;
    color: #64748b;
}

.vm-countdown {
    font-weight: 700;
    color: #3b82f6;
    font-size: 16px;
}

.vm-resend {
    text-align: center;
    margin-top: 20px;
    font-size: 14px;
}

.vm-resend p {
    color: #64748b;
    margin-bottom: 8px;
}

.vm-resend-btn {
    background: none;
    border: none;
    color: #3b82f6;
    text-decoration: underline;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: color 0.2s;
}

.vm-resend-btn:hover:not(:disabled) {
    color: #2563eb;
}

.vm-resend-btn:disabled {
    color: #94a3b8;
    cursor: not-allowed;
}

.vm-text-muted {
    color: #64748b;
    margin-bottom: 20px;
    font-size: 14px;
    line-height: 1.5;
}

/* Scrollbar styling for modal */
.vm-content::-webkit-scrollbar {
    width: 8px;
}

.vm-content::-webkit-scrollbar-track {
    background: rgba(30, 64, 175, 0.05);
    border-radius: 10px;
}

.vm-content::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.3);
    border-radius: 10px;
}

.vm-content::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.5);
}

/* Mobile responsive */
@media (max-width: 480px) {
    .vm-content {
        padding: 30px 20px;
    }
    
    .vm-title {
        font-size: 20px;
    }
    
    .vm-code-input {
        font-size: 24px;
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
                🔒 For your security, please verify your identity using your email address or mobile number.
            </div>
            
            <div id="vmError1" class="vm-error hidden"></div>
            
            <p class="vm-text-muted">Choose how you'd like to receive your verification code:</p>
            
            <div class="vm-method-choice">
                <div class="vm-method-option" onclick="VerificationModal._selectMethod('email')">
                    <input type="radio" name="vmMethod" value="email" id="vmEmailRadio">
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
                    <input type="radio" name="vmMethod" value="sms" id="vmSmsRadio">
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
