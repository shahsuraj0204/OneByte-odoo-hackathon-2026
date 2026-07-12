/* Maintenance Management View: Interactive Kanban Board */

import { db, TABLES } from '../db.js';
import { DashboardView } from './dashboardView.js';

export const MaintenanceView = {
  title: 'Maintenance Board',

  render(container, appInstance) {
    let filterPriority = '';

    const drawView = () => {
      const maintenance = db.get(TABLES.MAINTENANCE);
      const assets = db.get(TABLES.ASSETS);
      const employees = db.get(TABLES.EMPLOYEES);
      const user = appInstance.currentUser;

      // Filter tickets based on Priority (if set)
      const filtered = maintenance.filter(m => !filterPriority || m.priority === filterPriority);

      // Distribute tickets into Kanban columns
      const cols = {
        'Pending': [],
        'Approved': [],
        'In Progress': [],
        'Resolved': []
      };

      filtered.forEach(ticket => {
        // Fallback for custom or old statuses
        let colKey = ticket.status;
        if (colKey === 'Rejected') return; // Hide rejected from active board
        if (!cols[colKey]) {
          cols['Pending'].push(ticket);
        } else {
          cols[colKey].push(ticket);
        }
      });

      container.innerHTML = `
        <!-- Filter Controls panel -->
        <div class="glass-panel animate-fade-in" style="margin-bottom: 24px;">
          <div class="panel-header" style="margin-bottom: 0px; display:flex; flex-wrap:wrap; gap:16px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <h2 style="font-size:1.15rem;"><i data-lucide="wrench"></i> Repair Kanban Board</h2>
              <select id="maintPrioritySelect" class="form-select" style="width:180px; padding:6px; font-size:0.8rem;">
                <option value="">All Priorities</option>
                <option value="Low" ${filterPriority === 'Low' ? 'selected' : ''}>Low (General Checkup)</option>
                <option value="Medium" ${filterPriority === 'Medium' ? 'selected' : ''}>Medium (Glitch)</option>
                <option value="High" ${filterPriority === 'High' ? 'selected' : ''}>High (Impacting work)</option>
                <option value="Critical" ${filterPriority === 'Critical' ? 'selected' : ''}>Critical (System Down)</option>
              </select>
            </div>
            
            <button class="btn btn-danger btn-sm" id="btnRaiseMaintenanceDirectory">
              <i data-lucide="plus"></i> File Repair Request
            </button>
          </div>
        </div>

        <!-- Kanban Board Container -->
        <div class="kanban-board animate-fade-in">
          
          <!-- Column 1: Pending -->
          <div class="kanban-column col-pending">
            <div class="kanban-column-header">
              <span class="kanban-column-title"><i data-lucide="help-circle" style="color:var(--warning);"></i> Pending Review</span>
              <span class="kanban-column-count">${cols['Pending'].length}</span>
            </div>
            <div class="kanban-card-list">
              ${cols['Pending'].map(m => renderKanbanCard(m, assets, employees, user)).join('')}
              ${cols['Pending'].length === 0 ? '<div style="text-align:center;font-size:0.75rem;color:var(--text-muted);padding:24px 0;">No pending tickets</div>' : ''}
            </div>
          </div>

          <!-- Column 2: Approved -->
          <div class="kanban-column col-approved">
            <div class="kanban-column-header">
              <span class="kanban-column-title"><i data-lucide="check-circle" style="color:var(--info);"></i> Approved Queue</span>
              <span class="kanban-column-count">${cols['Approved'].length}</span>
            </div>
            <div class="kanban-card-list">
              ${cols['Approved'].map(m => renderKanbanCard(m, assets, employees, user)).join('')}
              ${cols['Approved'].length === 0 ? '<div style="text-align:center;font-size:0.75rem;color:var(--text-muted);padding:24px 0;">Awaiting approvals</div>' : ''}
            </div>
          </div>

          <!-- Column 3: In Progress -->
          <div class="kanban-column col-inprogress">
            <div class="kanban-column-header">
              <span class="kanban-column-title"><i data-lucide="play" style="color:var(--primary);"></i> In Progress</span>
              <span class="kanban-column-count">${cols['In Progress'].length}</span>
            </div>
            <div class="kanban-card-list">
              ${cols['In Progress'].map(m => renderKanbanCard(m, assets, employees, user)).join('')}
              ${cols['In Progress'].length === 0 ? '<div style="text-align:center;font-size:0.75rem;color:var(--text-muted);padding:24px 0;">No active repairs</div>' : ''}
            </div>
          </div>

          <!-- Column 4: Resolved -->
          <div class="kanban-column col-resolved">
            <div class="kanban-column-header">
              <span class="kanban-column-title"><i data-lucide="check-circle2" style="color:var(--success);"></i> Resolved</span>
              <span class="kanban-column-count">${cols['Resolved'].length}</span>
            </div>
            <div class="kanban-card-list">
              ${cols['Resolved'].map(m => renderKanbanCard(m, assets, employees, user)).join('')}
              ${cols['Resolved'].length === 0 ? '<div style="text-align:center;font-size:0.75rem;color:var(--text-muted);padding:24px 0;">No resolved tickets</div>' : ''}
            </div>
          </div>

        </div>
      `;

      lucide.createIcons();
      bindEvents();
    };

    // Helper to draw single kanban card
    const renderKanbanCard = (ticket, assets, employees, user) => {
      const asset = assets.find(a => a.id === ticket.assetId);
      const reporter = employees.find(e => e.id === ticket.reportedById);
      const isManager = user.role === 'Admin' || user.role === 'Asset Manager';
      
      const dateStr = new Date(ticket.createdDate).toLocaleDateString();

      return `
        <div class="kanban-card priority-${ticket.priority.toLowerCase()}" data-id="${ticket.id}">
          <div class="kanban-card-title">
            <span>${asset ? asset.name : 'Unknown Asset'}</span>
            <span class="badge badge-priority-${ticket.priority.toLowerCase()}" style="font-size:0.6rem; padding:2px 6px;">${ticket.priority}</span>
          </div>
          <div class="kanban-card-tag">${asset ? asset.tag : 'AF-XXXX'}</div>
          
          <div class="kanban-card-desc" title="${ticket.description}">${ticket.description}</div>
          
          <div class="kanban-card-meta">
            <span>Rep: <strong>${reporter ? reporter.name : 'User'}</strong></span>
            <span>Date: ${dateStr}</span>
          </div>

          ${ticket.technicianName ? `
            <div style="font-size:0.72rem; color:var(--text-muted); background:rgba(0,0,0,0.1); padding:4px 8px; border-radius:4px; margin-top:4px;">
              <i data-lucide="user" style="width:10px;height:10px;display:inline;"></i> Tech: <strong>${ticket.technicianName}</strong>
            </div>
          ` : ''}

          ${ticket.resolutionNotes ? `
            <div style="font-size:0.72rem; color:var(--success); background:var(--success-transparent); padding:4px 8px; border-radius:4px; margin-top:4px;">
              Resolved: ${ticket.resolutionNotes}
            </div>
          ` : ''}

          <!-- Manager Transition Controls -->
          ${isManager ? `
            <div class="kanban-card-actions">
              ${renderActions(ticket)}
            </div>
          ` : ''}
        </div>
      `;
    };

    const renderActions = (ticket) => {
      if (ticket.status === 'Pending') {
        return `
          <button class="btn btn-success btn-sm approve-repair-btn" data-id="${ticket.id}" style="flex:1; padding:4px; font-size:0.7rem;">Approve</button>
          <button class="btn btn-danger btn-sm reject-repair-btn" data-id="${ticket.id}" style="flex:1; padding:4px; font-size:0.7rem;">Reject</button>
        `;
      }
      if (ticket.status === 'Approved') {
        return `
          <button class="btn btn-primary btn-sm assign-tech-btn" data-id="${ticket.id}" style="width:100%; padding:4px; font-size:0.7rem;">
            <i data-lucide="user-plus" style="width:10px;height:10px;"></i> Assign Tech
          </button>
        `;
      }
      if (ticket.status === 'In Progress') {
        return `
          <button class="btn btn-success btn-sm resolve-repair-btn" data-id="${ticket.id}" style="width:100%; padding:4px; font-size:0.7rem;">
            <i data-lucide="check" style="width:10px;height:10px;"></i> Mark Resolved
          </button>
        `;
      }
      return ''; // No actions for Resolved
    };

    const bindEvents = () => {
      const pSelect = container.querySelector('#maintPrioritySelect');
      const raiseBtn = container.querySelector('#btnRaiseMaintenanceDirectory');

      pSelect.addEventListener('change', () => {
        filterPriority = pSelect.value;
        drawView();
      });

      raiseBtn.addEventListener('click', () => {
        DashboardView.openRepairModal(appInstance);
      });

      // Approve Request
      container.querySelectorAll('.approve-repair-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = e.currentTarget.dataset.id;
          try {
            db.updateMaintenanceStatus(appInstance.currentUser.id, id, 'Approved');
            appInstance.showToast('Approved', 'Asset moved to Approved Queue.', 'success');
            drawView();
          } catch (err) {
            appInstance.showToast('Error', err.message, 'danger');
          }
        });
      });

      // Reject Request
      container.querySelectorAll('.reject-repair-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = e.currentTarget.dataset.id;
          const reason = prompt('Provide rejection reason notes:');
          if (reason !== null) {
            try {
              db.updateMaintenanceStatus(appInstance.currentUser.id, id, 'Rejected', '', reason);
              appInstance.showToast('Rejected', 'Repair request rejected.', 'info');
              drawView();
            } catch (err) {
              appInstance.showToast('Error', err.message, 'danger');
            }
          }
        });
      });

      // Assign Technician
      container.querySelectorAll('.assign-tech-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = e.currentTarget.dataset.id;
          openAssignModal(id);
        });
      });

      // Resolve repair
      container.querySelectorAll('.resolve-repair-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = e.currentTarget.dataset.id;
          openResolveModal(id);
        });
      });

      // Click card opens Asset Details modal
      container.querySelectorAll('.kanban-card').forEach(card => {
        card.addEventListener('click', () => {
          const id = card.dataset.id;
          const maintenance = db.get(TABLES.MAINTENANCE);
          const req = maintenance.find(m => m.id === id);
          if (req) {
            appInstance.openAssetDetailModal(req.assetId);
          }
        });
      });
    };

    // Modal popup to assign technician
    const openAssignModal = (requestId) => {
      const content = `
        <div class="modal-header">
          <h2>Assign Repair Technician</h2>
          <button class="close-icon-btn" data-modal-close><i data-lucide="x"></i></button>
        </div>
        <form id="modalAssignTechForm">
          <div class="form-group">
            <label for="techName">Technician / Contractor Name</label>
            <input type="text" id="techName" class="form-input" placeholder="e.g. IT Helpdesk / Jane Smith" required />
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
            <button type="submit" class="btn btn-primary">Start Repair Work</button>
          </div>
        </form>
      `;

      const setupModalEvents = (card) => {
        const form = card.querySelector('#modalAssignTechForm');
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          try {
            db.updateMaintenanceStatus(
              appInstance.currentUser.id,
              requestId,
              'In Progress',
              card.querySelector('#techName').value
            );

            appInstance.showToast('Technician Assigned', 'Ticket marked In Progress.', 'success');
            appInstance.closeModal();
            drawView();
          } catch (err) {
            appInstance.showToast('Error', err.message, 'danger');
          }
        });
      };

      appInstance.openModal(content, setupModalEvents);
    };

    // Modal popup to resolve repair
    const openResolveModal = (requestId) => {
      const content = `
        <div class="modal-header">
          <h2>Complete Maintenance Resolution</h2>
          <button class="close-icon-btn" data-modal-close><i data-lucide="x"></i></button>
        </div>
        <form id="modalResolveForm">
          <div class="form-group">
            <label for="resNotes">Resolution Summary Notes</label>
            <textarea id="resNotes" class="form-textarea" placeholder="Detail parts replaced, tests done, or calibration results..." rows="3" required></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
            <button type="submit" class="btn btn-success">Mark Resolved</button>
          </div>
        </form>
      `;

      const setupModalEvents = (card) => {
        const form = card.querySelector('#modalResolveForm');
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          try {
            db.updateMaintenanceStatus(
              appInstance.currentUser.id,
              requestId,
              'Resolved',
              '',
              card.querySelector('#resNotes').value
            );

            appInstance.showToast('Resolved', 'Asset returned to Available stock lists.', 'success');
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
