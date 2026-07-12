/* Auth View: Login / Signup Screen (Mockup Aligned) */

import { db } from '../db.js';

export const LoginView = {
  title: 'Authentication',
  
  render(container, onLoginSuccess, appInstance) {
    let isRegisterMode = false;
    
    const drawCard = () => {
      container.innerHTML = `
        <div class="glass-panel auth-card animate-slide-up" style="border: 1px solid rgba(255,255,255,0.08); box-shadow: var(--shadow-lg);">
          <div class="auth-brand" style="margin-bottom: 24px;">
            <!-- Premium Interlocking SVG Logo representing OmniSync -->
            <svg width="44" height="44" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin: 0 auto 16px auto; filter: drop-shadow(0 0 8px var(--primary-glow));">
              <defs>
                <linearGradient id="logo-grad-login" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="var(--primary)" />
                  <stop offset="100%" stop-color="var(--secondary)" />
                </linearGradient>
              </defs>
              <path d="M20,3 L35,11.5 L35,28.5 L20,37 L5,28.5 L5,11.5 Z" stroke="url(#logo-grad-login)" stroke-width="2.5" stroke-linejoin="round" fill="rgba(255,255,255,0.01)" />
              <path d="M20,10 L28,15 L28,25 L20,30 L12,25 L12,15 Z" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="2 2" />
              <circle cx="20" cy="20" r="5" fill="url(#logo-grad-login)" />
              <path d="M20,10 A10,10 0 0,1 30,20" stroke="#fff" stroke-width="2" stroke-linecap="round" />
              <path d="M20,30 A10,10 0 0,1 10,20" stroke="#fff" stroke-width="2" stroke-linecap="round" />
            </svg>
            <div style="font-family: var(--font-display); font-weight: 800; font-size: 2.1rem; color: #fff; letter-spacing: -0.04em; margin-bottom: 2px;">
              OMNI<span style="color: var(--primary);">SYNC</span>
            </div>
            <p class="auth-subtitle" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); font-weight: 700;">Enterprise ERP Suite</p>
          </div>
          
          <form id="authForm">
            ${isRegisterMode ? `
              <div class="form-group animate-fade-in">
                <label for="regName">Full Name</label>
                <input type="text" id="regName" class="form-input" placeholder="e.g. Priya Patel" required style="background:var(--bg-input); border-color:var(--border-color);" />
              </div>
            ` : ''}
            
            <div class="form-group">
              <label for="authEmail">Corporate Email</label>
              <input type="email" id="authEmail" class="form-input" placeholder="name@omnisync.com" required style="background:var(--bg-input); border-color:var(--border-color);" />
            </div>
            
            <div class="form-group" style="margin-bottom: 8px;">
              <label for="authPassword">Password</label>
              <input type="password" id="authPassword" class="form-input" placeholder="••••••••••••" required style="background:var(--bg-input); border-color:var(--border-color);" />
            </div>

            ${!isRegisterMode ? `
              <div style="text-align: right; margin-bottom: 20px;">
                <a href="#" id="forgotPasswordLink" class="text-btn" style="font-size:0.75rem; color:var(--text-muted);">Forgot password</a>
              </div>
            ` : ''}
 
            <!-- Signup Info note matching Excalidraw mockup text -->
            <div class="auth-note-box" style="border: 1px solid var(--border-color); background: rgba(255,255,255,0.015);">
              ${isRegisterMode 
                ? 'Sign up requests an active Employee profile. Role access (Manager, Head) must be promoted by the Admin.' 
                : 'New user? Sign up creates an employee account. Admin roles are assigned later by system administrators.'}
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; margin-bottom: 16px; font-weight:700; border-radius: var(--border-radius-sm);">
              ${isRegisterMode ? 'Create Account' : 'Sign In'}
            </button>
          </form>
          
          <div style="text-align: center; font-size: 0.8rem; color: var(--text-muted);">
            ${isRegisterMode ? 'Already have an account?' : 'Need an account?'}
            <button id="toggleAuthModeBtn" class="text-btn" style="font-weight: 700; margin-left:4px; color:var(--primary);">
              ${isRegisterMode ? 'Sign In' : 'Create Account'}
            </button>
          </div>
 
          <!-- Hackathon evaluator credentials helper -->
          <div class="auth-helper-accounts" style="margin-top: 20px; border-top: 1px solid var(--border-color); padding-top: 16px;">
            <h5 style="font-size:0.65rem; letter-spacing:0.08em; text-align:left; display:flex; align-items:center; gap:6px;"><i data-lucide="key" style="width:12px;height:12px;color:var(--primary);"></i> PRE-SEEDED EVALUATION ACCOUNTS</h5>
            
            <button class="helper-account-btn" data-email="admin@omnisync.com" data-pass="omniAdmin@2026">
              <span>Admin Role</span>
              <code>admin@omnisync.com</code>
            </button>
            
            <button class="helper-account-btn" data-email="manager@omnisync.com" data-pass="omniManager@2026">
              <span>Asset Manager</span>
              <code>manager@omnisync.com</code>
            </button>
            
            <button class="helper-account-btn" data-email="head@omnisync.com" data-pass="omniHead@2026">
              <span>Dept Head</span>
              <code>head@omnisync.com</code>
            </button>
            
            <button class="helper-account-btn" data-email="employee@omnisync.com" data-pass="omniEmployee@2026">
              <span>Employee</span>
              <code>employee@omnisync.com</code>
            </button>
          </div>
        </div>
      `;

      lucide.createIcons();
      bindCardEvents();
    };

    const bindCardEvents = () => {
      const form = container.querySelector('#authForm');
      const toggleBtn = container.querySelector('#toggleAuthModeBtn');
      const forgotLink = container.querySelector('#forgotPasswordLink');

      // Form submit handler
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (isRegisterMode) {
          const name = container.querySelector('#regName').value;
          const email = container.querySelector('#authEmail').value;
          const pass = container.querySelector('#authPassword').value;

          try {
            const user = db.signupEmployee(name, email, pass);
            appInstance.showToast('Success', 'Registered successfully! Automatically logging in.', 'success');
            onLoginSuccess(user);
          } catch (err) {
            appInstance.showToast('Signup Failed', err.message, 'danger');
          }
        } else {
          const email = container.querySelector('#authEmail').value;
          const pass = container.querySelector('#authPassword').value;

          const user = db.validateLogin(email, pass);
          if (user) {
            onLoginSuccess(user);
          } else {
            appInstance.showToast('Access Denied', 'Invalid credentials or inactive account.', 'danger');
          }
        }
      });

      // Toggle signup/signin
      toggleBtn.addEventListener('click', () => {
        isRegisterMode = !isRegisterMode;
        drawCard();
      });

      // Forgot Password dialog popup
      if (forgotLink) {
        forgotLink.addEventListener('click', (e) => {
          e.preventDefault();
          appInstance.showToast('Security Instructions', 'Contact the Admin to reset your credentials database record.', 'info');
        });
      }

      // Hackathon account pre-loader click bindings
      container.querySelectorAll('.helper-account-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const email = e.currentTarget.dataset.email;
          const pass = e.currentTarget.dataset.pass;
          
          if (isRegisterMode) {
            isRegisterMode = false;
            drawCard();
          }

          container.querySelector('#authEmail').value = email;
          container.querySelector('#authPassword').value = pass;
          
          appInstance.showToast('Preloaded', 'Evaluator credentials loaded.', 'info');
        });
      });
    };

    drawCard();
  }
};
