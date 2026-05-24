/* =====================================================
   mejob — auth.js
   Authentication system: Login, Register, Forgot Password
   Uses localStorage to persist session (frontend-only demo)
   ===================================================== */

const Auth = (() => {

  /* =====================================================
     STATE
     ===================================================== */
  let currentView = 'login';   // 'login' | 'register' | 'forgot' | 'sent'
  let regStep = 1;              // 1 = role select | 2 = fill form
  let selectedRole = 'jobseeker';

  /* =====================================================
     STORAGE HELPERS
     ===================================================== */
  const STORAGE_KEY = 'mejob_users';
  const SESSION_KEY = 'mejob_session';

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }
  function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }
  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  }
  function saveSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  /* =====================================================
     VALIDATION HELPERS
     ===================================================== */
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }
  function validatePassword(pw) {
    return pw.length >= 8;
  }
  function getPasswordStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return 'weak';
    if (score <= 2) return 'medium';
    return 'strong';
  }
  function getStrengthLabel(s) {
    return { weak: 'รหัสผ่านอ่อน', medium: 'รหัสผ่านปานกลาง', strong: 'รหัสผ่านแข็งแกร่ง' }[s];
  }

  function setFieldError(fieldId, msg) {
    const field = document.getElementById(fieldId);
    const errEl = document.getElementById(fieldId + 'Err');
    if (field) field.classList.add('error');
    if (errEl) { errEl.textContent = '⚠ ' + msg; errEl.classList.add('show'); }
  }
  function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errEl = document.getElementById(fieldId + 'Err');
    if (field) { field.classList.remove('error'); }
    if (errEl) errEl.classList.remove('show');
  }
  function clearAllErrors() {
    document.querySelectorAll('.auth-field input').forEach(f => f.classList.remove('error', 'success'));
    document.querySelectorAll('.auth-field__error').forEach(e => e.classList.remove('show'));
  }

  /* =====================================================
     HTML TEMPLATES
     ===================================================== */
  function tmplLogin() {
    return `
      <div class="auth-header">
        <span class="auth-logo"><span class="logo-me">me</span><span class="logo-job">job</span><span class="logo-dot"></span></span>
        <h2>ยินดีต้อนรับกลับ!</h2>
        <p>ยังไม่มีบัญชี? <a onclick="Auth.showView('register')">สมัครสมาชิกฟรี</a></p>
      </div>

      <div class="auth-socials">
        <button class="auth-social-btn" onclick="Auth.socialLogin('Google')">
          <svg viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Google
        </button>
        <button class="auth-social-btn" onclick="Auth.socialLogin('Facebook')">
          <svg viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Facebook
        </button>
      </div>

      <div class="auth-divider">หรือเข้าสู่ระบบด้วยอีเมล</div>

      <form class="auth-form" id="loginForm" onsubmit="Auth.submitLogin(event)">
        <div class="auth-field">
          <label for="loginEmail">อีเมล</label>
          <div class="auth-field__wrap">
            <span class="auth-field__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></span>
            <input type="email" id="loginEmail" placeholder="your@email.com" autocomplete="email" />
          </div>
          <span class="auth-field__error" id="loginEmailErr"></span>
        </div>
        <div class="auth-field">
          <label for="loginPassword">รหัสผ่าน</label>
          <div class="auth-field__wrap">
            <span class="auth-field__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
            <input type="password" id="loginPassword" placeholder="รหัสผ่านของคุณ" autocomplete="current-password" />
            <span class="auth-field__toggle" onclick="Auth.togglePw('loginPassword', this)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </span>
          </div>
          <span class="auth-field__error" id="loginPasswordErr"></span>
        </div>
        <div class="auth-extras">
          <label class="auth-checkbox">
            <input type="checkbox" id="loginRemember" /> จดจำฉัน
          </label>
          <button type="button" class="auth-forgot" onclick="Auth.showView('forgot')">ลืมรหัสผ่าน?</button>
        </div>
        <button type="submit" class="auth-submit" id="loginSubmit">
          <span class="btn-text">เข้าสู่ระบบ →</span>
          <span class="btn-spinner"></span>
        </button>
      </form>
    `;
  }

  function tmplRegisterStep1() {
    return `
      <div class="auth-header">
        <span class="auth-logo"><span class="logo-me">me</span><span class="logo-job">job</span><span class="logo-dot"></span></span>
        <h2>สมัครสมาชิกฟรี</h2>
        <p>มีบัญชีแล้ว? <a onclick="Auth.showView('login')">เข้าสู่ระบบ</a></p>
      </div>

      <div class="auth-steps" id="authSteps">
        <div class="auth-step active" id="authStep1">
          <div class="auth-step__dot">1</div>
        </div>
        <div class="auth-step__line"></div>
        <div class="auth-step" id="authStep2">
          <div class="auth-step__dot">2</div>
        </div>
        <div class="auth-step__line"></div>
        <div class="auth-step" id="authStep3">
          <div class="auth-step__dot">✓</div>
        </div>
      </div>

      <p style="text-align:center;font-size:0.9rem;color:var(--clr-text2);margin-bottom:20px">คุณมาเพื่อ...</p>

      <div class="role-selector">
        <div class="role-card ${selectedRole === 'jobseeker' ? 'selected' : ''}" id="roleJobseeker" onclick="Auth.selectRole('jobseeker')">
          <span class="role-card__icon">🔍</span>
          <div class="role-card__title">หางาน</div>
          <div class="role-card__desc">ค้นหาและสมัครงานในฝัน</div>
        </div>
        <div class="role-card ${selectedRole === 'employer' ? 'selected' : ''}" id="roleEmployer" onclick="Auth.selectRole('employer')">
          <span class="role-card__icon">🏢</span>
          <div class="role-card__title">หาคนทำงาน</div>
          <div class="role-card__desc">ลงประกาศงานและหาพนักงาน</div>
        </div>
      </div>

      <button class="auth-submit" style="margin-top:24px" onclick="Auth.goRegisterStep2()">
        <span class="btn-text">ถัดไป →</span>
        <span class="btn-spinner"></span>
      </button>
    `;
  }

  function tmplRegisterStep2() {
    const roleLabel = selectedRole === 'jobseeker' ? 'ผู้หางาน' : 'นายจ้าง / HR';
    return `
      <div class="auth-header">
        <span class="auth-logo"><span class="logo-me">me</span><span class="logo-job">job</span><span class="logo-dot"></span></span>
        <h2>สร้างบัญชีของคุณ</h2>
        <p>สมัครในฐานะ <strong style="color:var(--clr-primary)">${roleLabel}</strong></p>
      </div>

      <div class="auth-steps">
        <div class="auth-step done"><div class="auth-step__dot">✓</div></div>
        <div class="auth-step__line"></div>
        <div class="auth-step active"><div class="auth-step__dot">2</div></div>
        <div class="auth-step__line"></div>
        <div class="auth-step"><div class="auth-step__dot">3</div></div>
      </div>

      <div class="auth-socials">
        <button class="auth-social-btn" onclick="Auth.socialLogin('Google')">
          <svg viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          สมัครด้วย Google
        </button>
        <button class="auth-social-btn" onclick="Auth.socialLogin('Facebook')">
          <svg viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          สมัครด้วย Facebook
        </button>
      </div>
      <div class="auth-divider">หรือกรอกข้อมูล</div>

      <form class="auth-form" id="registerForm" onsubmit="Auth.submitRegister(event)">
        <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="auth-field">
            <label for="regFirstName">ชื่อ *</label>
            <div class="auth-field__wrap">
              <span class="auth-field__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
              <input type="text" id="regFirstName" placeholder="ชื่อ" autocomplete="given-name" />
            </div>
            <span class="auth-field__error" id="regFirstNameErr"></span>
          </div>
          <div class="auth-field">
            <label for="regLastName">นามสกุล *</label>
            <div class="auth-field__wrap">
              <span class="auth-field__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
              <input type="text" id="regLastName" placeholder="นามสกุล" autocomplete="family-name" />
            </div>
            <span class="auth-field__error" id="regLastNameErr"></span>
          </div>
        </div>

        <div class="auth-field">
          <label for="regEmail">อีเมล *</label>
          <div class="auth-field__wrap">
            <span class="auth-field__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></span>
            <input type="email" id="regEmail" placeholder="your@email.com" autocomplete="email" oninput="Auth.validateRegEmail()" />
          </div>
          <span class="auth-field__error" id="regEmailErr"></span>
        </div>

        <div class="auth-field">
          <label for="regPhone">เบอร์โทรศัพท์</label>
          <div class="auth-field__wrap">
            <span class="auth-field__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.26-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span>
            <input type="tel" id="regPhone" placeholder="0812345678" autocomplete="tel" />
          </div>
        </div>

        <div class="auth-field">
          <label for="regPassword">รหัสผ่าน *</label>
          <div class="auth-field__wrap">
            <span class="auth-field__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
            <input type="password" id="regPassword" placeholder="อย่างน้อย 8 ตัวอักษร" autocomplete="new-password" oninput="Auth.checkPasswordStrength()" />
            <span class="auth-field__toggle" onclick="Auth.togglePw('regPassword', this)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </span>
          </div>
          <div class="password-strength" id="passwordStrength" style="display:none">
            <div class="strength-bar"><div class="strength-fill" id="strengthFill"></div></div>
            <span class="strength-label" id="strengthLabel"></span>
          </div>
          <span class="auth-field__error" id="regPasswordErr"></span>
        </div>

        <div class="auth-field">
          <label for="regPasswordConfirm">ยืนยันรหัสผ่าน *</label>
          <div class="auth-field__wrap">
            <span class="auth-field__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
            <input type="password" id="regPasswordConfirm" placeholder="กรอกรหัสผ่านอีกครั้ง" autocomplete="new-password" />
            <span class="auth-field__toggle" onclick="Auth.togglePw('regPasswordConfirm', this)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </span>
          </div>
          <span class="auth-field__error" id="regPasswordConfirmErr"></span>
        </div>

        <label class="auth-terms">
          <input type="checkbox" id="regTerms" />
          <span>ฉันยอมรับ <a href="#" onclick="event.preventDefault()">ข้อกำหนดการใช้งาน</a> และ <a href="#" onclick="event.preventDefault()">นโยบายความเป็นส่วนตัว</a> ของ mejob</span>
        </label>
        <span class="auth-field__error" id="regTermsErr"></span>

        <div style="display:flex;gap:10px;margin-top:4px">
          <button type="button" class="btn btn--ghost" style="flex:0 0 auto;padding:14px 18px" onclick="Auth.showView('register')">← ย้อนกลับ</button>
          <button type="submit" class="auth-submit" id="registerSubmit" style="flex:1">
            <span class="btn-text">สมัครสมาชิก →</span>
            <span class="btn-spinner"></span>
          </button>
        </div>
      </form>
    `;
  }

  function tmplForgot() {
    return `
      <button class="auth-back-btn" onclick="Auth.showView('login')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
        กลับสู่หน้าล็อคอิน
      </button>
      <div class="auth-header">
        <h2>ลืมรหัสผ่าน?</h2>
        <p>กรอกอีเมลของคุณ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้</p>
      </div>
      <form class="auth-form" id="forgotForm" onsubmit="Auth.submitForgot(event)">
        <div class="auth-field">
          <label for="forgotEmail">อีเมล</label>
          <div class="auth-field__wrap">
            <span class="auth-field__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></span>
            <input type="email" id="forgotEmail" placeholder="your@email.com" autocomplete="email" />
          </div>
          <span class="auth-field__error" id="forgotEmailErr"></span>
        </div>
        <button type="submit" class="auth-submit" id="forgotSubmit">
          <span class="btn-text">ส่งลิงก์รีเซ็ต →</span>
          <span class="btn-spinner"></span>
        </button>
      </form>
    `;
  }

  function tmplEmailSent(email) {
    return `
      <div class="auth-success">
        <div class="auth-success__icon">📧</div>
        <h3>ตรวจสอบอีเมลของคุณ!</h3>
        <p>เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปที่<br/><strong style="color:var(--clr-primary)">${email}</strong><br/>กรุณาตรวจสอบกล่องจดหมาย (รวมถึง Spam)</p>
        <button class="btn btn--outline" style="margin-top:24px;width:100%" onclick="Auth.showView('login')">กลับสู่หน้าล็อคอิน</button>
      </div>
    `;
  }

  /* =====================================================
     MODAL LIFECYCLE
     ===================================================== */
  function getOverlay() { return document.getElementById('authOverlay'); }
  function getContent() { return document.getElementById('authContent'); }

  function open(view = 'login') {
    currentView = view;
    regStep = 1;
    render();
    const overlay = getOverlay();
    if (overlay) {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        const firstInput = overlay.querySelector('input');
        if (firstInput) firstInput.focus();
      }, 350);
    }
  }

  function close() {
    const overlay = getOverlay();
    if (overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  function render() {
    const content = getContent();
    if (!content) return;
    clearAllErrors();

    if (currentView === 'login') {
      content.innerHTML = tmplLogin();
    } else if (currentView === 'register') {
      if (regStep === 1) {
        content.innerHTML = tmplRegisterStep1();
      } else {
        content.innerHTML = tmplRegisterStep2();
      }
    } else if (currentView === 'forgot') {
      content.innerHTML = tmplForgot();
    } else if (currentView === 'sent') {
      const emailInput = document.getElementById('forgotEmail');
      const email = emailInput ? emailInput.value : '...';
      content.innerHTML = tmplEmailSent(email);
    }
  }

  function showView(view) {
    currentView = view;
    if (view === 'register') regStep = 1;
    render();
  }

  /* =====================================================
     ROLE SELECTION
     ===================================================== */
  function selectRole(role) {
    selectedRole = role;
    document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
    const card = document.getElementById(role === 'jobseeker' ? 'roleJobseeker' : 'roleEmployer');
    if (card) card.classList.add('selected');
  }

  function goRegisterStep2() {
    regStep = 2;
    render();
  }

  /* =====================================================
     FORM INTERACTIONS
     ===================================================== */
  function togglePw(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.innerHTML = isHidden
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  }

  function checkPasswordStrength() {
    const pw = document.getElementById('regPassword')?.value || '';
    const strengthEl = document.getElementById('passwordStrength');
    const fillEl = document.getElementById('strengthFill');
    const labelEl = document.getElementById('strengthLabel');
    if (!strengthEl) return;
    if (!pw) { strengthEl.style.display = 'none'; return; }
    strengthEl.style.display = 'block';
    const s = getPasswordStrength(pw);
    fillEl.className = `strength-fill ${s}`;
    labelEl.className = `strength-label ${s}`;
    labelEl.textContent = getStrengthLabel(s);
  }

  function validateRegEmail() {
    const email = document.getElementById('regEmail')?.value || '';
    if (!email) return;
    const users = getUsers();
    if (users.find(u => u.email === email.trim().toLowerCase())) {
      setFieldError('regEmail', 'อีเมลนี้ถูกใช้งานแล้ว');
    } else {
      clearFieldError('regEmail');
    }
  }

  /* =====================================================
     SUBMIT: LOGIN
     ===================================================== */
  function submitLogin(e) {
    e.preventDefault();
    clearAllErrors();
    const email    = document.getElementById('loginEmail')?.value.trim() || '';
    const password = document.getElementById('loginPassword')?.value || '';
    let valid = true;

    if (!validateEmail(email)) {
      setFieldError('loginEmail', 'กรุณากรอกอีเมลให้ถูกต้อง');
      valid = false;
    }
    if (!password) {
      setFieldError('loginPassword', 'กรุณากรอกรหัสผ่าน');
      valid = false;
    }
    if (!valid) return;

    const btn = document.getElementById('loginSubmit');
    btn.classList.add('loading');
    btn.disabled = true;

    setTimeout(() => {
      const users = getUsers();
      const user = users.find(u => u.email === email.toLowerCase() && u.password === password);
      btn.classList.remove('loading');
      btn.disabled = false;

      if (!user) {
        setFieldError('loginEmail', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        setFieldError('loginPassword', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        return;
      }
      // Login success
      saveSession(user);
      close();
      AuthUI.updateNavbar(user);
      Components.showToast({
        icon: '👋',
        title: `ยินดีต้อนรับ ${user.firstName}!`,
        message: 'เข้าสู่ระบบสำเร็จ',
        type: 'success',
        duration: 3000,
      });
    }, 1200);
  }

  /* =====================================================
     SUBMIT: REGISTER
     ===================================================== */
  function submitRegister(e) {
    e.preventDefault();
    clearAllErrors();

    const firstName = document.getElementById('regFirstName')?.value.trim() || '';
    const lastName  = document.getElementById('regLastName')?.value.trim()  || '';
    const email     = document.getElementById('regEmail')?.value.trim()     || '';
    const password  = document.getElementById('regPassword')?.value         || '';
    const confirm   = document.getElementById('regPasswordConfirm')?.value  || '';
    const terms     = document.getElementById('regTerms')?.checked;
    let valid = true;

    if (!firstName) { setFieldError('regFirstName', 'กรุณากรอกชื่อ'); valid = false; }
    if (!lastName)  { setFieldError('regLastName',  'กรุณากรอกนามสกุล'); valid = false; }
    if (!validateEmail(email)) { setFieldError('regEmail', 'กรุณากรอกอีเมลให้ถูกต้อง'); valid = false; }
    if (!validatePassword(password)) { setFieldError('regPassword', 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); valid = false; }
    if (password !== confirm) { setFieldError('regPasswordConfirm', 'รหัสผ่านไม่ตรงกัน'); valid = false; }
    if (!terms) { setFieldError('regTerms', 'กรุณายอมรับข้อกำหนดการใช้งาน'); valid = false; }

    const users = getUsers();
    if (users.find(u => u.email === email.toLowerCase())) {
      setFieldError('regEmail', 'อีเมลนี้ถูกใช้งานแล้ว'); valid = false;
    }
    if (!valid) return;

    const btn = document.getElementById('registerSubmit');
    btn.classList.add('loading');
    btn.disabled = true;

    setTimeout(() => {
      const newUser = {
        id: Date.now(),
        firstName,
        lastName,
        email: email.toLowerCase(),
        password,
        role: selectedRole,
        phone: document.getElementById('regPhone')?.value.trim() || '',
        createdAt: new Date().toISOString(),
        avatar: (firstName[0] + lastName[0]).toUpperCase(),
      };
      users.push(newUser);
      saveUsers(users);
      saveSession(newUser);

      btn.classList.remove('loading');
      btn.disabled = false;
      close();
      AuthUI.updateNavbar(newUser);
      Components.showToast({
        icon: '🎉',
        title: `ยินดีต้อนรับ ${firstName}!`,
        message: 'สมัครสมาชิกสำเร็จ ยินดีต้อนรับสู่ mejob',
        type: 'success',
        duration: 4000,
      });
    }, 1400);
  }

  /* =====================================================
     SUBMIT: FORGOT PASSWORD
     ===================================================== */
  function submitForgot(e) {
    e.preventDefault();
    clearAllErrors();
    const email = document.getElementById('forgotEmail')?.value.trim() || '';

    if (!validateEmail(email)) {
      setFieldError('forgotEmail', 'กรุณากรอกอีเมลให้ถูกต้อง');
      return;
    }

    const btn = document.getElementById('forgotSubmit');
    btn.classList.add('loading');
    btn.disabled = true;

    setTimeout(() => {
      btn.classList.remove('loading');
      btn.disabled = false;
      // Show success regardless (for security)
      const content = getContent();
      if (content) content.innerHTML = tmplEmailSent(email);
    }, 1200);
  }

  /* =====================================================
     SOCIAL LOGIN (Demo)
     ===================================================== */
  function socialLogin(provider) {
    close();
    Components.showToast({
      icon: provider === 'Google' ? '🔵' : '🔷',
      title: `เข้าสู่ระบบด้วย ${provider}`,
      message: 'กำลังเชื่อมต่อ... (Demo mode)',
      type: 'info',
      duration: 2500,
    });
  }

  /* =====================================================
     LOGOUT
     ===================================================== */
  function logout() {
    clearSession();
    AuthUI.updateNavbar(null);
    Components.showToast({
      icon: '👋',
      title: 'ออกจากระบบแล้ว',
      message: 'ขอบคุณที่ใช้บริการ mejob',
      type: 'info',
      duration: 2500,
    });
  }

  /* =====================================================
     PUBLIC API
     ===================================================== */
  return {
    open,
    close,
    showView,
    selectRole,
    goRegisterStep2,
    togglePw,
    checkPasswordStrength,
    validateRegEmail,
    submitLogin,
    submitRegister,
    submitForgot,
    socialLogin,
    logout,
    getSession,
  };

})();


/* =====================================================
   AUTH UI — Navbar integration & DOM setup
   ===================================================== */
const AuthUI = (() => {

  /* Inject auth modal HTML into body */
  function injectModal() {
    if (document.getElementById('authOverlay')) return;
    const div = document.createElement('div');
    div.innerHTML = `
      <div class="auth-overlay" id="authOverlay">
        <div class="auth-modal">
          <button class="auth-modal__close" id="authClose" aria-label="ปิด">✕</button>
          <div class="auth-modal__inner" id="authContent"></div>
        </div>
      </div>
    `;
    document.body.appendChild(div.firstElementChild);

    // Close events
    document.getElementById('authClose')?.addEventListener('click', () => Auth.close());
    document.getElementById('authOverlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'authOverlay') Auth.close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') Auth.close();
    });
  }

  /* Update navbar based on session */
  function updateNavbar(user) {
    const actionsEl = document.querySelector('.navbar__actions');
    if (!actionsEl) return;

    if (!user) {
      // Logged out state
      actionsEl.innerHTML = `
        <button class="btn btn--ghost" id="btnLogin">เข้าสู่ระบบ</button>
        <button class="btn btn--primary" id="btnRegister">สมัครฟรี</button>
        <button class="hamburger" id="hamburger" aria-label="เมนู">
          <span></span><span></span><span></span>
        </button>
      `;
      document.getElementById('btnLogin')?.addEventListener('click', () => Auth.open('login'));
      document.getElementById('btnRegister')?.addEventListener('click', () => Auth.open('register'));
      UI.initHamburger();
    } else {
      // Logged in state
      const roleLabel = user.role === 'employer' ? 'employer' : 'jobseeker';
      const roleText  = user.role === 'employer' ? 'นายจ้าง' : 'ผู้หางาน';
      actionsEl.innerHTML = `
        <button class="btn btn--primary" id="btnPost">ลงประกาศฟรี</button>
        <div class="user-menu" id="userMenu">
          <button class="user-avatar-btn" id="userAvatarBtn" aria-expanded="false">
            <div class="user-avatar">${user.avatar || user.firstName[0]}</div>
            <span class="user-name">${user.firstName}</span>
            <span class="user-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg></span>
          </button>
          <div class="user-dropdown" id="userDropdown">
            <div class="user-dropdown__header">
              <div class="user-dropdown__avatar">${user.avatar || user.firstName[0]}</div>
              <div>
                <div class="user-dropdown__name">${user.firstName} ${user.lastName}</div>
                <div class="user-dropdown__email">${user.email}</div>
                <span class="user-dropdown__role-badge ${roleLabel}">${roleText}</span>
              </div>
            </div>
            <div class="user-dropdown__menu">
              <button class="dropdown-item" onclick="AuthUI.closeDropdown()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                โปรไฟล์ของฉัน
              </button>
              ${user.role === 'jobseeker' ? `
              <button class="dropdown-item" onclick="AuthUI.closeDropdown()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                งานที่บันทึกไว้
              </button>
              <button class="dropdown-item" onclick="AuthUI.closeDropdown()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                ประวัติการสมัคร
              </button>` : `
              <button class="dropdown-item" onclick="AuthUI.closeDropdown()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                ประกาศงานของฉัน
              </button>
              <button class="dropdown-item" onclick="AuthUI.closeDropdown()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                ผู้สมัครงาน
              </button>`}
              <div class="dropdown-divider"></div>
              <button class="dropdown-item" onclick="AuthUI.closeDropdown()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                ตั้งค่าบัญชี
              </button>
              <button class="dropdown-item logout" onclick="Auth.logout()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
        <button class="hamburger" id="hamburger" aria-label="เมนู">
          <span></span><span></span><span></span>
        </button>
      `;
      initDropdown();
      document.getElementById('btnPost')?.addEventListener('click', () => {
        document.getElementById('modalOverlay')?.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
      UI.initHamburger();
    }
  }

  /* Dropdown toggle */
  function initDropdown() {
    const menu = document.getElementById('userMenu');
    const btn  = document.getElementById('userAvatarBtn');
    if (!menu || !btn) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
    });

    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target)) {
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', false);
      }
    });
  }

  function closeDropdown() {
    const menu = document.getElementById('userMenu');
    if (menu) menu.classList.remove('open');
  }

  /* Init: inject modal + restore session + wire existing buttons */
  function init() {
    injectModal();
    const session = Auth.getSession();

    if (session) {
      updateNavbar(session);
    } else {
      // Wire up existing login/post buttons
      document.getElementById('btnLogin')?.addEventListener('click', () => Auth.open('login'));
      document.getElementById('btnPost')?.addEventListener('click', () => {
        // If not logged in, prompt auth first
        Auth.open('login');
        setTimeout(() => {
          Components.showToast({
            icon: '🔐',
            title: 'กรุณาเข้าสู่ระบบก่อน',
            message: 'เพื่อลงประกาศงานต้องเข้าสู่ระบบ',
            type: 'warning',
            duration: 3000,
          });
        }, 300);
      });

      // CTA banner button
      document.querySelectorAll('.btn--white, .cta-banner__btns .btn').forEach(btn => {
        btn.addEventListener('click', () => Auth.open('register'));
      });
    }
  }

  return { init, updateNavbar, closeDropdown };
})();
