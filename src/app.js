/* AssetFlow SPA Router & Controller */

import { db, TABLES } from './db.js';
import { LoginView } from './views/loginView.js';
import { DashboardView } from './views/dashboardView.js';
import { OrgSetupView } from './views/orgSetupView.js';
import { AssetsView } from './views/assetsView.js';
import { AllocationView } from './views/allocationView.js';
import { BookingView } from './views/bookingView.js';
import { MaintenanceView } from './views/maintenanceView.js';
import { AuditView } from './views/auditView.js';
import { ReportsView } from './views/reportsView.js';
import { ActivityView } from './views/activityView.js';

class Application {
  constructor() {
    this.currentUser = null;
    this.currentViewKey = null;
    this.activeTimeWarpDays = 0; // Tracks virtual days added
    
    // View registry mapping hashes to view managers
    this.views = {
      'dashboard': DashboardView,
      'assets': AssetsView,
      'allocations': AllocationView,
      'bookings': BookingView,
      'maintenance': MaintenanceView,
      'audits': AuditView,
      'reports': ReportsView,
      'activity': ActivityView,
      'org-setup': OrgSetupView
    };

    this.initElements();
    this.bindEvents();
    this.initAiCompanion();
  }

  // Find DOM nodes
  initElements() {
    this.appContainer = document.getElementById('appContainer');
    this.authContainer = document.getElementById('authContainer');
    this.mainViewport = document.getElementById('mainViewport');
    this.pageTitle = document.getElementById('pageTitle');
    
    this.profileName = document.getElementById('profileName');
    this.profileRole = document.getElementById('profileRole');
    this.userAvatar = document.getElementById('userAvatar');
    this.logoutBtn = document.getElementById('logoutBtn');
    
    this.sidebarToggleOpen = document.getElementById('sidebarToggleOpen');
    this.sidebarToggleClose = document.getElementById('sidebarToggleClose');
    this.sidebar = document.getElementById('sidebar');
    
    this.themeToggleBtn = document.getElementById('themeToggleBtn');
    this.notificationToggleBtn = document.getElementById('notificationToggleBtn');
    this.notificationDropdown = document.getElementById('notificationDropdown');
    this.unreadBadge = document.getElementById('unreadNotificationBadge');
    this.notificationList = document.getElementById('notificationList');
    this.markAllReadBtn = document.getElementById('markAllReadBtn');
    
    this.globalSearchInput = document.getElementById('globalSearchInput');
    this.globalSearchResults = document.getElementById('globalSearchResults');
    
    this.modalOverlay = document.getElementById('modalOverlay');
    this.modalCard = document.getElementById('modalCard');
    
    // Sandbox Elements
    this.sidebarDevSandboxBtn = document.getElementById('sidebarDevSandboxBtn');
    this.devSandboxPanel = document.getElementById('devSandboxPanel');
    this.devSandboxCloseBtn = document.getElementById('devSandboxCloseBtn');
    this.btnRunDiagnostics = document.getElementById('btnRunDiagnostics');
    this.diagnosticResults = document.getElementById('diagnosticResults');
    this.btnWarp7Days = document.getElementById('btnWarp7Days');
    this.btnResetTime = document.getElementById('btnResetTime');
    this.btnResetDb = document.getElementById('btnResetDb');
    
    // Toast Container
    this.toastContainer = document.getElementById('toastContainer');
    this.topProgressBar = document.getElementById('topProgressBar');
    this.progressBarFill = this.topProgressBar.querySelector('.progress-bar-fill');
    
    // Spotlight Elements
    this.spotlightToggleBtn = document.getElementById('spotlightToggleBtn');
    this.spotlightOverlay = document.getElementById('spotlightOverlay');
    this.spotlightInput = document.getElementById('spotlightInput');
    this.spotlightBody = document.getElementById('spotlightBody');

    // AI Companion Elements
    this.aiCompanion = document.getElementById('aiCompanion');
    this.aiCompanionBubble = document.getElementById('aiCompanionBubble');
    this.aiCompanionAvatar = document.getElementById('aiCompanionAvatar');
    this.aiBubbleClose = document.getElementById('aiBubbleClose');
    this.aiBubbleSpeech = document.getElementById('aiBubbleSpeech');
  }

  // Setup layout events
  bindEvents() {
    // Router Hashchange
    window.addEventListener('hashchange', () => this.handleRouting());
    
    // Logout Action
    this.logoutBtn.addEventListener('click', () => this.logout());
    
    // Mobile Navigation Menu Toggle
    this.sidebarToggleOpen.addEventListener('click', () => this.sidebar.classList.add('open'));
    this.sidebarToggleClose.addEventListener('click', () => this.sidebar.classList.remove('open'));
    
    // Click Sidebar Links
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
      link.addEventListener('click', () => {
        this.sidebar.classList.remove('open');
      });
    });

    // Theme Toggle (Dark vs Light Mode)
    this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    
    // Notifications Drawer Panel Toggle
    this.notificationToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.notificationDropdown.classList.toggle('hidden');
    });
    
    document.addEventListener('click', (e) => {
      if (!this.notificationDropdown.classList.contains('hidden') && 
          !this.notificationDropdown.contains(e.target) && 
          e.target !== this.notificationToggleBtn) {
        this.notificationDropdown.classList.add('hidden');
      }
    });

    this.markAllReadBtn.addEventListener('click', () => {
      if (this.currentUser) {
        db.markAllNotificationsRead(this.currentUser.id);
        this.renderNotifications();
        this.showToast('Updated', 'All notifications marked as read', 'info');
      }
    });

    // Close Modal overlay on background click
    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) {
        this.closeModal();
      }
    });

    // Global Search box handler
    this.globalSearchInput.addEventListener('input', () => this.handleGlobalSearch());
    document.addEventListener('click', (e) => {
      if (!this.globalSearchResults.classList.contains('hidden') && 
          !this.globalSearchResults.contains(e.target) && 
          e.target !== this.globalSearchInput) {
        this.globalSearchResults.classList.add('hidden');
      }
    });

    // --- Developer Sandbox Panel Binds ---
    this.sidebarDevSandboxBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.devSandboxPanel.classList.toggle('open');
    });
    
    this.devSandboxCloseBtn.addEventListener('click', () => {
      this.devSandboxPanel.classList.remove('open');
    });

    document.addEventListener('click', (e) => {
      if (this.devSandboxPanel.classList.contains('open') && 
          !this.devSandboxPanel.contains(e.target) && 
          e.target !== this.sidebarDevSandboxBtn) {
        this.devSandboxPanel.classList.remove('open');
      }
    });

    // Sandbox Role Buttons
    this.devSandboxPanel.querySelectorAll('.sandbox-role-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const role = e.currentTarget.dataset.role;
        this.sandboxSwitchRole(role);
      });
    });

    // Time Warp ff 7 Days
    this.btnWarp7Days.addEventListener('click', () => this.sandboxWarpTime(7));
    this.btnResetTime.addEventListener('click', () => this.sandboxResetTime());

    // Diagnostics Test runner
    this.btnRunDiagnostics.addEventListener('click', () => this.sandboxRunDiagnostics());

    // Database Reset
    this.btnResetDb.addEventListener('click', () => {
      if (confirm('Reset database back to default seed? This clears all recent changes.')) {
        db.reset();
        this.showToast('Database Reset', 'System has been re-seeded to default records.', 'success');
        this.sandboxResetTime();
        this.logout();
      }
    });

    // DB Update Listener (sync views if multi-tabs)
    window.addEventListener('omnisync_db_update', () => {
      this.renderNotifications();
      if (this.currentUser && this.currentViewKey) {
        this.renderCurrentView();
      }
    });

    // Spotlight binds
    this.spotlightToggleBtn.addEventListener('click', () => this.toggleSpotlight());
    this.spotlightOverlay.addEventListener('click', (e) => {
      if (e.target === this.spotlightOverlay) this.closeSpotlight();
    });
    this.spotlightInput.addEventListener('input', () => this.handleSpotlightSearch());
    
    // Global hotkey Ctrl+K / Cmd+K
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.toggleSpotlight();
      }
    });
    
    // ESC key listener inside input
    this.spotlightInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeSpotlight();
      }
    });
  }

  // --- Initializer Startup ---
  start() {
    // Check local session
    const savedUser = sessionStorage.getItem('omnisync_user');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      this.loginSuccess(this.currentUser);
    } else {
      this.renderLoginScreen();
    }
    
    // Trigger Lucide SVG loader
    lucide.createIcons();
  }

  // --- Login flow ---
  renderLoginScreen() {
    // Always force dark theme for login/signup pages
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
    this.appContainer.classList.add('hidden');
    this.authContainer.classList.remove('hidden');
    
    LoginView.render(this.authContainer, (user) => {
      this.loginSuccess(user);
    }, this);
  }

  loginSuccess(user) {
    this.currentUser = user;
    sessionStorage.setItem('omnisync_user', JSON.stringify(user));
    
    this.authContainer.classList.add('hidden');
    this.appContainer.classList.remove('hidden');
    
    // Set Profile UI Info
    this.profileName.textContent = user.name;
    this.profileRole.textContent = user.role;
    
    // Update role accent HSL theme dynamically
    this.updateRoleTheme(user.role);
    
    // Split initials for avatar bubble
    const parts = user.name.split(' ');
    const initials = parts.map(p => p[0]).slice(0, 2).join('').toUpperCase();
    this.userAvatar.textContent = initials;
    
    // Show dev sandbox highlights
    this.updateSandboxActiveRoleButton();
    
    // Show nav elements restricted to Admins
    const adminNav = document.querySelectorAll('.admin-only-nav');
    if (user.role === 'Admin') {
      adminNav.forEach(el => el.classList.remove('hidden'));
    } else {
      adminNav.forEach(el => el.classList.add('hidden'));
    }

    // Default route to dashboard
    if (!window.location.hash || window.location.hash === '#') {
      window.location.hash = '#dashboard';
    } else {
      this.handleRouting();
    }

    this.renderNotifications();
    this.showToast('Authenticated', `Welcome back, ${user.name}! Accessing panel.`, 'success');
  }

  logout() {
    sessionStorage.removeItem('omnisync_user');
    this.currentUser = null;
    window.location.hash = '';
    this.renderLoginScreen();
  }

  // --- Navigation & Routing engine ---
  async handleRouting() {
    if (!this.currentUser) {
      this.renderLoginScreen();
      return;
    }

    const hash = window.location.hash.substring(1) || 'dashboard';
    const viewKey = hash.split('?')[0]; // strip query variables

    // Privilege validation
    const viewClass = this.views[viewKey];
    if (!viewClass) {
      this.showToast('Route Error', 'Requested workspace page not found.', 'danger');
      window.location.hash = '#dashboard';
      return;
    }

    if (viewClass.allowedRoles && !viewClass.allowedRoles.includes(this.currentUser.role)) {
      this.showToast('Security Alert', `Page access restricted to ${viewClass.allowedRoles.join('/')} only.`, 'danger');
      window.location.hash = '#dashboard';
      return;
    }

    this.currentViewKey = viewKey;
    
    // Highlight sidebar active link
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
      if (link.dataset.view === viewKey) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Loading Bar Animation
    this.progressBarFill.style.width = '20%';
    this.topProgressBar.style.opacity = '1';
    
    setTimeout(() => {
      this.progressBarFill.style.width = '60%';
    }, 50);

    // Title and view render
    this.pageTitle.textContent = viewClass.title || 'Workspace';
    await this.renderCurrentView();

    setTimeout(() => {
      this.progressBarFill.style.width = '100%';
      setTimeout(() => {
        this.topProgressBar.style.opacity = '0';
        this.progressBarFill.style.width = '0%';
      }, 200);
    }, 200);
  }

  async renderCurrentView() {
    const viewClass = this.views[this.currentViewKey];
    if (viewClass) {
      this.mainViewport.innerHTML = '';
      const viewDiv = document.createElement('div');
      viewDiv.className = 'animate-slide-up';
      this.mainViewport.appendChild(viewDiv);
      
      // Render view content
      await viewClass.render(viewDiv, this);
      
      // Load Lucide SVG Icons
      lucide.createIcons();
      
      // Automatically refresh Syncie description if bubble is visible
      if (this.aiCompanionBubble && !this.aiCompanionBubble.classList.contains('hidden')) {
        this.updateAiSpeechBubble();
      }
    }
  }

  // --- Spotlight Command Bar Overlay Engine ---
  toggleSpotlight() {
    if (!this.currentUser) return;
    
    const isOpen = !this.spotlightOverlay.classList.contains('hidden');
    if (isOpen) {
      this.closeSpotlight();
    } else {
      this.spotlightOverlay.classList.remove('hidden');
      this.spotlightInput.value = '';
      this.spotlightInput.focus();
      this.handleSpotlightSearch(); // Draw initial suggestions
      document.body.style.overflow = 'hidden'; // Suppress scrolling
    }
  }

  closeSpotlight() {
    this.spotlightOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  handleSpotlightSearch() {
    const val = this.spotlightInput.value.toLowerCase().trim();
    this.spotlightBody.innerHTML = '';
    
    // 1. Static list of core commands
    const staticCommands = [
      { name: 'Switch Session to Admin', category: 'Sandbox role switches', shortcut: 'switch admin', action: () => this.sandboxSwitchRole('Admin') },
      { name: 'Switch Session to Manager', category: 'Sandbox role switches', shortcut: 'switch manager', action: () => this.sandboxSwitchRole('Asset Manager') },
      { name: 'Switch Session to Dept Head', category: 'Sandbox role switches', shortcut: 'switch head', action: () => this.sandboxSwitchRole('Department Head') },
      { name: 'Switch Session to Employee', category: 'Sandbox role switches', shortcut: 'switch employee', action: () => this.sandboxSwitchRole('Employee') },
      { name: 'Fast Forward Time (+7 Days)', category: 'Sandbox actions', shortcut: 'warp 7', action: () => this.sandboxWarpTime(7) },
      { name: 'Run Diagnostics validation', category: 'Sandbox actions', shortcut: 'diagnostics', action: () => { this.sandboxRunDiagnostics(); this.devSandboxPanel.classList.add('open'); } },
      { name: 'Reset Local Database', category: 'Sandbox actions', shortcut: 'reset db', action: () => { if (confirm('Reset database?')) { db.reset(); this.logout(); } } },
      { name: 'Navigate to Dashboard Overview', category: 'ERP routing', shortcut: 'goto dashboard', action: () => { window.location.hash = '#dashboard'; } },
      { name: 'Navigate to Asset Registry list', category: 'ERP routing', shortcut: 'goto assets', action: () => { window.location.hash = '#assets'; } },
      { name: 'Navigate to Allocations panel', category: 'ERP routing', shortcut: 'goto allocations', action: () => { window.location.hash = '#allocations'; } },
      { name: 'Navigate to Booking Calendar', category: 'ERP routing', shortcut: 'goto bookings', action: () => { window.location.hash = '#bookings'; } },
      { name: 'Navigate to Maintenance Kanban', category: 'ERP routing', shortcut: 'goto maintenance', action: () => { window.location.hash = '#maintenance'; } },
      { name: 'Navigate to Audits cycles', category: 'ERP routing', shortcut: 'goto audits', action: () => { window.location.hash = '#audits'; } },
      { name: 'Navigate to Reports Analytics', category: 'ERP routing', shortcut: 'goto reports', action: () => { window.location.hash = '#reports'; } }
    ];

    // Filter commands
    const matchedCommands = staticCommands.filter(c => 
      c.name.toLowerCase().includes(val) || 
      c.shortcut.toLowerCase().includes(val) ||
      c.category.toLowerCase().includes(val)
    );

    // Group commands by category
    const categories = {};
    matchedCommands.forEach(c => {
      if (!categories[c.category]) categories[c.category] = [];
      categories[c.category].push(c);
    });

    // Render Commands
    Object.keys(categories).forEach(cat => {
      const title = document.createElement('div');
      title.className = 'spotlight-section-title';
      title.textContent = cat;
      this.spotlightBody.appendChild(title);
      
      const list = document.createElement('ul');
      list.className = 'spotlight-result-list';
      
      categories[cat].forEach(c => {
        const item = document.createElement('li');
        item.className = 'spotlight-result-item';
        item.innerHTML = `
          <div class="spotlight-result-left">
            <i data-lucide="sparkles"></i>
            <span>${c.name}</span>
          </div>
          <span class="spotlight-result-shortcut">${c.shortcut}</span>
        `;
        
        item.addEventListener('click', () => {
          this.closeSpotlight();
          c.action();
        });
        
        list.appendChild(item);
      });
      
      this.spotlightBody.appendChild(list);
    });

    // 2. Dynamic list of matching assets
    if (val.length >= 2) {
      const assets = db.get(TABLES.ASSETS);
      const matchedAssets = assets.filter(a => 
        a.tag.toLowerCase().includes(val) || 
        a.name.toLowerCase().includes(val) || 
        a.serialNumber.toLowerCase().includes(val)
      ).slice(0, 5);

      if (matchedAssets.length > 0) {
        const title = document.createElement('div');
        title.className = 'spotlight-section-title';
        title.textContent = 'Matching Live Assets';
        this.spotlightBody.appendChild(title);
        
        const list = document.createElement('ul');
        list.className = 'spotlight-result-list';
        
        matchedAssets.forEach(a => {
          const item = document.createElement('li');
          item.className = 'spotlight-result-item';
          item.innerHTML = `
            <div class="spotlight-result-left">
              <i data-lucide="package"></i>
              <span>${a.name} (${a.tag}) — Status: <strong>${a.status}</strong></span>
            </div>
            <span class="spotlight-result-shortcut">open detail</span>
          `;
          
          item.addEventListener('click', () => {
            this.closeSpotlight();
            this.openAssetDetailModal(a.id);
          });
          
          list.appendChild(item);
        });
        
        this.spotlightBody.appendChild(list);
      }
    }
    
    lucide.createIcons();
  }

  // --- Global Toast Notifications Hub ---
  showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info';
    if (type === 'success') icon = 'check-circle-2';
    if (type === 'danger') icon = 'alert-octagon';
    if (type === 'warning') icon = 'alert-triangle';

    toast.innerHTML = `
      <i data-lucide="${icon}"></i>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-msg">${message}</div>
      </div>
    `;

    this.toastContainer.appendChild(toast);
    lucide.createIcons({ attrs: { class: 'toast-icon' } });

    // Shockwave submit animation on active panel/card if success
    if (type === 'success') {
      const activeForm = document.querySelector('form');
      const activeCard = activeForm ? activeForm.closest('.glass-panel') : document.querySelector('.glass-panel');
      if (activeCard) {
        this.triggerSubmitAnimation(activeCard);
      }
    }

    // Auto-remove after 4 seconds
    setTimeout(() => {
      toast.style.animation = 'fadeIn 0.3s reverse forwards';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 4000);
  }

  // Trigger card submit shockwave ripple (Mockup visual addition)
  triggerSubmitAnimation(element) {
    if (!element) return;
    element.classList.remove('success-submit-pulse');
    void element.offsetWidth; // Force reflow
    element.classList.add('success-submit-pulse');
    setTimeout(() => {
      element.classList.remove('success-submit-pulse');
    }, 500);
  }

  // Update primary HSL theme coordinates based on role (Visual theme customization)
  updateRoleTheme(role) {
    let hue = 263; // Admin - Purple (Default)
    let sat = '70%';
    let light = '50%';
    
    if (role === 'Asset Manager') {
      hue = 142; // Manager - Emerald Green
      sat = '70%';
      light = '45%';
    } else if (role === 'Department Head') {
      hue = 190; // Head - Cyan/Teal
      sat = '90%';
      light = '40%';
    } else if (role === 'Employee') {
      hue = 217; // Employee - Blue
      sat = '90%';
      light = '56%';
    }
    
    const body = document.body;
    body.style.setProperty('--primary-hue', hue);
    body.style.setProperty('--primary-sat', sat);
    body.style.setProperty('--primary-light', light);
  }

  // Initialize AI Companion Chatbot "Syncie" (movable & assisting)
  initAiCompanion() {
    if (!this.aiCompanion || !this.aiCompanionAvatar) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    // Mouse Drag Listeners
    this.aiCompanionAvatar.addEventListener('mousedown', (e) => {
      // Ignore right clicks
      if (e.button !== 0) return;
      
      e.preventDefault();
      isDragging = false;
      startX = e.clientX;
      startY = e.clientY;

      const rect = this.aiCompanion.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;

      const onMouseMove = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          isDragging = true;
        }

        // Apply new coordinates, disabling bottom/right anchors
        this.aiCompanion.style.bottom = 'auto';
        this.aiCompanion.style.right = 'auto';
        this.aiCompanion.style.left = `${startLeft + dx}px`;
        this.aiCompanion.style.top = `${startTop + dy}px`;
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        if (!isDragging) {
          // If not dragged, treat as normal click -> toggle bubble
          this.toggleAiBubble();
        }
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    // Touch Drag support for mobile/trackpads
    this.aiCompanionAvatar.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      isDragging = false;
      startX = touch.clientX;
      startY = touch.clientY;

      const rect = this.aiCompanion.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;

      const onTouchMove = (moveEvent) => {
        const t = moveEvent.touches[0];
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;

        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          isDragging = true;
        }

        this.aiCompanion.style.bottom = 'auto';
        this.aiCompanion.style.right = 'auto';
        this.aiCompanion.style.left = `${startLeft + dx}px`;
        this.aiCompanion.style.top = `${startTop + dy}px`;
      };

      const onTouchEnd = () => {
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);

        if (!isDragging) {
          this.toggleAiBubble();
        }
      };

      document.addEventListener('touchmove', onTouchMove);
      document.addEventListener('touchend', onTouchEnd);
    });

    // Close button click
    this.aiBubbleClose.addEventListener('click', (e) => {
      e.stopPropagation();
      this.aiCompanionBubble.classList.add('hidden');
    });
  }

  toggleAiBubble() {
    const isHidden = this.aiCompanionBubble.classList.contains('hidden');
    if (isHidden) {
      this.aiCompanionBubble.classList.remove('hidden');
      this.updateAiSpeechBubble();
    } else {
      this.aiCompanionBubble.classList.add('hidden');
    }
  }

  updateAiSpeechBubble() {
    const screenSpeech = {
      dashboard: "Welcome to the central Command. Click 'Mock QR Scanner' to test properties check-ins, or toggle active sandbox parameters.",
      assets: "You are on the Assets Registry. Click room zones on the floor plan map above to filter locations, or add catalog items.",
      allocations: "Managing check-out allocations. Select rows to return items, or approve swaps in the transfer requests section.",
      bookings: "This is the Booking Calendar grid. Reserve vehicles or spaces by clicking empty grid slots or drag-selecting spans.",
      maintenance: "This is the Maintenance Kanban board. Drag asset repair cards to complete work and automatically sync conditions.",
      audits: "Conduct active inventory cycle audits. Click OK/Faulty/Lost directly inside the in-line checklist sheet to sync logs.",
      reports: "Review density heatmaps of asset utilization. Hover over cells to see allocations count, or download CSV files.",
      'org-setup': "Set up structural hierarchy parameters. Add corporate sites, offices, or departments to register items under."
    };

    const text = screenSpeech[this.currentViewKey] || "Hi! I am Syncie, your OmniSync companion. How can I help you manage operations today?";
    this.aiBubbleSpeech.innerHTML = text;
  }

  // --- Modal Manager ---
  openModal(contentHTML, onRenderCallback = null, widthClass = '') {
    this.modalCard.className = `modal-card scrollbar-custom ${widthClass}`;
    this.modalCard.innerHTML = contentHTML;
    this.modalOverlay.classList.remove('hidden');
    
    // Bind close buttons in modal
    const closeBtns = this.modalCard.querySelectorAll('[data-modal-close]');
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => this.closeModal());
    });

    if (onRenderCallback) {
      onRenderCallback(this.modalCard);
    }
    lucide.createIcons();
  }

  closeModal() {
    this.modalOverlay.classList.add('hidden');
    this.modalCard.innerHTML = '';
  }

  // --- Theme Controller ---
  toggleTheme() {
    if (document.body.classList.contains('dark-theme')) {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      this.showToast('Theme Changed', 'Switched to Light mode workspace.', 'info');
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      this.showToast('Theme Changed', 'Switched to Dark mode workspace.', 'info');
    }
  }

  // --- Notifications Panel Renders ---
  renderNotifications() {
    if (!this.currentUser) return;

    const notifs = db.get(TABLES.NOTIFICATIONS)
      .filter(n => n.userId === this.currentUser.id);
    
    const unreadCount = notifs.filter(n => !n.read).length;

    if (unreadCount > 0) {
      this.unreadBadge.textContent = unreadCount;
      this.unreadBadge.classList.remove('hidden');
    } else {
      this.unreadBadge.classList.add('hidden');
    }

    this.notificationList.innerHTML = '';

    if (notifs.length === 0) {
      this.notificationList.innerHTML = `<div class="notification-empty">No notifications found</div>`;
      return;
    }

    notifs.forEach(n => {
      const item = document.createElement('div');
      item.className = `notification-item ${n.read ? '' : 'unread'}`;
      
      const timeStr = new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      item.innerHTML = `
        <div class="notification-item-icon ${n.type}">
          <i data-lucide="${n.type === 'danger' ? 'alert-octagon' : n.type === 'success' ? 'check-circle-2' : 'bell'}"></i>
        </div>
        <div class="notification-item-content">
          <div class="notification-item-title">${n.title}</div>
          <div class="notification-item-desc">${n.message}</div>
          <div class="notification-item-time">${timeStr}</div>
        </div>
      `;

      item.addEventListener('click', () => {
        db.markNotificationRead(n.id);
        this.renderNotifications();
        
        // If message mentions overdue asset check details
        if (n.message.includes('AF-')) {
          const match = n.message.match(/AF-\d+/);
          if (match) this.openAssetDetailModalByTag(match[0]);
        }
      });

      this.notificationList.appendChild(item);
    });

    lucide.createIcons();
  }

  // --- Global Top Search box logic ---
  handleGlobalSearch() {
    const val = this.globalSearchInput.value.toLowerCase().trim();
    if (!val) {
      this.globalSearchResults.classList.add('hidden');
      return;
    }

    const assets = db.get(TABLES.ASSETS);
    const matches = assets.filter(a => 
      a.tag.toLowerCase().includes(val) || 
      a.name.toLowerCase().includes(val) || 
      a.serialNumber.toLowerCase().includes(val) ||
      a.location.toLowerCase().includes(val)
    ).slice(0, 5); // Limit 5

    this.globalSearchResults.innerHTML = '';

    if (matches.length === 0) {
      this.globalSearchResults.innerHTML = `<div class="notification-empty">No matching assets found</div>`;
      this.globalSearchResults.classList.remove('hidden');
      return;
    }

    matches.forEach(a => {
      const item = document.createElement('div');
      item.className = 'search-result-item';
      item.innerHTML = `
        <div class="search-result-header">
          <span>${a.name}</span>
          <span class="search-result-tag">${a.tag}</span>
        </div>
        <div class="search-result-sub">
          Status: <strong>${a.status}</strong> | Serial: ${a.serialNumber}
        </div>
      `;

      item.addEventListener('click', () => {
        this.globalSearchInput.value = '';
        this.globalSearchResults.classList.add('hidden');
        this.openAssetDetailModal(a.id);
      });

      this.globalSearchResults.appendChild(item);
    });

    this.globalSearchResults.classList.remove('hidden');
  }

  // Open asset detail helper from search tags
  openAssetDetailModalByTag(tag) {
    const assets = db.get(TABLES.ASSETS);
    const asset = assets.find(a => a.tag === tag);
    if (asset) this.openAssetDetailModal(asset.id);
  }

  // Asset details modal pop
  openAssetDetailModal(assetId) {
    const assets = db.get(TABLES.ASSETS);
    const employees = db.get(TABLES.EMPLOYEES);
    const categories = db.get(TABLES.CATEGORIES);
    const allocations = db.get(TABLES.ALLOCATIONS);

    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    const category = categories.find(c => c.id === asset.categoryId);
    const activeAlloc = allocations.find(al => al.assetId === assetId && al.status === 'Active');
    
    let allocatedUserText = 'Unassigned (In Stock)';
    if (activeAlloc) {
      if (activeAlloc.assigneeType === 'employee') {
        const emp = employees.find(e => e.id === activeAlloc.assigneeId);
        allocatedUserText = emp ? `${emp.name} (Employee)` : 'Employee';
      } else {
        const dp = db.get(TABLES.DEPARTMENTS).find(d => d.id === activeAlloc.assigneeId);
        allocatedUserText = dp ? `Department: ${dp.name}` : 'Department';
      }
      if (activeAlloc.expectedReturnDate) {
        allocatedUserText += ` | Expected return: ${activeAlloc.expectedReturnDate}`;
      }
    }

    const historyItems = asset.history.map(h => `
      <div class="timeline-item">
        <div class="timeline-time">${new Date(h.date).toLocaleString()}</div>
        <div class="timeline-title">${h.type}</div>
        <div class="timeline-desc">By ${h.user}. ${h.notes}</div>
      </div>
    `).join('') || '<p style="color:var(--text-muted);font-size:0.85rem">No registry history records available.</p>';

    // Custom Category Specific Info
    let customFieldsHTML = '';
    if (category && category.fields) {
      customFieldsHTML = category.fields.map(f => {
        const val = asset.customValues[f] || 'N/A';
        return `
          <div class="asset-card-detail-item">
            <strong>${f}:</strong> <span>${val}</span>
          </div>
        `;
      }).join('');
    }

    const content = `
      <div class="modal-header">
        <h2>Asset Tag Profile: ${asset.tag}</h2>
        <button class="close-icon-btn" data-modal-close><i data-lucide="x"></i></button>
      </div>
      <div style="display:grid;grid-template-columns: 1fr 1fr; gap: 24px;">
        <div>
          <h3 style="margin-bottom:12px;font-size:1.1rem;border-bottom:1px solid var(--border-color);padding-bottom:6px;">General Metadata</h3>
          <div class="asset-card-details">
            <div class="asset-card-detail-item">
              <strong>Asset Name:</strong> <span>${asset.name}</span>
            </div>
            <div class="asset-card-detail-item">
              <strong>Category:</strong> <span>${category ? category.name : 'Unknown'}</span>
            </div>
            <div class="asset-card-detail-item">
              <strong>Current Status:</strong> <span class="badge badge-${asset.status.toLowerCase().replace(' ', '-')}">${asset.status}</span>
            </div>
            <div class="asset-card-detail-item">
              <strong>Holder/Assignee:</strong> <span>${allocatedUserText}</span>
            </div>
            <div class="asset-card-detail-item">
              <strong>Location:</strong> <span>${asset.location}</span>
            </div>
            <div class="asset-card-detail-item">
              <strong>Acquisition Date:</strong> <span>${asset.acquisitionDate}</span>
            </div>
            <div class="asset-card-detail-item">
              <strong>Acquisition Cost:</strong> <span>$${asset.acquisitionCost.toLocaleString()}</span>
            </div>
            <div class="asset-card-detail-item">
              <strong>Condition:</strong> <span>${asset.condition}</span>
            </div>
            <div class="asset-card-detail-item">
              <strong>Bookable/Shared:</strong> <span>${asset.shared ? 'Yes (Public)' : 'No (Assigned Group)'}</span>
            </div>
            <div class="asset-card-detail-item">
              <strong>Serial Number:</strong> <code style="background:var(--bg-input);padding:2px 6px;border-radius:4px;">${asset.serialNumber}</code>
            </div>
          </div>
          
          ${customFieldsHTML ? `
            <h3 style="margin:16px 0 12px 0;font-size:1.1rem;border-bottom:1px solid var(--border-color);padding-bottom:6px;">Category Specific Fields</h3>
            <div class="asset-card-details">${customFieldsHTML}</div>
          ` : ''}

          <!-- QR Code Mockup Graphic -->
          <div style="margin-top:24px; text-align:center; padding:16px; background:var(--bg-input); border-radius: var(--border-radius-md); border:1px solid var(--border-color);">
            <div style="width:120px; height:120px; background: white; margin:0 auto 10px auto; padding:8px; display:flex; align-items:center; justify-content:center; border-radius: 8px;">
              <!-- Dynamic QR Mockup using standard SVG tags -->
              <svg width="100" height="100" viewBox="0 0 100 100" style="shape-rendering: crispEdges;">
                <path d="M0,0h30v30h-30z M10,10h10v10h-10z M70,0h30v30h-30z M80,10h10v10h-10z M0,70h30v30h-30z M10,80h10v10h-10z M40,10h10v10h-10z M50,40h10v10h-10z M40,60h10v10h-10z M60,60h10v10h-10z M80,80h20v20h-20z M40,80h20v10h-20z" fill="#000"/>
              </svg>
            </div>
            <span style="font-size:0.75rem; color:var(--text-muted); font-family:monospace;">SCAN TAG: ${asset.tag}</span>
          </div>
        </div>
        
        <div>
          <h3 style="margin-bottom:12px;font-size:1.1rem;border-bottom:1px solid var(--border-color);padding-bottom:6px;">Lifecycle History Log</h3>
          <div class="scrollbar-custom" style="max-height:420px; overflow-y:auto; padding-right:12px;">
            <div class="timeline">${historyItems}</div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" data-modal-close>Close profile</button>
      </div>
    `;

    this.openModal(content, null, 'wide');
  }

  // --- Developer Sandbox Switch Role Action ---
  sandboxSwitchRole(role) {
    if (!this.currentUser) return;
    
    // Promote user in local memory database
    db.promoteEmployee('e-1', this.currentUser.id, role);
    
    // Sync current session state
    this.currentUser.role = role;
    sessionStorage.setItem('omnisync_user', JSON.stringify(this.currentUser));
    
    this.profileRole.textContent = role;
    this.updateSandboxActiveRoleButton();
    
    // Update role accent HSL theme dynamically
    this.updateRoleTheme(role);

    // Toggle Admin navigation item
    const adminNav = document.querySelectorAll('.admin-only-nav');
    if (role === 'Admin') {
      adminNav.forEach(el => el.classList.remove('hidden'));
    } else {
      adminNav.forEach(el => el.classList.add('hidden'));
    }

    this.showToast('Sandbox Alert', `Switched role state to ${role}. Reloading views.`, 'success');
    
    // Re-route or refresh view
    this.handleRouting();
  }

  updateSandboxActiveRoleButton() {
    if (!this.currentUser) return;
    this.devSandboxPanel.querySelectorAll('.sandbox-role-btn').forEach(btn => {
      if (btn.dataset.role === this.currentUser.role) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // --- Developer Sandbox Time Warp Action ---
  sandboxWarpTime(days) {
    this.activeTimeWarpDays += days;
    
    // Shift all allocation expected return dates backwards, simulating passing time
    const allocations = db.get(TABLES.ALLOCATIONS);
    const assets = db.get(TABLES.ASSETS);
    const employees = db.get(TABLES.EMPLOYEES);

    let flaggedCount = 0;
    
    allocations.forEach(al => {
      if (al.status === 'Active' && al.expectedReturnDate) {
        // Parse date
        const expDate = new Date(al.expectedReturnDate);
        // Warp date forward: means the expected return date shifts relative to today,
        // OR we shift the current system clock (which we simulate by changing expected date closer to past)
        expDate.setDate(expDate.getDate() - days);
        al.expectedReturnDate = expDate.toISOString().split('T')[0];

        // If it just became overdue
        const asset = assets.find(a => a.id === al.assetId);
        if (asset && expDate < new Date() && al.assigneeType === 'employee') {
          flaggedCount++;
          // Trigger return warnings
          db.addNotification(
            al.assigneeId, 
            'TIME WARP: Return Deadline Passed', 
            `Asset ${asset.tag} (${asset.name}) check-out deadline has passed (${al.expectedReturnDate}). Please return or request extension.`, 
            'danger'
          );
        }
      }
    });

    db.set(TABLES.ALLOCATIONS, allocations);
    db.set(TABLES.ASSETS, assets);

    this.showToast('Time Warp Active', `Simulated +${days} days. Added ${flaggedCount} overdue returns.`, 'warning');
    
    // Refresh current view & notifications
    this.renderNotifications();
    this.renderCurrentView();
  }

  sandboxResetTime() {
    this.activeTimeWarpDays = 0;
    this.showToast('Time Reset', 'Simulated time restored back to local clock.', 'info');
    
    // Re-seed DB to default relative times
    db.reset();
    this.renderNotifications();
    this.renderCurrentView();
  }

  // --- Developer Sandbox Run Diagnostics Test Action ---
  sandboxRunDiagnostics() {
    this.diagnosticResults.classList.remove('hidden');
    this.diagnosticResults.innerHTML = '<div class="diagnostic-line info">Booting core checks...</div>';
    
    const results = db.runDiagnostics();
    
    this.diagnosticResults.innerHTML = '';
    results.logs.forEach(l => {
      const line = document.createElement('div');
      line.className = `diagnostic-line ${l.type}`;
      line.textContent = `[${l.type.toUpperCase()}] ${l.msg}`;
      this.diagnosticResults.appendChild(line);
    });

    if (results.passed) {
      this.showToast('Diagnostics Clear', 'All database and workflow validations passed!', 'success');
    } else {
      this.showToast('Diagnostics Failure', 'Diagnostic tests detected conflict failures.', 'danger');
    }

    // Scroll to bottom of logger console
    this.diagnosticResults.scrollTop = this.diagnosticResults.scrollHeight;
  }
}

// Boot application
const app = new Application();
window.AssetFlowApp = app;

document.addEventListener('DOMContentLoaded', () => {
  app.start();
});
