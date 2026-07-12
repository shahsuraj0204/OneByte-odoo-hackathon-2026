/* Asset Audit View: Scheduled verification cycles & reports */

import { db, TABLES } from '../db.js';

export const AuditView = {
  title: 'Asset Audits',

  render(container, appInstance) {
    let activeSubTab = 'active'; // 'active' | 'closed' | 'schedule'
    let selectedCycleId = ''; // active conducting cycle ID
    
    const drawView = () => {
      const audits = db.get(TABLES.AUDITS);
      const assets = db.get(TABLES.ASSETS);
      const employees = db.get(TABLES.EMPLOYEES);
      const departments = db.get(TABLES.DEPARTMENTS);
      const user = appInstance.currentUser;

      const activeAudits = audits.filter(a => a.status === 'Active');
      const closedAudits = audits.filter(a => a.status === 'Closed');

      // If conductor mode is active, override standard tabs to show Conducting Dashboard
      if (selectedCycleId) {
        drawConductorInterface(selectedCycleId);
        return;
      }

      container.innerHTML = `
        <div class="glass-panel animate-fade-in">
          <!-- Sub tab navbar -->
          <div class="tab-navbar">
            <button class="tab-btn ${activeSubTab === 'active' ? 'active' : ''}" data-tab="active">
              <i data-lucide="clipboard-check"></i> Active Audits
            </button>
            <button class="tab-btn ${activeSubTab === 'closed' ? 'active' : ''}" data-tab="closed">
              <i data-lucide="archive"></i> Closed Audits Archive
            </button>
            ${user.role === 'Admin' ? `
              <button class="tab-btn ${activeSubTab === 'schedule' ? 'active' : ''}" data-tab="schedule">
                <i data-lucide="calendar-plus"></i> Schedule Cycle
              </button>
            ` : ''}
          </div>

          <!-- Tab A: Active Audits List -->
          ${activeSubTab === 'active' ? `
            <div class="tab-content">
              <div class="panel-header" style="margin-bottom:16px;">
                <h3>Current Physical Audit Cycles</h3>
              </div>
              <div class="table-container">
                <table class="table-custom">
                  <thead>
                    <tr>
                      <th>Audit Name</th>
                      <th>Scope Details</th>
                      <th>Scheduled Range</th>
                      <th>Assigned Auditors</th>
                      <th>Verified Progress</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${activeAudits.map(au => {
                      const auditorNames = au.assignedAuditors.map(id => employees.find(e => e.id === id)?.name || 'Auditor').join(', ');
                      
                      // Progress math
                      const totalItems = Object.keys(au.items).length;
                      const verifiedItems = Object.values(au.items).filter(i => i.status !== 'Pending').length;
                      const progressPct = totalItems > 0 ? Math.round((verifiedItems / totalItems) * 100) : 0;

                      // Check if current user is an auditor for this cycle
                      const isAssignedConductor = au.assignedAuditors.includes(user.id) || user.role === 'Admin' || user.role === 'Asset Manager';

                      return `
                        <tr>
                          <td><strong>${au.title}</strong></td>
                          <td>
                            Scope: <strong>${au.ScopeType === 'department' ? departments.find(d => d.id === au.ScopeTarget)?.name + ' Dept' : 'Location matches: "' + au.ScopeTarget + '"'}</strong>
                          </td>
                          <td style="font-size:0.8rem;color:var(--text-muted);">${au.startDate} to ${au.endDate}</td>
                          <td>${auditorNames || 'Unassigned'}</td>
                          <td>
                            <!-- progress bar ring -->
                            <div style="display:flex; align-items:center; gap:8px;">
                              <div style="flex:1; width:100px; height:8px; background:rgba(255,255,255,0.05); border-radius:4px; overflow:hidden;">
                                <div style="width:${progressPct}%; height:100%; background:linear-gradient(90deg, var(--primary), var(--secondary));"></div>
                              </div>
                              <span style="font-size:0.75rem;font-weight:600;">${progressPct}% (${verifiedItems}/${totalItems})</span>
                            </div>
                          </td>
                          <td>
                            <div style="display:flex;gap:6px;">
                              ${isAssignedConductor ? `
                                <button class="btn btn-primary btn-sm conduct-audit-btn" data-id="${au.id}">
                                  <i data-lucide="play-circle"></i> Conduct
                                </button>
                              ` : '—'}
                              
                              ${user.role === 'Admin' || user.role === 'Asset Manager' ? `
                                <button class="btn btn-secondary btn-sm close-audit-btn" data-id="${au.id}">
                                  Lock & Close
                                </button>
                              ` : ''}
                            </div>
                          </td>
                        </tr>
                      `;
                    }).join('')}

                    ${activeAudits.length === 0 ? `
                      <tr>
                        <td colspan="6" style="text-align:center;color:var(--text-muted);padding:24px;">No active inventory audit cycles are running.</td>
                      </tr>
                    ` : ''}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}

          <!-- Tab B: Closed Audits -->
          ${activeSubTab === 'closed' ? `
            <div class="tab-content">
              <div class="panel-header" style="margin-bottom:16px;">
                <h3>Closed Cycles Archive</h3>
              </div>
              <div class="table-container">
                <table class="table-custom">
                  <thead>
                    <tr>
                      <th>Audit Name</th>
                      <th>Scope Details</th>
                      <th>Closing Summary</th>
                      <th>Discrepancy Rate</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${closedAudits.map(au => {
                      const totalItems = Object.keys(au.items).length;
                      const report = au.discrepancyReport || { missing: [], damaged: [] };
                      const discrepancyCount = report.missing.length + report.damaged.length;
                      const rate = totalItems > 0 ? Math.round((discrepancyCount / totalItems) * 100) : 0;

                      return `
                        <tr>
                          <td><strong>${au.title}</strong></td>
                          <td>${au.ScopeType === 'department' ? 'Department Scope' : 'Location Scope'}</td>
                          <td style="font-size:0.8rem;color:var(--text-muted);">
                            Missing items: <strong style="color:var(--danger);">${report.missing.length}</strong> | 
                            Damaged items: <strong style="color:var(--warning);">${report.damaged.length}</strong>
                          </td>
                          <td style="font-weight:600; color: ${rate > 0 ? 'var(--danger)' : 'var(--success)'};">${rate}% flagged</td>
                          <td>
                            <button class="btn btn-secondary btn-sm view-report-btn" data-id="${au.id}">
                              <i data-lucide="file-text"></i> View Report
                            </button>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                    
                    ${closedAudits.length === 0 ? `
                      <tr>
                        <td colspan="5" style="text-align:center;color:var(--text-muted);padding:24px;">No historical closed audits in local archive.</td>
                      </tr>
                    ` : ''}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}

          <!-- Tab C: Schedule Form (Admin) -->
          ${activeSubTab === 'schedule' ? `
            <div class="tab-content" style="max-width: 600px; margin: 0 auto;">
              <div class="panel-header">
                <h3>Schedule Structured Audit Cycle</h3>
              </div>
              <form id="scheduleAuditForm">
                <div class="form-group">
                  <label for="auditTitle">Audit Title</label>
                  <input type="text" id="auditTitle" class="form-input" placeholder="e.g. Q3 Laboratory Furniture Sweep" required />
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="auditScopeType">Scope Selection</label>
                    <select id="auditScopeType" class="form-select">
                      <option value="department">By Department Allocations</option>
                      <option value="location">By Location Keyword</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label for="auditScopeTarget" id="scopeTargetLabel">Select Department</label>
                    <!-- populated dynamically -->
                    <div id="scopeTargetWrapper"></div>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="auditStart">Start Date</label>
                    <input type="date" id="auditStart" class="form-input" required />
                  </div>
                  <div class="form-group">
                    <label for="auditEnd">End Date</label>
                    <input type="date" id="auditEnd" class="form-input" required />
                  </div>
                </div>

                <div class="form-group">
                  <label for="auditAuditor">Assign Lead Auditor</label>
                  <select id="auditAuditor" class="form-select" required>
                    ${employees.map(e => `<option value="${e.id}">${e.name} (${e.role})</option>`).join('')}
                  </select>
                </div>

                <button type="submit" class="btn btn-primary" style="width:100%;">
                  <i data-lucide="check"></i> Initialize Audit Checklist Scope
                </button>
              </form>
            </div>
          ` : ''}
        </div>
      `;

      lucide.createIcons();
      bindEvents();
      
      if (activeSubTab === 'schedule') {
        renderScopeTargetInput();
      }
    };

    const renderScopeTargetInput = () => {
      const typeSelect = container.querySelector('#auditScopeType');
      const label = container.querySelector('#scopeTargetLabel');
      const wrapper = container.querySelector('#scopeTargetWrapper');
      if (!typeSelect || !wrapper) return;

      const departments = db.get(TABLES.DEPARTMENTS);

      if (typeSelect.value === 'department') {
        label.textContent = 'Select Department';
        wrapper.innerHTML = `
          <select id="auditScopeTarget" class="form-select" required>
            ${departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
          </select>
        `;
      } else {
        label.textContent = 'Location Match (regex)';
        wrapper.innerHTML = `
          <input type="text" id="auditScopeTarget" class="form-input" placeholder="e.g. IT Lab / Block 2" required />
        `;
      }
    };

    const bindEvents = () => {
      // Sub tab clicks
      container.querySelectorAll('.tab-navbar .tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          activeSubTab = e.currentTarget.dataset.tab;
          drawView();
        });
      });

      // Conduct audit click
      container.querySelectorAll('.conduct-audit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          selectedCycleId = e.currentTarget.dataset.id;
          drawView();
        });
      });

      // Close audit cycle click (Admin)
      container.querySelectorAll('.close-audit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.id;
          if (confirm('Lock and close this audit cycle? Asset tag statuses will be synced, confirming discrepancies.')) {
            try {
              db.closeAuditCycle(appInstance.currentUser.id, id);
              appInstance.showToast('Audit Locked', 'Discrepancy report compiled and status sync complete.', 'success');
              drawView();
            } catch (err) {
              appInstance.showToast('Error', err.message, 'danger');
            }
          }
        });
      });

      // View closed report clicks
      container.querySelectorAll('.view-report-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.id;
          openReportModal(id);
        });
      });

      // Schedule form binds
      const scheduleForm = container.querySelector('#scheduleAuditForm');
      if (scheduleForm) {
        const typeSelect = container.querySelector('#auditScopeType');
        typeSelect.addEventListener('change', renderScopeTargetInput);
        
        // Default set dates
        container.querySelector('#auditStart').value = new Date().toISOString().split('T')[0];
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        container.querySelector('#auditEnd').value = nextWeek.toISOString().split('T')[0];

        scheduleForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const title = container.querySelector('#auditTitle').value;
          const scopeType = typeSelect.value;
          const scopeTarget = container.querySelector('#auditScopeTarget').value;
          const start = container.querySelector('#auditStart').value;
          const end = container.querySelector('#auditEnd').value;
          const auditorId = container.querySelector('#auditAuditor').value;

          try {
            db.createAuditCycle(appInstance.currentUser.id, title, scopeType, scopeTarget, start, end, [auditorId]);
            appInstance.showToast('Audit Scheduled', 'Audit checklist has been successfully compiled.', 'success');
            activeSubTab = 'active';
            drawView();
          } catch (err) {
            appInstance.showToast('Error', err.message, 'danger');
          }
        });
      }
    };

    // --- Auditor Deck Conduct Canvas (In-line Checklist) ---
    const drawConductorInterface = (cycleId) => {
      const audits = db.get(TABLES.AUDITS);
      const assets = db.get(TABLES.ASSETS);

      const cycle = audits.find(au => au.id === cycleId);
      if (!cycle) {
        selectedCycleId = '';
        drawView();
        return;
      }

      const auditItems = Object.keys(cycle.items).map(assetId => {
        const asset = assets.find(a => a.id === assetId);
        const itemAuditState = cycle.items[assetId];
        return { assetId, asset, state: itemAuditState };
      });

      // Count discrepancies in real-time
      const flaggedCount = auditItems.filter(i => i.state.status === 'Missing' || i.state.status === 'Damaged').length;

      container.innerHTML = `
        <div class="glass-panel animate-slide-up">
          <div class="panel-header" style="border-bottom:1px solid var(--border-color); padding-bottom:16px; margin-bottom:24px;">
            <div>
              <button class="btn btn-secondary btn-sm" id="btnBackToAudits" style="margin-bottom:10px;">
                <i data-lucide="arrow-left"></i> Back to Audit Board
              </button>
              <h2 style="font-weight:800;">Conductor Checklist: ${cycle.title}</h2>
              <span style="font-size:0.78rem;color:var(--text-muted);">
                Auditor: ${appInstance.currentUser.name} | Scoped Inventory Verification
              </span>
            </div>
            
            <div style="text-align:right;">
              <button class="btn btn-success btn-sm close-audit-btn" data-id="${cycle.id}">Lock & Close Cycle</button>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 2fr 1fr; gap:24px;">
            <!-- Scoped checklists table -->
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <h3 style="font-size:1.05rem;">Asset Items</h3>
                <span style="font-size:0.75rem; color:var(--text-muted);">Click verification pills in-line to mark.</span>
              </div>
              
              <div class="table-container" style="max-height:480px; overflow-y:auto;">
                <table class="table-custom">
                  <thead>
                    <tr>
                      <th>Asset Name / Tag</th>
                      <th>Serial</th>
                      <th>Expected Location</th>
                      <th style="width:240px; text-align:center;">Verification Checkmark</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${auditItems.map(item => {
                      const cur = item.state.status;
                      return `
                        <tr style="${cur === 'Verified' ? 'border-left: 3px solid var(--success); background:rgba(16,185,129,0.01);' : cur === 'Missing' ? 'border-left: 3px solid var(--danger); background:rgba(239,68,68,0.01);' : cur === 'Damaged' ? 'border-left: 3px solid var(--warning); background:rgba(245,158,11,0.01);' : ''}">
                          <td>
                            <strong>${item.asset?.name}</strong> <br/>
                            <span style="font-family:monospace;font-size:0.75rem;color:var(--primary);">${item.asset?.tag}</span>
                          </td>
                          <td><code style="font-size:0.78rem;">${item.asset?.serialNumber}</code></td>
                          <td style="font-size:0.8rem;color:var(--text-muted);">${item.asset?.location}</td>
                          
                          <!-- IN-LINE BUTTON PILLS matching Excalidraw "Verified / Missing / Damaged checkboxes" -->
                          <td>
                            <div style="display:flex; gap:4px; justify-content:center;">
                              <button class="btn btn-sm inline-verify-btn ${cur === 'Verified' ? 'btn-success' : 'btn-secondary'}" 
                                      data-asset-id="${item.assetId}" data-status="Verified" title="Mark present and operational">
                                <i data-lucide="check" style="width:12px;height:12px;"></i> OK
                              </button>
                              <button class="btn btn-sm inline-verify-btn ${cur === 'Damaged' ? 'btn-primary' : 'btn-secondary'}" 
                                      style="${cur === 'Damaged' ? 'background:var(--warning);border-color:var(--warning);' : ''}" 
                                      data-asset-id="${item.assetId}" data-status="Damaged" title="Mark physical damage observed">
                                <i data-lucide="wrench" style="width:12px;height:12px;"></i> Faulty
                              </button>
                              <button class="btn btn-sm inline-verify-btn ${cur === 'Missing' ? 'btn-danger' : 'btn-secondary'}" 
                                      data-asset-id="${item.assetId}" data-status="Missing" title="Mark missing from site">
                                <i data-lucide="x" style="width:12px;height:12px;"></i> Lost
                              </button>
                            </div>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Side stats compiled -->
            <div>
              <div style="background:var(--bg-input); padding:20px; border-radius:var(--border-radius-md); border:1px solid var(--border-color); margin-bottom:20px;">
                <h3 style="margin-bottom:12px; font-size:1rem; color:var(--primary);">Audit Stats</h3>
                <div class="asset-card-details" style="font-size:0.85rem;">
                  <div class="asset-card-detail-item">
                    <strong>Total Scoped:</strong> <span>${auditItems.length}</span>
                  </div>
                  <div class="asset-card-detail-item">
                    <strong>Verified Present:</strong> <span style="color:var(--success);font-weight:600;">${auditItems.filter(i => i.state.status === 'Verified').length}</span>
                  </div>
                  <div class="asset-card-detail-item">
                    <strong>Flagged Missing:</strong> <span style="color:var(--danger);font-weight:600;">${auditItems.filter(i => i.state.status === 'Missing').length}</span>
                  </div>
                  <div class="asset-card-detail-item">
                    <strong>Flagged Damaged:</strong> <span style="color:var(--warning);font-weight:600;">${auditItems.filter(i => i.state.status === 'Damaged').length}</span>
                  </div>
                  <div class="asset-card-detail-item">
                    <strong>Awaiting Check:</strong> <span style="color:var(--text-muted);">${auditItems.filter(i => i.state.status === 'Pending').length}</span>
                  </div>
                </div>
              </div>

              <!-- Real-time discrepancy compiled banner matching mockup text -->
              <div class="animate-pulse-border" style="padding:16px; background:${flaggedCount > 0 ? 'var(--danger-transparent)' : 'var(--bg-input)'}; border:1px solid ${flaggedCount > 0 ? 'var(--danger)' : 'var(--border-color)'}; border-radius:8px; font-size:0.75rem; color:var(--text-main); margin-bottom:20px;">
                <h4 style="margin-bottom:6px; font-weight:700;"><i data-lucide="alert-octagon"></i> Discrepancy compilation</h4>
                <p>
                  ${flaggedCount > 0 
                    ? `<strong>${flaggedCount} assets flagged</strong> — discrepancy logs compile automatically on closure.` 
                    : 'No discrepancies currently flagged in this checklist session.'}
                </p>
              </div>

              <div style="font-size:0.72rem; color:var(--text-muted); padding:12px; border:1px dashed var(--border-color); border-radius:8px;">
                <p><strong>Conductor Guideline:</strong></p>
                <p>Toggling "Faulty" will prompt you to input details and assign a repair condition if needed. Lost items turn to "Lost" status in registry upon Admin closing the cycle.</p>
              </div>
            </div>
          </div>
        </div>
      `;

      lucide.createIcons();
      bindConductorEvents(cycleId);
    };

    const bindConductorEvents = (cycleId) => {
      // Back button click
      container.querySelector('#btnBackToAudits').addEventListener('click', () => {
        selectedCycleId = '';
        drawView();
      });

      // Inline verify checks click (toggles state instantly)
      container.querySelectorAll('.inline-verify-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const assetId = e.currentTarget.dataset.assetId;
          const status = e.currentTarget.dataset.status;
          
          if (status === 'Damaged') {
            // Prompts for damage notes & condition
            const notes = prompt('Enter damage details observed:');
            if (notes !== null) {
              const cond = prompt('Enter condition class (Good/Fair/Poor):', 'Fair');
              db.verifyAuditItem(appInstance.currentUser.id, cycleId, assetId, {
                verifiedStatus: 'Damaged',
                condition: cond || 'Fair',
                notes: notes || 'Damaged checked'
              });
              appInstance.showToast('Flagged Damaged', 'Saved damaged asset inspection.', 'warning');
              drawConductorInterface(cycleId);
            }
          } 
          else if (status === 'Missing') {
            const notes = prompt('Enter missing check-in notes (e.g. unknown location):');
            if (notes !== null) {
              db.verifyAuditItem(appInstance.currentUser.id, cycleId, assetId, {
                verifiedStatus: 'Missing',
                condition: '',
                notes: notes || 'Missing check'
              });
              appInstance.showToast('Flagged Missing', 'Saved missing asset logs.', 'danger');
              drawConductorInterface(cycleId);
            }
          } 
          else {
            // Verified present
            db.verifyAuditItem(appInstance.currentUser.id, cycleId, assetId, {
              verifiedStatus: 'Verified',
              condition: '',
              notes: 'Verified OK'
            });
            appInstance.showToast('Verified', 'Saved asset checklist item.', 'success');
            drawConductorInterface(cycleId);
          }
        });
      });

      // Close audit cycle click (Admin/Conductor)
      container.querySelector('.close-audit-btn').addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm('Lock and close this audit cycle? Asset tag statuses will be synced, confirming discrepancies.')) {
          try {
            db.closeAuditCycle(appInstance.currentUser.id, id);
            appInstance.showToast('Audit Locked', 'Discrepancy reports compiled and locked in archive.', 'success');
            selectedCycleId = '';
            activeSubTab = 'closed';
            drawView();
          } catch (err) {
            appInstance.showToast('Error', err.message, 'danger');
          }
        }
      });
    };

    // Modal popup to view CLOSED discrepancy reports
    const openReportModal = (cycleId) => {
      const audits = db.get(TABLES.AUDITS);
      const employees = db.get(TABLES.EMPLOYEES);
      const cycle = audits.find(au => au.id === cycleId);
      if (!cycle) return;

      const report = cycle.discrepancyReport || { missing: [], damaged: [], verified: [] };

      // Calculate totals for print compilation
      const totalItems = Object.keys(cycle.items).length;
      const verifiedCount = report.verified ? report.verified.length : 0;
      const complianceScore = totalItems > 0 ? Math.round((verifiedCount / totalItems) * 100) : 0;

      const content = `
        <div class="modal-header">
          <h2>Discrepancy Report: ${cycle.title}</h2>
          <button class="close-icon-btn" data-modal-close><i data-lucide="x"></i></button>
        </div>
        
        <div class="scrollbar-custom" style="max-height: 400px; overflow-y:auto; margin-bottom: 24px;">
          
          <h3 style="color:var(--danger); font-size:0.95rem; margin-bottom:8px; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
            <i data-lucide="alert-triangle"></i> Missing Items (${report.missing.length})
          </h3>
          ${report.missing.length === 0 ? '<p style="color:var(--text-muted);font-size:0.8rem;margin-bottom:16px;">No missing items reported.</p>' : `
            <div class="table-container" style="margin-bottom:16px;">
              <table class="table-custom" style="font-size:0.8rem;">
                <thead>
                  <tr>
                    <th>Tag</th>
                    <th>Asset Name</th>
                    <th>Auditor Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${report.missing.map(m => `
                    <tr>
                      <td style="font-family:monospace;font-weight:700;color:var(--danger);">${m.tag}</td>
                      <td><strong>${m.name}</strong></td>
                      <td style="color:var(--text-muted);">${m.notes}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}

          <h3 style="color:var(--warning); font-size:0.95rem; margin-bottom:8px; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
            <i data-lucide="wrench"></i> Damaged Items (${report.damaged.length})
          </h3>
          ${report.damaged.length === 0 ? '<p style="color:var(--text-muted);font-size:0.8rem;margin-bottom:16px;">No damaged items reported.</p>' : `
            <div class="table-container" style="margin-bottom:16px;">
              <table class="table-custom" style="font-size:0.8rem;">
                <thead>
                  <tr>
                    <th>Tag</th>
                    <th>Asset Name</th>
                    <th>Condition Set</th>
                    <th>Auditor Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${report.damaged.map(d => `
                    <tr>
                      <td style="font-family:monospace;font-weight:700;color:var(--warning);">${d.tag}</td>
                      <td><strong>${d.name}</strong></td>
                      <td><span class="badge badge-maintenance">${d.condition || 'Poor'}</span></td>
                      <td style="color:var(--text-muted);">${d.notes}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}

          <h3 style="color:var(--success); font-size:0.95rem; margin-bottom:8px; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
            <i data-lucide="check-circle2"></i> Verified Present OK (${verifiedCount})
          </h3>
          <p style="font-size:0.8rem;color:var(--text-muted);">
            Total verified items present in operational inventory: <strong>${verifiedCount}</strong> tags.
          </p>
        </div>

        <!-- Hidden certificate layout for window.print() compilation -->
        <div id="printCertificateArea" class="hidden">
          <div class="compliance-certificate">
            <div class="cert-header">
              <div class="cert-logo">OmniSync ERP</div>
              <div class="cert-subtitle">Inventory Control & Audit Verification</div>
            </div>
            
            <h1 class="cert-title">Compliance Certificate</h1>
            
            <div class="cert-body">
              This official document certifies that a physical inspection of properties, furnishings, and electronic hardware items has been conducted for the scope detailed below. Verified items list matches live records logged in the local OmniSync registry database.
            </div>

            <div class="cert-meta-grid">
              <div class="cert-meta-item">
                <strong>Audit Cycle:</strong> ${cycle.title}
              </div>
              <div class="cert-meta-item">
                <strong>Audit ID:</strong> <code>${cycle.id}</code>
              </div>
              <div class="cert-meta-item">
                <strong>Scope Type:</strong> ${cycle.ScopeType === 'department' ? 'Department' : 'Location'} Target: "${cycle.ScopeTarget}"
              </div>
              <div class="cert-meta-item">
                <strong>Closed Date:</strong> ${new Date(cycle.endDate).toLocaleDateString()}
              </div>
              <div class="cert-meta-item">
                <strong>Scoped Count:</strong> ${totalItems} Assets
              </div>
              <div class="cert-meta-item" style="color: ${complianceScore > 80 ? '#059669' : '#d97706'}; font-weight: bold;">
                <strong>Integrity Rating:</strong> ${complianceScore}% Verified
              </div>
            </div>

            <div class="cert-body">
              <strong>Discrepancies flagged:</strong> ${report.missing.length} missing tags confirmed as Lost, ${report.damaged.length} damaged items assigned to restoration pipeline. 
            </div>

            <div class="cert-signature-row">
              <div class="cert-sig-box">
                <div class="cert-sig-line">Sarah Connor</div>
                <div style="border-top: 1px solid #94a3b8; padding-top: 4px;">Assigned Auditor</div>
              </div>
              <div class="cert-sig-box">
                <div class="cert-sig-line">Alice Smith</div>
                <div style="border-top: 1px solid #94a3b8; padding-top: 4px;">System Administrator</div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary" id="btnDownloadCert"><i data-lucide="printer"></i> Print PDF Certificate</button>
          <button class="btn btn-secondary" data-modal-close>Close report</button>
        </div>
      `;

      const setupModalEvents = (card) => {
        const printBtn = card.querySelector('#btnDownloadCert');
        printBtn.addEventListener('click', () => {
          // Compile and trigger browser print dialog
          const printArea = card.querySelector('#printCertificateArea').cloneNode(true);
          printArea.id = 'printCertificateArea';
          printArea.classList.remove('hidden');
          
          document.body.appendChild(printArea);
          window.print();
          document.body.removeChild(printArea); // clean up
        });
      };

      appInstance.openModal(content, setupModalEvents, 'wide');
    };

    drawView();
  }
};
