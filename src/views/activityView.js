/* Activity Logs & Notifications View (Mockup Aligned) */

import { db, TABLES } from '../db.js';

export const ActivityView = {
  title: 'System Activity',

  render(container, appInstance) {
    let activeSubTab = 'notifications'; // 'notifications' | 'audit-logs'
    let logSearchQuery = '';
    let notificationCategory = 'all'; // 'all' | 'alerts' | 'approvals' | 'bookings'

    const drawView = () => {
      const notifications = db.get(TABLES.NOTIFICATIONS).filter(n => n.userId === appInstance.currentUser.id);
      const logs = db.get(TABLES.LOGS);
      const user = appInstance.currentUser;

      // Filter notifications based on sub-category pills matching Screen 10
      const filteredNotifications = notifications.filter(n => {
        if (notificationCategory === 'all') return true;
        
        const title = n.title.toLowerCase();
        const msg = n.message.toLowerCase();
        
        if (notificationCategory === 'alerts') {
          return n.type === 'danger' || n.type === 'warning' || title.includes('overdue') || title.includes('reminder') || title.includes('warp');
        }
        if (notificationCategory === 'approvals') {
          return title.includes('transfer') || title.includes('approve') || title.includes('repair') || title.includes('role');
        }
        if (notificationCategory === 'bookings') {
          return title.includes('booking') || title.includes('reserve') || msg.includes('booked');
        }
        return true;
      });

      // Filter global audit logs
      const filteredLogs = logs.filter(l => 
        !logSearchQuery ||
        l.userName.toLowerCase().includes(logSearchQuery) ||
        l.actionType.toLowerCase().includes(logSearchQuery) ||
        l.description.toLowerCase().includes(logSearchQuery)
      );

      container.innerHTML = `
        <div class="glass-panel animate-fade-in">
          <!-- Sub tab navigations -->
          <div class="tab-navbar">
            <button class="tab-btn ${activeSubTab === 'notifications' ? 'active' : ''}" data-tab="notifications">
              <i data-lucide="bell"></i> My Inbox Alerts (${notifications.filter(n => !n.read).length} Unread)
            </button>
            <button class="tab-btn ${activeSubTab === 'audit-logs' ? 'active' : ''}" data-tab="audit-logs">
              <i data-lucide="scroll"></i> Master Audit Logs
            </button>
          </div>

          <!-- Tab A: My Notifications -->
          ${activeSubTab === 'notifications' ? `
            <div class="tab-content animate-fade-in">
              <div class="panel-header" style="margin-bottom:16px; flex-wrap:wrap; gap:16px;">
                <!-- Filter Pills matching Screen 10 sketch -->
                <div style="display:flex; gap:8px;">
                  <button class="btn btn-secondary btn-sm filter-pill-btn ${notificationCategory === 'all' ? 'btn-primary' : ''}" data-cat="all">All</button>
                  <button class="btn btn-secondary btn-sm filter-pill-btn ${notificationCategory === 'alerts' ? 'btn-primary' : ''}" data-cat="alerts">Alerts</button>
                  <button class="btn btn-secondary btn-sm filter-pill-btn ${notificationCategory === 'approvals' ? 'btn-primary' : ''}" data-cat="approvals">Approvals</button>
                  <button class="btn btn-secondary btn-sm filter-pill-btn ${notificationCategory === 'bookings' ? 'btn-primary' : ''}" data-cat="bookings">Bookings</button>
                </div>
                
                ${notifications.length > 0 ? `
                  <button class="btn btn-secondary btn-sm" id="btnMarkAllReadActivity">Mark all read</button>
                ` : ''}
              </div>

              <div style="display:flex; flex-direction:column; gap:12px;">
                ${filteredNotifications.map(n => `
                  <div class="glass-panel notification-item-card ${n.read ? '' : 'unread'}" data-id="${n.id}" 
                       style="padding:16px; border:1px solid var(--border-color); border-radius: var(--border-radius-md); display:flex; gap:16px; align-items:center; cursor:pointer; position:relative; transition:background var(--transition-fast); background:${n.read ? 'rgba(255,255,255,0.01)' : 'var(--primary-transparent)'};">
                    
                    ${!n.read ? `<div style="position:absolute; left:6px; top:50%; transform:translateY(-50%); width:6px; height:6px; background:var(--primary); border-radius:50%;"></div>` : ''}
                    
                    <div class="notification-item-icon ${n.type}">
                      <i data-lucide="${n.type === 'danger' ? 'alert-octagon' : n.type === 'success' ? 'check-circle-2' : 'bell'}"></i>
                    </div>

                    <div style="flex:1;">
                      <div style="font-size:0.875rem; font-weight:600; margin-bottom:2px;">${n.title}</div>
                      <div style="font-size:0.8rem; color:var(--text-muted);">${n.message}</div>
                    </div>

                    <div style="font-size:0.7rem; color:var(--text-muted); text-align:right;">
                      ${new Date(n.timestamp).toLocaleDateString()}<br/>
                      ${new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                `).join('')}

                ${filteredNotifications.length === 0 ? `
                  <div style="text-align:center;color:var(--text-muted);padding:48px;">
                    <i data-lucide="bell-off" style="width:48px;height:48px;margin:0 auto 16px auto;opacity:0.3;display:block;"></i>
                    <p>No notifications match this filter.</p>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Tab B: Master Audit Logs -->
          ${activeSubTab === 'audit-logs' ? `
            <div class="tab-content animate-fade-in">
              <div class="panel-header" style="margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
                <h3>ERP Security Audit Logs</h3>
                <div class="form-group" style="margin-bottom:0; width:280px;">
                  <input type="text" id="logSearchInput" class="form-input" placeholder="Search actor name, action, or tag..." value="${logSearchQuery}" />
                </div>
              </div>

              <div class="table-container">
                <table class="table-custom">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Operator</th>
                      <th>Action Type</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredLogs.map(l => `
                      <tr>
                        <td style="font-size:0.75rem;color:var(--text-muted);">${new Date(l.timestamp).toLocaleString()}</td>
                        <td><strong>${l.userName}</strong><br/><span style="font-size:0.7rem;color:var(--text-muted);">ID: ${l.userId}</span></td>
                        <td><span class="badge" style="background:var(--primary-transparent); color:var(--primary);">${l.actionType}</span></td>
                        <td style="font-size:0.85rem;color:var(--text-main);">${l.description}</td>
                      </tr>
                    `).join('')}

                    ${filteredLogs.length === 0 ? `
                      <tr>
                        <td colspan="4" style="text-align:center;color:var(--text-muted);padding:24px;">No matching system logs found.</td>
                      </tr>
                    ` : ''}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}
        </div>
      `;

      lucide.createIcons();
      bindEvents();
    };

    const bindEvents = () => {
      // Sub tab clicks
      container.querySelectorAll('.tab-navbar .tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          activeSubTab = e.currentTarget.dataset.tab;
          drawView();
        });
      });

      // Filter sub-pills click
      container.querySelectorAll('.filter-pill-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          notificationCategory = e.currentTarget.dataset.cat;
          drawView();
        });
      });

      // Mark single notification read
      container.querySelectorAll('.notification-item-card').forEach(card => {
        card.addEventListener('click', () => {
          const id = card.dataset.id;
          db.markNotificationRead(id);
          appInstance.renderNotifications(); // update top bell
          drawView(); // update active panel
        });
      });

      // Mark all read button
      const markAllBtn = container.querySelector('#btnMarkAllReadActivity');
      if (markAllBtn) {
        markAllBtn.addEventListener('click', () => {
          db.markAllNotificationsRead(appInstance.currentUser.id);
          appInstance.showToast('Cleared', 'Marked all notifications read.', 'info');
          appInstance.renderNotifications();
          drawView();
        });
      }

      // Audit logs search
      const sInput = container.querySelector('#logSearchInput');
      if (sInput) {
        sInput.addEventListener('input', () => {
          logSearchQuery = sInput.value.toLowerCase().trim();
          drawView();
          container.querySelector('#logSearchInput').focus(); // retain cursor
        });
      }
    };

    drawView();
  }
};
