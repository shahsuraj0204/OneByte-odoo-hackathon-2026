/* Dashboard View: Home Operational Snapshot */

import { db, TABLES } from '../db.js';

export const DashboardView = {
  title: 'Dashboard',

  render(container, appInstance) {
    const stats = db.getSystemStats();
    const user = appInstance.currentUser;

    // Check if current user has items checked out
    const allocations = db.get(TABLES.ALLOCATIONS).filter(al => al.status === 'Active');
    const assets = db.get(TABLES.ASSETS);
    const myAllocations = allocations.filter(al => 
      al.assigneeType === 'employee' && al.assigneeId === user.id
    ).map(al => {
      const asset = assets.find(a => a.id === al.assetId);
      return { ...al, asset };
    });

    container.innerHTML = `
      <div class="dashboard-row animate-fade-in">
        <!-- Main Stats Panel -->
        <div>
          <!-- KPI Row -->
          <div class="kpi-grid">
            <div class="glass-panel kpi-card available">
              <div class="kpi-card-header">
                <span>Available Assets</span>
                <div class="kpi-card-icon success"><i data-lucide="package-check"></i></div>
              </div>
              <div class="kpi-card-value">${stats.kpis.available}</div>
              <div class="kpi-card-footer">Ready for allocation</div>
            </div>
            
            <div class="glass-panel kpi-card allocated">
              <div class="kpi-card-header">
                <span>Allocated Assets</span>
                <div class="kpi-card-icon primary"><i data-lucide="user-check"></i></div>
              </div>
              <div class="kpi-card-value">${stats.kpis.allocated}</div>
              <div class="kpi-card-footer">Checked out to users</div>
            </div>

            <div class="glass-panel kpi-card bookings">
              <div class="kpi-card-header">
                <span>Active Bookings</span>
                <div class="kpi-card-icon secondary"><i data-lucide="calendar-days"></i></div>
              </div>
              <div class="kpi-card-value">${stats.kpis.activeBookings}</div>
              <div class="kpi-card-footer">Reserved shared slots</div>
            </div>

            <div class="glass-panel kpi-card maintenance">
              <div class="kpi-card-header">
                <span>Maintenance Jobs</span>
                <div class="kpi-card-icon warning"><i data-lucide="wrench"></i></div>
              </div>
              <div class="kpi-card-value">${stats.kpis.maintenanceToday}</div>
              <div class="kpi-card-footer">Assets undergoing repair</div>
            </div>
          </div>

          <!-- Overdue Returns Panel -->
          <div class="glass-panel" style="margin-bottom: 24px;">
            <div class="panel-header">
              <h2><i data-lucide="alert-octagon" style="color:var(--danger)"></i> Overdue Returns Warning</h2>
              <span class="badge badge-lost animate-pulse">${stats.overdueAllocations.length} Action Needed</span>
            </div>

            ${stats.overdueAllocations.length === 0 ? `
              <p style="color:var(--text-muted);font-size:0.85rem">Good news! There are no assets currently overdue for return.</p>
            ` : `
              <div class="table-container">
                <table class="table-custom">
                  <thead>
                    <tr>
                      <th>Asset Tag</th>
                      <th>Asset Name</th>
                      <th>Borrower</th>
                      <th>Due Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${stats.overdueAllocations.map(al => `
                      <tr class="animate-pulse-border" style="border-left: 3px solid var(--danger);">
                        <td style="font-family:monospace;font-weight:700;color:var(--primary);">${al.assetTag}</td>
                        <td><strong>${al.assetName}</strong></td>
                        <td>${al.holderName}</td>
                        <td style="color:var(--danger);font-weight:600;">${al.expectedReturnDate}</td>
                        <td>
                          <button class="btn btn-secondary btn-sm alert-borrower-btn" data-id="${al.allocationId}">
                            <i data-lucide="bell-ring"></i> Ping
                          </button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>

          <!-- My Handed Assets (Employee specific) -->
          <div class="glass-panel">
            <div class="panel-header">
              <h2><i data-lucide="package-open"></i> Assets Allocated to Me</h2>
            </div>
            
            ${myAllocations.length === 0 ? `
              <p style="color:var(--text-muted);font-size:0.85rem">You have no assets currently allocated to your profile. Need tools? Open the assets screen to search.</p>
            ` : `
              <div class="table-container">
                <table class="table-custom">
                  <thead>
                    <tr>
                      <th>Tag</th>
                      <th>Name</th>
                      <th>Acquired</th>
                      <th>Expected Return</th>
                      <th>Condition</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${myAllocations.map(my => `
                      <tr>
                        <td style="font-family:monospace;font-weight:700;">${my.asset?.tag}</td>
                        <td><strong>${my.asset?.name}</strong></td>
                        <td>${my.allocatedDate}</td>
                        <td>${my.expectedReturnDate || 'Permanent allocation'}</td>
                        <td><span class="badge" style="background:rgba(255,255,255,0.05);color:var(--text-main);">${my.asset?.condition}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        </div>

        <!-- Sidebar Quick Actions / Info -->
        <div>
          <!-- Quick Actions Panel -->
          <div class="glass-panel" style="margin-bottom: 24px;">
            <div class="panel-header">
              <h2><i data-lucide="zap"></i> Quick Actions</h2>
            </div>
            <div class="quick-actions-list">
              ${user.role === 'Admin' || user.role === 'Asset Manager' ? `
                <button class="quick-action-btn" id="btnQuickRegister">
                  <i data-lucide="plus-circle"></i> Register New Asset Tag
                </button>
              ` : ''}
              <button class="quick-action-btn" id="btnQuickBook">
                <i data-lucide="calendar"></i> Book Shared Resource
              </button>
              <button class="quick-action-btn" id="btnQuickRepair">
                <i data-lucide="wrench"></i> Raise Repair Request
              </button>
              <button class="quick-action-btn" id="btnQuickScan" style="border-color:var(--primary-glow); background:var(--primary-transparent);">
                <i data-lucide="qr-code"></i> Mock QR Scanner Camera
              </button>
            </div>
          </div>

          <!-- Pending Transfers Alert -->
          ${user.role === 'Asset Manager' || user.role === 'Admin' ? `
            <div class="glass-panel" style="margin-bottom: 24px; border:1px dashed var(--info);">
              <div class="panel-header">
                <h2><i data-lucide="arrow-left-right" style="color:var(--info)"></i> Transfer Requests</h2>
                <span class="badge badge-reserved">${stats.kpis.pendingTransfers} Pending</span>
              </div>
              <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:12px;">Employees want to swap assets. Take action in Allocations panel.</p>
              <a href="#allocations" class="btn btn-secondary btn-sm" style="width:100%;">Open Approvals Queue</a>
            </div>
          ` : ''}

          <!-- Organization Quick Links Info -->
          <div class="glass-panel">
            <div class="panel-header">
              <h2><i data-lucide="info"></i> Quick Contacts</h2>
            </div>
            <div class="asset-card-details" style="font-size:0.78rem;">
              <div class="asset-card-detail-item">
                <i data-lucide="mail"></i> <span>Support: help@omnisync.com</span>
              </div>
              <div class="asset-card-detail-item">
                <i data-lucide="shield"></i> <span>Asset Manager: Sarah Connor</span>
              </div>
              <div class="asset-card-detail-item">
                <i data-lucide="users"></i> <span>IT Lab Office: HQ-Room 202</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    lucide.createIcons();
    this.bindEvents(container, appInstance);
  },

  bindEvents(container, appInstance) {
    // Ping borrower button click
    container.querySelectorAll('.alert-borrower-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const allocId = e.currentTarget.dataset.id;
        const allocations = db.get(TABLES.ALLOCATIONS);
        const alloc = allocations.find(al => al.id === allocId);
        
        if (alloc && alloc.assigneeType === 'employee') {
          const assets = db.get(TABLES.ASSETS);
          const asset = assets.find(a => a.id === alloc.assetId);
          
          db.addNotification(
            alloc.assigneeId,
            'URGENT RETURN REMINDER',
            `Administrator has flagged asset ${asset?.tag} (${asset?.name}) return as urgent. Please return immediately.`,
            'danger'
          );
          
          appInstance.showToast('Ping Sent', `Sent return notification to assignee!`, 'success');
        }
      });
    });

    // Quick Action Register Asset
    const qReg = container.querySelector('#btnQuickRegister');
    if (qReg) {
      qReg.addEventListener('click', () => {
        this.openRegisterModal(appInstance);
      });
    }

    // Quick Action Book Resource
    const qBook = container.querySelector('#btnQuickBook');
    if (qBook) {
      qBook.addEventListener('click', () => {
        window.location.hash = '#bookings';
      });
    }

    // Quick Action Repair
    const qRepair = container.querySelector('#btnQuickRepair');
    if (qRepair) {
      qRepair.addEventListener('click', () => {
        this.openRepairModal(appInstance);
      });
    }

    // Quick Action Mock QR Scanner
    const qScan = container.querySelector('#btnQuickScan');
    if (qScan) {
      qScan.addEventListener('click', () => {
        this.openQRScannerModal(appInstance);
      });
    }
  },

  // Popup Modal: Register asset
  openRegisterModal(appInstance) {
    const categories = db.get(TABLES.CATEGORIES);
    
    const content = `
      <div class="modal-header">
        <h2>Register New Asset Tag</h2>
        <button class="close-icon-btn" data-modal-close><i data-lucide="x"></i></button>
      </div>
      <form id="modalRegisterForm">
        <div class="form-group">
          <label for="assetName">Asset Name</label>
          <input type="text" id="assetName" class="form-input" placeholder="e.g. Dell Monitor 27\"" required />
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="assetCategory">Category</label>
            <select id="assetCategory" class="form-select" required>
              ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="assetSerial">Serial Number</label>
            <input type="text" id="assetSerial" class="form-input" placeholder="S/N Code" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="assetCost">Acquisition Cost ($)</label>
            <input type="number" id="assetCost" class="form-input" placeholder="1200" required />
          </div>
          <div class="form-group">
            <label for="assetAcqDate">Acquisition Date</label>
            <input type="date" id="assetAcqDate" class="form-input" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="assetCondition">Condition</label>
            <select id="assetCondition" class="form-select">
              <option value="New">New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
          </div>
          <div class="form-group">
            <label for="assetLocation">Storage Location</label>
            <input type="text" id="assetLocation" class="form-input" placeholder="HQ IT Shelf C" required />
          </div>
        </div>

        <div class="form-group-checkbox">
          <input type="checkbox" id="assetShared" />
          <label for="assetShared">Mark as Bookable/Shared Resource (e.g. Projector, Vehicle, Room)</label>
        </div>

        <div id="categoryFieldsContainer" class="form-group" style="display:none; padding:12px; background:var(--bg-input); border-radius:8px; border:1px solid var(--border-color);">
          <h4 style="font-size:0.8rem; margin-bottom:8px; color:var(--primary);">Category Specific Specifications</h4>
          <div id="dynamicInputsArea"></div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
          <button type="submit" class="btn btn-primary">Register Asset</button>
        </div>
      </form>
    `;

    const setupModalEvents = (card) => {
      const form = card.querySelector('#modalRegisterForm');
      const categorySelect = card.querySelector('#assetCategory');
      const fieldsContainer = card.querySelector('#categoryFieldsContainer');
      const dynamicInputsArea = card.querySelector('#dynamicInputsArea');
      
      // Default set date today
      card.querySelector('#assetAcqDate').value = new Date().toISOString().split('T')[0];

      const renderCategoryFields = () => {
        const catId = categorySelect.value;
        const selectedCat = categories.find(c => c.id === catId);
        
        dynamicInputsArea.innerHTML = '';
        if (selectedCat && selectedCat.fields && selectedCat.fields.length > 0) {
          fieldsContainer.style.display = 'block';
          selectedCat.fields.forEach(f => {
            const row = document.createElement('div');
            row.className = 'form-group';
            row.innerHTML = `
              <label for="custom_${f}">${f}</label>
              <input type="text" id="custom_${f}" class="form-input" placeholder="Value details" />
            `;
            dynamicInputsArea.appendChild(row);
          });
        } else {
          fieldsContainer.style.display = 'none';
        }
      };

      categorySelect.addEventListener('change', renderCategoryFields);
      renderCategoryFields(); // trigger initial run

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const catId = categorySelect.value;
        const selectedCat = categories.find(c => c.id === catId);
        
        const customValues = {};
        if (selectedCat && selectedCat.fields) {
          selectedCat.fields.forEach(f => {
            const input = card.querySelector(`#custom_${f}`);
            if (input) customValues[f] = input.value;
          });
        }

        try {
          const registered = db.registerAsset(appInstance.currentUser.id, {
            name: card.querySelector('#assetName').value,
            categoryId: catId,
            serialNumber: card.querySelector('#assetSerial').value,
            acquisitionDate: card.querySelector('#assetAcqDate').value,
            acquisitionCost: card.querySelector('#assetCost').value,
            condition: card.querySelector('#assetCondition').value,
            location: card.querySelector('#assetLocation').value,
            shared: card.querySelector('#assetShared').checked,
            customValues
          });

          appInstance.showToast('Asset Registered', `Registered ${registered.tag} successfully!`, 'success');
          appInstance.closeModal();
          
          // Refresh view
          appInstance.renderCurrentView();
        } catch (err) {
          appInstance.showToast('Registration Error', err.message, 'danger');
        }
      });
    };

    appInstance.openModal(content, setupModalEvents);
  },

  // Popup Modal: Raise repair
  openRepairModal(appInstance) {
    const assets = db.get(TABLES.ASSETS);
    // Let employees pick from any active allocations or shared items
    const availableAssets = assets.filter(a => a.status !== 'Retired' && a.status !== 'Disposed');

    const content = `
      <div class="modal-header">
        <h2>Raise Maintenance & Repair Request</h2>
        <button class="close-icon-btn" data-modal-close><i data-lucide="x"></i></button>
      </div>
      <form id="modalRepairForm">
        <div class="form-group">
          <label for="repairAsset">Select Asset Unit</label>
          <select id="repairAsset" class="form-select" required>
            ${availableAssets.map(a => `<option value="${a.id}">${a.tag} - ${a.name} (Status: ${a.status})</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label for="repairPriority">Priority Level</label>
          <select id="repairPriority" class="form-select">
            <option value="Low">Low (General Checkup)</option>
            <option value="Medium" selected>Medium (Operational glitch)</option>
            <option value="High">High (Impacting daily work)</option>
            <option value="Critical">Critical (System Down)</option>
          </select>
        </div>

        <div class="form-group">
          <label for="repairDesc">Issue Description</label>
          <textarea id="repairDesc" class="form-textarea" placeholder="Detail the fault or issue observed..." rows="4" required></textarea>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
          <button type="submit" class="btn btn-danger">Submit Request</button>
        </div>
      </form>
    `;

    const setupModalEvents = (card) => {
      const form = card.querySelector('#modalRepairForm');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        try {
          db.raiseMaintenanceRequest(
            appInstance.currentUser.id,
            card.querySelector('#repairAsset').value,
            card.querySelector('#repairDesc').value,
            card.querySelector('#repairPriority').value
          );

          appInstance.showToast('Request Logged', 'Repair request logged. Sent to Asset Managers for approval.', 'success');
          appInstance.closeModal();
          
          if (appInstance.currentViewKey === 'dashboard') {
            appInstance.renderCurrentView();
          }
        } catch (err) {
          appInstance.showToast('Error', err.message, 'danger');
        }
      });
    };

    appInstance.openModal(content, setupModalEvents);
  },

  // Popup Modal: QR code scanner mock
  openQRScannerModal(appInstance) {
    const assets = db.get(TABLES.ASSETS);
    
    const content = `
      <div class="modal-header">
        <h2>Mock QR & Asset Tag Scanner</h2>
        <button class="close-icon-btn" data-modal-close><i data-lucide="x"></i></button>
      </div>
      <div style="text-align:center; padding:16px;">
        <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:20px;">
          Simulate pointing your camera at a physical OmniSync barcode. Select an asset tag below to simulate a match:
        </p>

        <!-- Animated Scanner box UI -->
        <div style="position:relative; width:220px; height:220px; border:2px solid var(--primary); margin:0 auto 24px auto; border-radius:12px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
          <div style="position:absolute; top:0; left:0; width:100%; height:2px; background:linear-gradient(to right, transparent, var(--secondary), transparent); box-shadow: 0 0 10px var(--secondary); animation: pulse 1.5s infinite; transform: translateY(110px);"></div>
          <i data-lucide="scan" style="width:120px; height:120px; color:rgba(255,255,255,0.06);"></i>
        </div>

        <div class="form-group" style="max-width:320px; margin:0 auto 16px auto;">
          <label for="scannerAssetSelect" style="text-align:left;">Simulate Tag Detection</label>
          <select id="scannerAssetSelect" class="form-select">
            <option value="">-- Click to simulate scans --</option>
            ${assets.map(a => `<option value="${a.id}">${a.tag} : ${a.name}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-modal-close>Close scanner</button>
      </div>
    `;

    const setupModalEvents = (card) => {
      const select = card.querySelector('#scannerAssetSelect');
      
      select.addEventListener('change', () => {
        const val = select.value;
        if (val) {
          appInstance.closeModal();
          appInstance.showToast('Scan Match', 'Asset Tag identified successfully!', 'success');
          appInstance.openAssetDetailModal(val);
        }
      });
    };

    appInstance.openModal(content, setupModalEvents);
  }
};
