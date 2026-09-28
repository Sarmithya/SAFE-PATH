import re

with open("backend/templates/index.html", "r", encoding="utf-8") as f:
    content = f.read()

# The JS we want to inject
new_js = """    // =========================================================
    // AUTHENTICATION GATEWAY (PRODUCTION)
    // =========================================================
    
    // Switch between forms
    function switchAuthForm(formId) {
      document.getElementById('auth-form-login').style.display = 'none';
      document.getElementById('auth-form-register').style.display = 'none';
      document.getElementById('auth-form-verify').style.display = 'none';
      document.getElementById('auth-form-forgot').style.display = 'none';
      document.getElementById('auth-form-reset').style.display = 'none';
      document.getElementById('auth-form-onboarding').style.display = 'none';
      
      document.getElementById('auth-main-tabs').style.display = (formId === 'login' || formId === 'register') ? 'flex' : 'none';
      
      if (formId === 'login') {
        document.getElementById('tab-auth-login').classList.add('active');
        document.getElementById('tab-auth-register').classList.remove('active');
      } else if (formId === 'register') {
        document.getElementById('tab-auth-register').classList.add('active');
        document.getElementById('tab-auth-login').classList.remove('active');
      }
      
      document.getElementById('auth-form-' + formId).style.display = 'block';
      hideAuthError();
      hideAuthSuccess();
    }

    function showAuthError(msg) {
      const err = document.getElementById('auth-error-alert');
      err.textContent = '❌ ' + msg;
      err.style.display = 'block';
    }

    function hideAuthError() {
      document.getElementById('auth-error-alert').style.display = 'none';
    }

    function showAuthSuccess(msg) {
      const succ = document.getElementById('auth-success-alert');
      succ.textContent = '✅ ' + msg;
      succ.style.display = 'block';
    }

    function hideAuthSuccess() {
      document.getElementById('auth-success-alert').style.display = 'none';
    }

    function togglePasswordVisibility(inputId, btn) {
      const input = document.getElementById(inputId);
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
      }
    }

    // Handlers
    async function handleLoginSubmit() {
      const identifier = document.getElementById('login-identifier').value.trim();
      const password = document.getElementById('login-password').value;
      const btn = document.getElementById('btn-login-submit');
      const btnText = document.getElementById('login-btn-text');

      if (!identifier || !password) {
        return showAuthError('Please enter both email/mobile and password.');
      }

      btn.disabled = true;
      btnText.textContent = 'Signing in...';
      hideAuthError();

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password })
        });
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 403 && data.requires_verification) {
            // User needs to verify
            document.getElementById('verify-target-display').textContent = identifier;
            sessionStorage.setItem('pending_verify_identifier', identifier);
            switchAuthForm('verify');
            showAuthSuccess('A new verification code has been sent.');
          } else {
            showAuthError(data.error || 'Login failed');
          }
        } else {
          // Success
          localStorage.setItem('safepath_token', data.token);
          localStorage.setItem('safepath_user', JSON.stringify(data.user));
          completeLogin(data.user);
        }
      } catch (err) {
        showAuthError('Network error. Please try again.');
      } finally {
        btn.disabled = false;
        btnText.textContent = 'Sign In to Navigation ›';
      }
    }

    function completeLogin(user) {
      document.getElementById('profile-name').textContent = user.full_name || "User";
      document.getElementById('profile-email').textContent = user.email || "";
      document.getElementById('auth-gateway').style.display = 'none';
    }

    async function executeQuickDemoAuth() {
      document.getElementById('login-identifier').value = 'demo@saferoute.app';
      document.getElementById('login-password').value = 'demo1234';
      handleLoginSubmit();
    }

    function checkPasswordRequirements(pwd) {
      document.getElementById('pwd-req-length').textContent = pwd.length >= 8 ? '✔ 8+ characters' : '✖ 8+ characters';
      document.getElementById('pwd-req-length').style.color = pwd.length >= 8 ? '#10B981' : 'var(--text-muted)';
      
      const hasUpper = /[A-Z]/.test(pwd);
      document.getElementById('pwd-req-upper').textContent = hasUpper ? '✔ At least 1 uppercase letter (A-Z)' : '✖ At least 1 uppercase letter (A-Z)';
      document.getElementById('pwd-req-upper').style.color = hasUpper ? '#10B981' : 'var(--text-muted)';
      
      const hasLower = /[a-z]/.test(pwd);
      document.getElementById('pwd-req-lower').textContent = hasLower ? '✔ At least 1 lowercase letter (a-z)' : '✖ At least 1 lowercase letter (a-z)';
      document.getElementById('pwd-req-lower').style.color = hasLower ? '#10B981' : 'var(--text-muted)';
      
      const hasNum = /[0-9]/.test(pwd);
      document.getElementById('pwd-req-number').textContent = hasNum ? '✔ At least 1 number (0-9)' : '✖ At least 1 number (0-9)';
      document.getElementById('pwd-req-number').style.color = hasNum ? '#10B981' : 'var(--text-muted)';
      
      const hasSpec = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
      document.getElementById('pwd-req-special').textContent = hasSpec ? '✔ At least 1 special char (!@#$%^&*)' : '✖ At least 1 special char (!@#$%^&*)';
      document.getElementById('pwd-req-special').style.color = hasSpec ? '#10B981' : 'var(--text-muted)';
      
      checkPasswordMatch();
    }

    function checkPasswordMatch() {
      const pwd = document.getElementById('reg-password').value;
      const conf = document.getElementById('reg-confirm-password').value;
      const msg = document.getElementById('pwd-match-msg');
      if (conf.length > 0) {
        msg.style.display = 'block';
        if (pwd === conf) {
          msg.textContent = '✔ Passwords match';
          msg.style.color = '#10B981';
        } else {
          msg.textContent = '✖ Passwords do not match';
          msg.style.color = '#EF4444';
        }
      } else {
        msg.style.display = 'none';
      }
    }

    async function handleRegisterSubmit() {
      const full_name = document.getElementById('reg-fullname').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const phone = document.getElementById('reg-phone').value.trim();
      const password = document.getElementById('reg-password').value;
      const confirm = document.getElementById('reg-confirm-password').value;
      const terms = document.getElementById('reg-terms').checked;

      if (!full_name || !email || !password || !confirm) return showAuthError('Please fill all required fields.');
      if (password !== confirm) return showAuthError('Passwords do not match.');
      if (!terms) return showAuthError('You must agree to the Terms of Service.');

      const btn = document.getElementById('btn-reg-submit');
      btn.disabled = true;
      document.getElementById('reg-btn-text').textContent = 'Creating Account...';
      hideAuthError();

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name, email, phone, password })
        });
        const data = await res.json();

        if (!res.ok) {
          showAuthError(data.error || 'Registration failed');
        } else {
          document.getElementById('verify-target-display').textContent = email;
          sessionStorage.setItem('pending_verify_identifier', email);
          switchAuthForm('verify');
          startResendCooldown();
        }
      } catch (err) {
        showAuthError('Network error. Please try again.');
      } finally {
        btn.disabled = false;
        document.getElementById('reg-btn-text').textContent = 'Create Account & Send Code ›';
      }
    }

    let resendInterval;
    function startResendCooldown() {
      const btn = document.getElementById('btn-resend-otp');
      const text = document.getElementById('resend-cooldown-text');
      btn.disabled = true;
      let left = 60;
      
      if (resendInterval) clearInterval(resendInterval);
      resendInterval = setInterval(() => {
        left--;
        text.textContent = `Resend code in ${left}s`;
        if (left <= 0) {
          clearInterval(resendInterval);
          btn.disabled = false;
          text.textContent = 'Code didn\\'t arrive?';
        }
      }, 1000);
    }

    async function handleResendOtp() {
      const identifier = sessionStorage.getItem('pending_verify_identifier');
      if (!identifier) return;
      
      try {
        const res = await fetch('/api/auth/resend-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier })
        });
        if (res.ok) {
          showAuthSuccess('New code sent successfully.');
          startResendCooldown();
        } else {
          const data = await res.json();
          showAuthError(data.error || 'Failed to resend');
        }
      } catch (err) {
        showAuthError('Network error');
      }
    }

    async function handleVerifyOtpSubmit() {
      const identifier = sessionStorage.getItem('pending_verify_identifier');
      const otp_code = document.getElementById('verify-otp-input').value.trim();
      if (!identifier || !otp_code) return showAuthError('Please enter the 6-digit code.');

      const btn = document.getElementById('btn-verify-submit');
      btn.disabled = true;
      document.getElementById('verify-btn-text').textContent = 'Verifying...';
      hideAuthError();

      try {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, otp_code })
        });
        const data = await res.json();

        if (!res.ok) {
          showAuthError(data.error || 'Verification failed');
        } else {
          localStorage.setItem('safepath_token', data.token);
          localStorage.setItem('safepath_user', JSON.stringify(data.user));
          if (data.user && !data.user.onboarding_completed) {
            switchAuthForm('onboarding');
          } else {
            completeLogin(data.user);
          }
        }
      } catch (err) {
        showAuthError('Network error');
      } finally {
        btn.disabled = false;
        document.getElementById('verify-btn-text').textContent = 'Verify & Activate Account ›';
      }
    }

    async function handleForgotSubmit() {
      const identifier = document.getElementById('forgot-identifier').value.trim();
      if (!identifier) return showAuthError('Please enter your email or mobile.');
      
      const btn = document.getElementById('btn-forgot-submit');
      btn.disabled = true;
      document.getElementById('forgot-btn-text').textContent = 'Sending...';
      
      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier })
        });
        const data = await res.json();
        
        if (!res.ok) {
          showAuthError(data.error || 'Failed to send reset code');
        } else {
          sessionStorage.setItem('pending_reset_identifier', identifier);
          switchAuthForm('reset');
          showAuthSuccess('Reset code sent to your email/mobile.');
        }
      } catch (err) {
        showAuthError('Network error');
      } finally {
        btn.disabled = false;
        document.getElementById('forgot-btn-text').textContent = 'Send Reset Code ›';
      }
    }

    async function handleResetPasswordSubmit() {
      const identifier = sessionStorage.getItem('pending_reset_identifier');
      const reset_code = document.getElementById('reset-otp-input').value.trim();
      const new_password = document.getElementById('reset-new-password').value;
      const confirm_password = document.getElementById('reset-confirm-password').value;
      
      if (!reset_code || !new_password) return showAuthError('Please fill all fields');
      if (new_password !== confirm_password) return showAuthError('Passwords do not match');
      
      const btn = document.getElementById('btn-reset-submit');
      btn.disabled = true;
      
      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, reset_code, new_password })
        });
        const data = await res.json();
        
        if (!res.ok) {
          showAuthError(data.error || 'Reset failed');
        } else {
          switchAuthForm('login');
          showAuthSuccess('Password reset successfully. Please login.');
        }
      } catch (err) {
        showAuthError('Network error');
      } finally {
        btn.disabled = false;
      }
    }

    async function handleProfileSetupSubmit() {
      const name = document.getElementById('onboard-ec-name').value.trim();
      const phone = document.getElementById('onboard-ec-phone').value.trim();
      const rel = document.getElementById('onboard-ec-rel').value;
      
      if (!name || !phone) return showAuthError('Please provide contact details');
      
      const btn = document.getElementById('btn-onboard-submit');
      btn.disabled = true;
      
      try {
        const token = localStorage.getItem('safepath_token');
        const res = await fetch('/api/auth/profile-setup', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            emergency_contacts: [{ name, phone, relationship: rel }]
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('safepath_user', JSON.stringify(data.user));
          completeLogin(data.user);
        } else {
          showAuthError('Setup failed');
        }
      } catch (err) {
        showAuthError('Network error');
      } finally {
        btn.disabled = false;
      }
    }

    function executeSignOut() {
      localStorage.removeItem('safepath_token');
      localStorage.removeItem('safepath_user');
      document.getElementById('auth-gateway').style.display = 'flex';
      switchAuthForm('login');
    }
"""

# Find the start and end of the block to replace
start_idx = content.find("    // =========================================================")
end_idx = content.find("    // =========================================================", start_idx + 10)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + new_js + content[end_idx:]
    with open("backend/templates/index.html", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully injected production JS!")
else:
    print("Could not find insertion points.")
