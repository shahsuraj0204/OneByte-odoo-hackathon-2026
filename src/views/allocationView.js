/* Allocation View: Checkout & Transfer Workflows */

import { db, TABLES } from '../db.js';

export const AllocationView = {
  title: 'Allocations & Transfers',

  render(container, appInstance) {
    let activeSubTab = 'active'; // 'active' | 'transfers' | 'checkout'
    let selectedAssetId = ''; // selected asset on checkout form
    let conflictHolderText = ''; // Holds conflict description if asset is taken
    let activeAllocId = ''; // Holds active allocation ID for transfer triggers

    const drawView = () => {
      const user = appInstance.currentUser;
      const assets = db.get(TABLES.ASSETS);
      const allocations = db.get(TABLES.ALLOCATIONS);
      const employees = db.get(TABLES.EMPLOYEES);
      const departments = db.get(TABLES.DEPARTMENTS);
      const transfers = db.get(TABLES.TRANSFERS);

      const activeAllocs = allocations.filter(al => al.status === 'Active' || al.status === 'Transfer Pending');

      container.innerHTML = `
        <div class="glass-panel animate-fade-in">
          <!-- Sub tab navbar -->
          <div class="tab-navbar">
            <button class="tab-btn ${activeSubTab === 'active' ? 'active' : ''}" data-tab="active">
              <i data-lucide="folder-git"></i> Active Checkouts
            </button>
            <button class="tab-btn ${activeSubTab === 'transfers' ? 'active' : ''}" data-tab="transfers">
              <i data-lucide="arrow-left-right"></i> Transfer Queue
            </button>
            <button class="tab-btn ${activeSubTab === 'checkout' ? 'active' : ''}" data-tab="checkout">
              <i data-lucide="file-plus"></i> New Allocation
            </button>
          </div>

          <!-- Tab A: Active Allocations -->
          ${activeSubTab === 'active' ? `
            <div class="tab-content">
              <div class="panel-header" style="margin-bottom: 16px;">
                <h3>Active Allocations Registry</h3>
              </div>
              <div class="table-container">
                <table class="table-custom">
                  <thead>
                    <tr>
                      <th>Asset Tag</th>
                      <th>Asset Name</th>
                      <th>Assignee</th>
                      <th>Checkout Date</th>
                      <th>Expected Return</th>
                      <th>Notes</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${activeAllocs.map(al => {
                      const asset = assets.find(a => a.id === al.assetId);
                      let assigneeName = '—';
                      if (al.assigneeType === 'employee') {
                        assigneeName = employees.find(e => e.id === al.assigneeId)?.name || 'Employee';
                      } else {
                        assigneeName = departments.find(d => d.id === al.assigneeId)?.name + ' Dept' || 'Department';
                      }

                      const today = new Date();
                      const isOverdue = al.expectedReturnDate && new Date(al.expectedReturnDate) < today;

                      return `
                        <tr style="${isOverdue ? 'border-left: 3px solid var(--danger); background:rgba(239, 68, 68, 0.02);' : ''}">
                          <td style="font-family:monospace;font-weight:700;color:var(--primary);">${asset ? asset.tag : '—'}</td>
                          <td><strong>${asset ? asset.name : '—'}</strong></td>
                          <td>${assigneeName}</td>
                          <td>${al.allocatedDate}</td>
                          <td style="${isOverdue ? 'color:var(--danger);font-weight:700;' : ''}">
                            ${al.expectedReturnDate || 'Permanent'}
                            ${isOverdue ? '<span class="badge badge-lost" style="margin-left:6px;font-size:0.6rem;">Overdue</span>' : ''}
                          </td>
                          <td style="color:var(--text-muted);font-size:0.78rem;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${al.notes}">
                            ${al.notes || '—'}
                          </td>
                          <td>
                            <span class="badge badge-${(al.status || 'active').toLowerCase()}">${al.status}</span>
                          </td>
                          <td>
                            <!-- Return click for Manager/Admins -->
                            ${user.role === 'Admin' || user.role === 'Asset Manager' ? `
                              <button class="btn btn-secondary btn-sm return-asset-btn" data-id="${al.id}">
                                <i data-lucide="log-in"></i> Return
                              </button>
                            ` : `
                              <button class="btn btn-secondary btn-sm request-transfer-direct-btn" data-id="${al.id}">
                                <i data-lucide="arrow-left-right"></i> Transfer Request
                              </button>
                            `}
                          </td>
                        </tr>
                      `;
                    }).join('')}

                    ${activeAllocs.length === 0 ? `
                      <tr>
                        <td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px;">No active allocations currently found.</td>
                      </tr>
                    ` : ''}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}

          <!-- Tab B: Transfer Queue -->
          ${activeSubTab === 'transfers' ? `
            <div class="tab-content">
              <div class="panel-header" style="margin-bottom: 16px;">
                <h3>Asset Transfer Approvals Queue</h3>
              </div>
              <div class="table-container">
                <table class="table-custom">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Current Holder</th>
                      <th>Requested To</th>
                      <th>Requested Date</th>
                      <th>Reason / Notes</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${transfers.map(t => {
                      const alloc = allocations.find(al => al.id === t.allocationId);
                      const asset = alloc ? assets.find(a => a.id === alloc.assetId) : null;
                      
                      let holderName = '—';
                      if (alloc) {
                        if (alloc.assigneeType === 'employee') {
                          holderName = employees.find(e => e.id === alloc.assigneeId)?.name || 'Employee';
                        } else {
                          holderName = departments.find(d => d.id === alloc.assigneeId)?.name + ' Dept' || 'Dept';
                        }
                      }
                      
                      const requester = employees.find(e => e.id === t.toEmployeeId);

                      return `
                        <tr>
                          <td>
                            <strong>${asset ? asset.name : 'Unknown'}</strong><br/>
                            <span style="font-family:monospace;font-size:0.75rem;color:var(--primary);">${asset ? asset.tag : ''}</span>
                          </td>
                          <td>${holderName}</td>
                          <td><strong>${requester ? requester.name : '—'}</strong></td>
                          <td>${new Date(t.requestDate).toLocaleDateString()}</td>
                          <td style="font-size:0.8rem;color:var(--text-muted);max-width:200px;" title="${t.notes}">
                            ${t.notes || '—'}
                          </td>
                          <td>
                            <span class="badge ${t.status === 'Pending' ? 'badge-warning' : t.status === 'Approved' ? 'badge-available' : 'badge-lost'}">${t.status}</span>
                          </td>
                          <td>
                            ${t.status === 'Pending' && (user.role === 'Admin' || user.role === 'Asset Manager') ? `
                              <div style="display:flex;gap:6px;">
                                <button class="btn btn-success btn-sm approve-transfer-btn" data-id="${t.id}">Approve</button>
                                <button class="btn btn-danger btn-sm reject-transfer-btn" data-id="${t.id}">Reject</button>
                              </div>
                            ` : '—'}
                          </td>
                        </tr>
                      `;
                    }).join('')}
                    
                    ${transfers.length === 0 ? `
                      <tr>
                        <td colspan="7" style="text-align:center;color:var(--text-muted);padding:24px;">No transfer requests logged in queue.</td>
                      </tr>
                    ` : ''}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}

          <!-- Tab C: Checkout Form -->
          ${activeSubTab === 'checkout' ? `
            <div class="tab-content" style="max-width: 600px; margin: 0 auto;">
              <div class="panel-header">
                <h3>Allocate Asset Tag / Request Transfer</h3>
              </div>
              
              <form id="checkoutForm">
                <div class="form-group">
                  <label for="checkoutAsset">Select Asset Unit</label>
                  <select id="checkoutAsset" class="form-select" required>
                    <option value="">-- Choose Asset Tag --</option>
                    ${assets.filter(a => a.status !== 'Retired' && a.status !== 'Disposed').map(a => `
                      <option value="${a.id}" ${selectedAssetId === a.id ? 'selected' : ''}>${a.tag} : ${a.name} (Status: ${a.status})</option>
                    `).join('')}
                  </select>
                </div>

                <!-- SMART CONFLICT BLOCK: Displays if chosen asset is not available -->
                ${conflictHolderText ? `
                  <div class="animate-pulse-border" style="padding: 16px; background:var(--danger-transparent); border: 1px solid var(--danger); border-radius: var(--border-radius-md); margin-bottom:18px;">
                    <h4 style="color:var(--danger); font-size:0.85rem; margin-bottom:6px;"><i data-lucide="alert-octagon"></i> Allocation Conflict Detected</h4>
                    <p style="font-size:0.8rem; color:var(--text-main); margin-bottom:12px;">${conflictHolderText}</p>
                    
                    <div class="form-group" style="margin-bottom:12px;">
                      <label style="color:var(--text-main); font-size:0.75rem;">Reason for requesting Transfer</label>
                      <textarea id="transferReason" class="form-textarea" placeholder="Explain why you need this asset swapped from its current holder..." rows="2"></textarea>
                    </div>
                    
                    <button type="button" class="btn btn-danger btn-sm" id="btnSubmitTransferRequest" style="width:100%;">
                      <i data-lucide="arrow-left-right"></i> File Transfer Request
                    </button>
                  </div>

                  <!-- SMART RECOMMENDATIONS: Alternative Available Assets of the same category -->
                  <div id="smartRecommendationsBox" style="padding:16px; background:var(--primary-transparent); border:1px solid var(--primary); border-radius:var(--border-radius-md); margin-bottom:18px;">
                    <h4 style="color:var(--primary); font-size:0.85rem; margin-bottom:8px;"><i data-lucide="sparkles"></i> Smart Suggestions</h4>
                    <p style="font-size:0.78rem; color:var(--text-muted); margin-bottom:10px;">The system found these alternative available assets in the same category:</p>
                    <div id="recommendationsList" style="display:flex; flex-direction:column; gap:8px;">
                      <!-- filled dynamically -->
                    </div>
                  </div>
                ` : `
                  <!-- Standard Checkout Panel (only shown if no conflict or manager check) -->
                  <div class="form-row">
                    <div class="form-group">
                      <label for="assigneeType">Assignee Type</label>
                      <select id="assigneeType" class="form-select">
                        <option value="employee">Employee</option>
                        <option value="department">Department</option>
                      </select>
                    </div>
                    
                    <div class="form-group">
                      <label for="assigneeId">Select Assignee</label>
                      <!-- Toggled by JS -->
                      <select id="assigneeId" class="form-select" required></select>
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label for="expectedReturnDate">Expected Return Date (Optional)</label>
                      <input type="date" id="expectedReturnDate" class="form-input" />
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="checkoutNotes">Allocation Notes</label>
                    <textarea id="checkoutNotes" class="form-textarea" placeholder="Laptop checkout details..." rows="3"></textarea>
                  </div>

                  <button type="submit" class="btn btn-primary" style="width:100%;">
                    <i data-lucide="check"></i> Process Checkout Allocation
                  </button>
                `}
              </form>
            </div>
          ` : ''}
        </div>
      `;

      lucide.createIcons();
      bindEvents();
      
      // If conflict is shown, populate alternative recommendations
      if (conflictHolderText && selectedAssetId) {
        populateAlternatives();
      }
    };

    const populateAlternatives = () => {
      const assets = db.get(TABLES.ASSETS);
      const currentAsset = assets.find(a => a.id === selectedAssetId);
      if (!currentAsset) return;

      const alternatives = assets.filter(a => 
        a.categoryId === currentAsset.categoryId && 
        a.status === 'Available' && 
        a.id !== selectedAssetId
      );

      const listContainer = container.querySelector('#recommendationsList');
      if (!listContainer) return;

      if (alternatives.length === 0) {
        listContainer.innerHTML = `<span style="font-size:0.75rem; color:var(--text-muted);">No alternative available items in this category.</span>`;
        return;
      }

      listContainer.innerHTML = alternatives.map(a => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:8px 12px; border-radius:6px; border:1px solid var(--border-color);">
          <div style="font-size:0.8rem;">
            <strong>${a.name}</strong> (${a.tag}) <br/>
            <span style="font-size:0.72rem; color:var(--text-muted);">Location: ${a.location} | Condition: ${a.condition}</span>
          </div>
          <button type="button" class="btn btn-secondary btn-sm select-alternative-btn" data-id="${a.id}">Select</button>
        </div>
      `).join('');

      // Bind alternative buttons
      listContainer.querySelectorAll('.select-alternative-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          selectedAssetId = e.currentTarget.dataset.id;
          conflictHolderText = '';
          drawView();
        });
      });
    };

    const bindEvents = () => {
      // Sub tab navigation click
      container.querySelectorAll('.tab-navbar .tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          activeSubTab = e.currentTarget.dataset.tab;
          selectedAssetId = '';
          conflictHolderText = '';
          drawView();
        });
      });

      // Direct return button clicks (renders return check-in modal)
      container.querySelectorAll('.return-asset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const allocId = e.currentTarget.dataset.id;
          openReturnModal(allocId);
        });
      });

      // Request Transfer direct buttons
      container.querySelectorAll('.request-transfer-direct-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const allocId = e.currentTarget.dataset.id;
          openTransferDirectModal(allocId);
        });
      });

      // Approve transfers
      container.querySelectorAll('.approve-transfer-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const transId = e.currentTarget.dataset.id;
          try {
            db.approveTransfer(appInstance.currentUser.id, transId);
            appInstance.showToast('Transfer Approved', 'Asset re-allocated and history updated.', 'success');
            drawView();
          } catch (err) {
            appInstance.showToast('Error', err.message, 'danger');
          }
        });
      });

      // Reject transfers
      container.querySelectorAll('.reject-transfer-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const transId = e.currentTarget.dataset.id;
          try {
            db.rejectTransfer(appInstance.currentUser.id, transId);
            appInstance.showToast('Transfer Rejected', 'Request rejected and active holder retained.', 'info');
            drawView();
          } catch (err) {
            appInstance.showToast('Error', err.message, 'danger');
          }
        });
      });

      // --- Checkout Form binds ---
      const checkoutForm = container.querySelector('#checkoutForm');
      if (checkoutForm) {
        const assetSelect = container.querySelector('#checkoutAsset');
        const assigneeTypeSelect = container.querySelector('#assigneeType');
        const assigneeIdSelect = container.querySelector('#assigneeId');

        // Populate Assignees based on selected Type
        const populateAssignees = () => {
          if (!assigneeTypeSelect) return;
          const type = assigneeTypeSelect.value;
          assigneeIdSelect.innerHTML = '';

          if (type === 'employee') {
            const employees = db.get(TABLES.EMPLOYEES).filter(e => e.status === 'Active');
            assigneeIdSelect.innerHTML = employees.map(e => `
              <option value="${e.id}">${e.name} (${e.role})</option>
            `).join('');
          } else {
            const depts = db.get(TABLES.DEPARTMENTS).filter(d => d.status === 'Active');
            assigneeIdSelect.innerHTML = depts.map(d => `
              <option value="${d.id}">${d.name} Dept</option>
            `).join('');
          }
        };

        if (assigneeTypeSelect) {
          assigneeTypeSelect.addEventListener('change', populateAssignees);
          populateAssignees();
        }

        // Selected asset change: evaluate availability conflict
        assetSelect.addEventListener('change', () => {
          selectedAssetId = assetSelect.value;
          if (!selectedAssetId) {
            conflictHolderText = '';
            drawView();
            return;
          }

          const assets = db.get(TABLES.ASSETS);
          const asset = assets.find(a => a.id === selectedAssetId);
          
          if (asset && asset.status !== 'Available') {
            const allocations = db.get(TABLES.ALLOCATIONS);
            const activeAlloc = allocations.find(al => al.assetId === selectedAssetId && al.status === 'Active');
            activeAllocId = activeAlloc ? activeAlloc.id : '';

            let holderName = 'unknown holder';
            if (activeAlloc) {
              if (activeAlloc.assigneeType === 'employee') {
                const employees = db.get(TABLES.EMPLOYEES);
                holderName = employees.find(e => e.id === activeAlloc.assigneeId)?.name || 'Employee';
              } else {
                const depts = db.get(TABLES.DEPARTMENTS);
                holderName = depts.find(d => d.id === activeAlloc.assigneeId)?.name + ' Dept' || 'Dept';
              }
            }

            conflictHolderText = `This asset is currently occupied and marked as: <strong>${asset.status}</strong>. Currently held by: <strong>${holderName}</strong>. You cannot allocate it directly.`;
          } else {
            conflictHolderText = '';
          }
          drawView();
        });

        // Submit standard checkout
        checkoutForm.addEventListener('submit', (e) => {
          e.preventDefault();
          try {
            db.allocateAsset(appInstance.currentUser.id, {
              assetId: selectedAssetId,
              assigneeType: assigneeTypeSelect.value,
              assigneeId: assigneeIdSelect.value,
              expectedReturnDate: container.querySelector('#expectedReturnDate').value,
              notes: container.querySelector('#checkoutNotes').value
            });

            appInstance.showToast('Checkout Processed', 'Asset allocation status set to Allocated.', 'success');
            selectedAssetId = '';
            activeSubTab = 'active';
            drawView();
          } catch (err) {
            appInstance.showToast('Checkout Error', err.message, 'danger');
          }
        });

        // Submit transfer request from conflict block
        const submitTransferBtn = container.querySelector('#btnSubmitTransferRequest');
        if (submitTransferBtn) {
          submitTransferBtn.addEventListener('click', () => {
            const reason = container.querySelector('#transferReason').value;
            try {
              db.requestTransfer(appInstance.currentUser.id, activeAllocId, reason);
              appInstance.showToast('Request Logged', 'Transfer request filed successfully.', 'success');
              conflictHolderText = '';
              selectedAssetId = '';
              activeSubTab = 'transfers';
              drawView();
            } catch (err) {
              appInstance.showToast('Error', err.message, 'danger');
            }
          });
        }
      }
    };

    // Return Checkout Process Modal
    const openReturnModal = (allocId) => {
      const allocations = db.get(TABLES.ALLOCATIONS);
      const assets = db.get(TABLES.ASSETS);
      
      const alloc = allocations.find(al => al.id === allocId);
      const asset = alloc ? assets.find(a => a.id === alloc.assetId) : null;

      const content = `
        <div class="modal-header">
          <h2>Return Check-in: ${asset ? asset.tag : 'Asset'}</h2>
          <button class="close-icon-btn" data-modal-close><i data-lucide="x"></i></button>
        </div>
        <form id="modalReturnForm">
          <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:16px;">
            Process check-in inspection for: <strong>${asset ? asset.name : ''}</strong>
          </p>

          <div class="form-group">
            <label for="returnCondition">Current Condition Rating</label>
            <select id="returnCondition" class="form-select">
              <option value="New" ${asset?.condition === 'New' ? 'selected' : ''}>New</option>
              <option value="Good" ${asset?.condition === 'Good' ? 'selected' : ''}>Good</option>
              <option value="Fair" ${asset?.condition === 'Fair' ? 'selected' : ''}>Fair</option>
              <option value="Poor" ${asset?.condition === 'Poor' ? 'selected' : ''}>Poor</option>
            </select>
          </div>

          <div class="form-group">
            <label for="returnNotes">Check-in Notes</label>
            <textarea id="returnNotes" class="form-textarea" placeholder="Describe physical damages, battery state, missing packaging..." rows="3" required></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
            <button type="submit" class="btn btn-primary">Process Return</button>
          </div>
        </form>
      `;

      const setupModalEvents = (card) => {
        const form = card.querySelector('#modalReturnForm');
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          try {
            db.returnAsset(
              appInstance.currentUser.id,
              allocId,
              card.querySelector('#returnNotes').value,
              card.querySelector('#returnCondition').value
            );

            appInstance.showToast('Check-in Complete', `Asset returned to available stock list.`, 'success');
            appInstance.closeModal();
            drawView();
          } catch (err) {
            appInstance.showToast('Error', err.message, 'danger');
          }
        });
      };

      appInstance.openModal(content, setupModalEvents);
    };

    // Direct Transfer Request modal
    const openTransferDirectModal = (allocId) => {
      const allocations = db.get(TABLES.ALLOCATIONS);
      const assets = db.get(TABLES.ASSETS);
      
      const alloc = allocations.find(al => al.id === allocId);
      const asset = alloc ? assets.find(a => a.id === alloc.assetId) : null;

      const content = `
        <div class="modal-header">
          <h2>Request Asset Transfer: ${asset ? asset.tag : 'Asset'}</h2>
          <button class="close-icon-btn" data-modal-close><i data-lucide="x"></i></button>
        </div>
        <form id="modalTransferDirectForm">
          <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:16px;">
            File a swap request to transfer allocation of: <strong>${asset ? asset.name : ''}</strong> to your profile.
          </p>

          <div class="form-group">
            <label for="transferReasonNotes">Request Reason / Explanation</label>
            <textarea id="transferReasonNotes" class="form-textarea" placeholder="State why this transfer is necessary..." rows="3" required></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
            <button type="submit" class="btn btn-primary">File Request</button>
          </div>
        </form>
      `;

      const setupModalEvents = (card) => {
        const form = card.querySelector('#modalTransferDirectForm');
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          try {
            db.requestTransfer(
              appInstance.currentUser.id,
              allocId,
              card.querySelector('#transferReasonNotes').value
            );

            appInstance.showToast('Transfer Requested', 'Transfer request filed successfully.', 'success');
            appInstance.closeModal();
            drawView();
          } catch (err) {
            appInstance.showToast('Error', err.message, 'danger');
          }
        });
      };

      appInstance.openModal(content, setupModalEvents);
    };

    drawView();
  }
};
