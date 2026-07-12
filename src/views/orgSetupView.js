/* Org Setup View: Admin Central Management */

import { db, TABLES } from '../db.js';

export const OrgSetupView = {
  title: 'Organization Setup',
  allowedRoles: ['Admin'], // Admin restricted

  render(container, appInstance) {
    let activeTab = 'departments'; // 'departments' | 'categories' | 'directory'
    let customFields = []; // Temp holder for category fields editor

    const drawView = () => {
      const departments = db.get(TABLES.DEPARTMENTS);
      const categories = db.get(TABLES.CATEGORIES);
      const employees = db.get(TABLES.EMPLOYEES);

      container.innerHTML = `
        <div class="glass-panel animate-fade-in">
          <!-- Tab Navigation header -->
          <div class="tab-navbar">
            <button class="tab-btn ${activeTab === 'departments' ? 'active' : ''}" data-tab="departments">
              <i data-lucide="network"></i> Tab A - Departments
            </button>
            <button class="tab-btn ${activeTab === 'categories' ? 'active' : ''}" data-tab="categories">
              <i data-lucide="tags"></i> Tab B - Asset Categories
            </button>
            <button class="tab-btn ${activeTab === 'directory' ? 'active' : ''}" data-tab="directory">
              <i data-lucide="users"></i> Tab C - Employee Directory
            </button>
          </div>

          <!-- Tab A: Department Content -->
          ${activeTab === 'departments' ? `
            <div class="tab-content">
              <div style="display:grid; grid-template-columns: 1fr 2fr; gap:24px;">
                <!-- Left panel form -->
                <div style="background:var(--bg-input); padding:20px; border-radius: var(--border-radius-md); border:1px solid var(--border-color); height: fit-content;">
                  <h3 style="margin-bottom:16px; font-size:1.05rem; color:var(--primary);">Create Department</h3>
                  <form id="createDeptForm">
                    <div class="form-group">
                      <label for="deptName">Department Name</label>
                      <input type="text" id="deptName" class="form-input" placeholder="e.g. Quality Assurance" required />
                    </div>
                    <div class="form-group">
                      <label for="deptHead">Assign Head</label>
                      <select id="deptHead" class="form-select" required>
                        <option value="">-- Choose Head --</option>
                        ${employees.map(e => `<option value="${e.id}">${e.name} (${e.role})</option>`).join('')}
                      </select>
                    </div>
                    <div class="form-group">
                      <label for="deptParent">Parent Department (Optional)</label>
                      <select id="deptParent" class="form-select">
                        <option value="">None (Top Level)</option>
                        ${departments.filter(d => d.status === 'Active').map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                      </select>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%;">Create Dept</button>
                  </form>
                </div>

                <!-- Right Panel Grid -->
                <div>
                  <h3 style="margin-bottom:16px; font-size:1.05rem;">Department Hierarchy</h3>
                  <div class="table-container">
                    <table class="table-custom">
                      <thead>
                        <tr>
                          <th>Dept Name</th>
                          <th>Parent Dept</th>
                          <th>Department Head</th>
                          <th>Status</th>
                          <th>Toggle</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${departments.map(d => {
                          const parent = departments.find(p => p.id === d.parentId);
                          const head = employees.find(e => e.id === d.headId);
                          return `
                            <tr>
                              <td><strong>${d.name}</strong></td>
                              <td style="color:var(--text-muted);font-size:0.8rem;">${parent ? parent.name : '—'}</td>
                              <td>${head ? head.name : 'Unassigned'}</td>
                              <td><span class="badge ${d.status === 'Active' ? 'badge-available' : 'badge-retired'}">${d.status}</span></td>
                              <td>
                                <button class="btn btn-secondary btn-sm toggle-dept-status-btn" data-id="${d.id}" data-status="${d.status}">
                                  ${d.status === 'Active' ? 'Deactivate' : 'Activate'}
                                </button>
                              </td>
                            </tr>
                          `;
                        }).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Tab B: Asset Categories Content -->
          ${activeTab === 'categories' ? `
            <div class="tab-content">
              <div style="display:grid; grid-template-columns: 1fr 2fr; gap:24px;">
                <!-- Left panel form -->
                <div style="background:var(--bg-input); padding:20px; border-radius: var(--border-radius-md); border:1px solid var(--border-color); height: fit-content;">
                  <h3 style="margin-bottom:12px; font-size:1.05rem; color:var(--primary);">Create Asset Category</h3>
                  <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:16px;">Define structural custom fields (e.g. warranty, RAM) that will be requested when registering assets of this category.</p>
                  
                  <form id="createCategoryForm">
                    <div class="form-group">
                      <label for="catName">Category Name</label>
                      <input type="text" id="catName" class="form-input" placeholder="e.g. Medical Devices" required />
                    </div>
                    
                    <div class="form-group">
                      <label>Category Specific Fields</label>
                      <div style="display:flex; gap:8px; margin-bottom:8px;">
                        <input type="text" id="tempFieldName" class="form-input" placeholder="e.g. Calibration Date" />
                        <button type="button" class="btn btn-secondary btn-sm" id="btnAddCustomField">Add</button>
                      </div>
                      
                      <div class="custom-fields-badge-list" id="fieldsBadgeList">
                        ${customFields.map((f, idx) => `
                          <span class="custom-field-badge">
                            ${f} <button type="button" class="remove-field-btn" data-idx="${idx}">&times;</button>
                          </span>
                        `).join('') || '<span style="font-size:0.72rem;color:var(--text-muted);">No custom fields added yet.</span>'}
                      </div>
                    </div>

                    <button type="submit" class="btn btn-primary" style="width:100%; margin-top:16px;">Create Category</button>
                  </form>
                </div>

                <!-- Right Panel Grid -->
                <div>
                  <h3 style="margin-bottom:16px; font-size:1.05rem;">Registered Categories</h3>
                  <div class="table-container">
                    <table class="table-custom">
                      <thead>
                        <tr>
                          <th>Category Name</th>
                          <th>Custom Field Specifications</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${categories.map(c => `
                          <tr>
                            <td><strong>${c.name}</strong></td>
                            <td>
                              ${c.fields && c.fields.length > 0 ? c.fields.map(f => `
                                <span class="badge" style="background:var(--primary-transparent); color:var(--primary); text-transform:none; margin:2px;">${f}</span>
                              `).join('') : '<span style="color:var(--text-muted);font-size:0.78rem;">No custom specs</span>'}
                            </td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Tab C: Employee Directory Content -->
          ${activeTab === 'directory' ? `
            <div class="tab-content">
              <div class="panel-header" style="margin-bottom:16px;">
                <h3>Directory & Roles</h3>
                <p style="font-size:0.75rem; color:var(--text-muted);">Admin manages employee roles here. Promoted employees get access to relevant menus.</p>
              </div>
              <div class="table-container">
                <table class="table-custom">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Role Profile</th>
                      <th>Login Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${employees.map(e => {
                      const dept = departments.find(d => d.id === e.departmentId);
                      return `
                        <tr>
                          <td><strong>${e.name}</strong></td>
                          <td><code>${e.email}</code></td>
                          <td>${dept ? dept.name : '—'}</td>
                          <td>
                            <!-- Role selector promotion dropdown -->
                            <select class="form-select form-select-sm role-promo-select" data-id="${e.id}" style="width:160px; padding:6px; font-size:0.8rem;">
                              <option value="Employee" ${e.role === 'Employee' ? 'selected' : ''}>Employee</option>
                              <option value="Department Head" ${e.role === 'Department Head' ? 'selected' : ''}>Department Head</option>
                              <option value="Asset Manager" ${e.role === 'Asset Manager' ? 'selected' : ''}>Asset Manager</option>
                              <option value="Admin" ${e.role === 'Admin' ? 'selected' : ''}>Admin</option>
                            </select>
                          </td>
                          <td>
                            <span class="badge ${e.status === 'Active' ? 'badge-available' : 'badge-retired'}">${e.status}</span>
                          </td>
                          <td>
                            <button class="btn btn-secondary btn-sm toggle-employee-btn" data-id="${e.id}" data-status="${e.status}">
                              ${e.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      `;
                    }).join('')}
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
      // Tab Navigation binds
      container.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          activeTab = e.currentTarget.dataset.tab;
          customFields = []; // clear temp categories fields array on tab swap
          drawView();
        });
      });

      // --- Tab A Binds ---
      const createDeptForm = container.querySelector('#createDeptForm');
      if (createDeptForm) {
        createDeptForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const name = container.querySelector('#deptName').value;
          const headId = container.querySelector('#deptHead').value;
          const parentId = container.querySelector('#deptParent').value;

          try {
            db.createDepartment(appInstance.currentUser.id, name, headId, parentId);
            appInstance.showToast('Department Added', `Successfully created ${name}`, 'success');
            drawView();
          } catch (err) {
            appInstance.showToast('Error', err.message, 'danger');
          }
        });

        // Toggle Active/Inactive Department
        container.querySelectorAll('.toggle-dept-status-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const currentStatus = e.currentTarget.dataset.status;
            const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
            
            const departments = db.get(TABLES.DEPARTMENTS);
            const dept = departments.find(d => d.id === id);
            if (dept) {
              db.updateDepartment(appInstance.currentUser.id, id, dept.name, dept.headId, dept.parentId, nextStatus);
              appInstance.showToast('Department Status Changed', `Set ${dept.name} status to ${nextStatus}`, 'info');
              drawView();
            }
          });
        });
      }

      // --- Tab B Binds ---
      const btnAddField = container.querySelector('#btnAddCustomField');
      if (btnAddField) {
        const fieldInput = container.querySelector('#tempFieldName');
        
        btnAddField.addEventListener('click', () => {
          const val = fieldInput.value.trim();
          if (val && !customFields.includes(val)) {
            customFields.push(val);
            fieldInput.value = '';
            drawView();
          }
        });

        // Remove field badge
        container.querySelectorAll('.remove-field-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const idx = Number(e.currentTarget.dataset.idx);
            customFields.splice(idx, 1);
            drawView();
          });
        });

        const createCategoryForm = container.querySelector('#createCategoryForm');
        createCategoryForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const name = container.querySelector('#catName').value;
          
          try {
            db.createCategory(appInstance.currentUser.id, name, customFields);
            appInstance.showToast('Category Added', `Successfully created category ${name}`, 'success');
            customFields = [];
            drawView();
          } catch (err) {
            appInstance.showToast('Error', err.message, 'danger');
          }
        });
      }

      // --- Tab C Binds ---
      // Role select Promotion
      container.querySelectorAll('.role-promo-select').forEach(sel => {
        sel.addEventListener('change', (e) => {
          const id = e.currentTarget.dataset.id;
          const role = e.currentTarget.value;
          
          try {
            db.promoteEmployee(appInstance.currentUser.id, id, role);
            appInstance.showToast('Role Updated', 'Employee role successfully updated.', 'success');
            
            // If admin promoted themselves, reload session
            if (id === appInstance.currentUser.id) {
              appInstance.currentUser.role = role;
              sessionStorage.setItem('assetflow_user', JSON.stringify(appInstance.currentUser));
              window.location.reload();
            } else {
              drawView();
            }
          } catch (err) {
            appInstance.showToast('Error', err.message, 'danger');
          }
        });
      });

      // Toggle Employee Status
      container.querySelectorAll('.toggle-employee-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.dataset.id;
          const status = e.currentTarget.dataset.status;
          const nextStatus = status === 'Active' ? 'Inactive' : 'Active';

          try {
            db.updateEmployeeStatus(appInstance.currentUser.id, id, nextStatus);
            appInstance.showToast('Status Updated', `Employee login status changed to ${nextStatus}`, 'success');
            drawView();
          } catch (err) {
            appInstance.showToast('Error', err.message, 'danger');
          }
        });
      });
    };

    drawView();
  }
};
