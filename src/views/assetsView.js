/* Asset Directory View: Registry Search, Detail & Floor Plan Map */

import { db, TABLES } from '../db.js';
import { DashboardView } from './dashboardView.js';

// Persistent filter states across viewport re-renders
let filterQuery = '';
let filterCategory = '';
let filterStatus = '';
let filterCondition = '';
let activeMapRoom = ''; // Track highlighted SVG room

export const AssetsView = {
  title: 'Asset Directory',

  render(container, appInstance) {
    
    const drawView = () => {
      const assets = db.get(TABLES.ASSETS);
      const categories = db.get(TABLES.CATEGORIES);
      const user = appInstance.currentUser;

      // Filter assets
      const filtered = assets.filter(a => {
        // If activeMapRoom is set, override or combine location match
        const matchesMap = !activeMapRoom || a.location.toLowerCase().includes(activeMapRoom.toLowerCase());
        
        const matchesQuery = !filterQuery || 
          a.tag.toLowerCase().includes(filterQuery) || 
          a.name.toLowerCase().includes(filterQuery) || 
          a.serialNumber.toLowerCase().includes(filterQuery) ||
          a.location.toLowerCase().includes(filterQuery);
        
        const matchesCategory = !filterCategory || a.categoryId === filterCategory;
        const matchesStatus = !filterStatus || a.status === filterStatus;
        const matchesCondition = !filterCondition || a.condition === filterCondition;

        return matchesMap && matchesQuery && matchesCategory && matchesStatus && matchesCondition;
      });

      container.innerHTML = `
        <!-- Interactive 2D Floor Plan Location Map (Mockup Aligned special feature) -->
        <div class="floorplan-wrapper animate-fade-in">
          <div class="floorplan-header">
            <h3><i data-lucide="map"></i> Real-time Location Floor Map</h3>
            ${activeMapRoom ? `
              <button class="btn btn-secondary btn-sm" id="btnResetMapFilter" style="padding: 2px 8px; font-size: 0.72rem;">
                Clear Location Filter: "${activeMapRoom}"
              </button>
            ` : '<span style="font-size:0.75rem; color:var(--text-muted);">Click rooms to filter assets physically parked on-site.</span>'}
          </div>
          
          <div class="floorplan-grid">
            <!-- Custom-drawn SVG Office layout blueprint -->
            <svg class="floorplan-svg" viewBox="0 0 600 160" width="100%">
              <!-- IT Lab 202 -->
              <rect x="15" y="15" width="110" height="60" rx="6" class="floorplan-room ${activeMapRoom === 'IT Lab 202' ? 'active' : ''}" data-room="IT Lab 202" />
              <text x="70" y="48" class="floorplan-text">IT Lab 202</text>

              <!-- Open Office 3A -->
              <rect x="135" y="15" width="220" height="60" rx="6" class="floorplan-room ${activeMapRoom === 'Open Office 3A' ? 'active' : ''}" data-room="Open Office 3A" />
              <text x="245" y="48" class="floorplan-text">Open Office 3A</text>

              <!-- Boardroom Delta -->
              <rect x="365" y="15" width="100" height="60" rx="6" class="floorplan-room ${activeMapRoom === 'Delta Boardroom' ? 'active' : ''}" data-room="Delta Boardroom" />
              <text x="415" y="48" class="floorplan-text">Delta Room</text>

              <!-- HQ Main Block 4F (Executive Suite) -->
              <rect x="475" y="15" width="110" height="130" rx="6" class="floorplan-room ${activeMapRoom === 'HQ Main Block 4F' ? 'active' : ''}" data-room="HQ Main Block 4F" />
              <text x="530" y="83" class="floorplan-text">Exec Suite 4F</text>

              <!-- Ground Garage P-2 -->
              <rect x="15" y="85" width="450" height="60" rx="6" class="floorplan-room ${activeMapRoom === 'Ground Garage P-2' ? 'active' : ''}" data-room="Ground Garage P-2" />
              <text x="240" y="120" class="floorplan-text">Ground Garage P-2</text>
            </svg>
          </div>
        </div>

        <div class="glass-panel animate-fade-in" style="margin-bottom: 24px;">
          <div class="panel-header" style="margin-bottom: 16px;">
            <h2><i data-lucide="filter"></i> Search & Filters</h2>
            ${user.role === 'Admin' || user.role === 'Asset Manager' ? `
              <button class="btn btn-primary btn-sm" id="btnRegisterAssetDirectory">
                <i data-lucide="plus"></i> Register Asset
              </button>
            ` : ''}
          </div>
          
          <!-- Filters row -->
          <div style="display:grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap:16px;">
            <div class="form-group" style="margin-bottom:0;">
              <label for="filterQueryInput">Search query</label>
              <div style="position:relative;">
                <input type="text" id="filterQueryInput" class="form-input" placeholder="Search by tag, name, serial or location..." value="${filterQuery}" />
              </div>
            </div>
            
            <div class="form-group" style="margin-bottom:0;">
              <label for="filterCategorySelect">Category</label>
              <select id="filterCategorySelect" class="form-select">
                <option value="">All Categories</option>
                ${categories.map(c => `<option value="${c.id}" ${filterCategory === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group" style="margin-bottom:0;">
              <label for="filterStatusSelect">Lifecycle Status</label>
              <select id="filterStatusSelect" class="form-select">
                <option value="">All Statuses</option>
                <option value="Available" ${filterStatus === 'Available' ? 'selected' : ''}>Available</option>
                <option value="Allocated" ${filterStatus === 'Allocated' ? 'selected' : ''}>Allocated</option>
                <option value="Reserved" ${filterStatus === 'Reserved' ? 'selected' : ''}>Reserved</option>
                <option value="Under Maintenance" ${filterStatus === 'Under Maintenance' ? 'selected' : ''}>Under Maintenance</option>
                <option value="Lost" ${filterStatus === 'Lost' ? 'selected' : ''}>Lost</option>
                <option value="Retired" ${filterStatus === 'Retired' ? 'selected' : ''}>Retired</option>
                <option value="Disposed" ${filterStatus === 'Disposed' ? 'selected' : ''}>Disposed</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom:0;">
              <label for="filterConditionSelect">Condition</label>
              <select id="filterConditionSelect" class="form-select">
                <option value="">All Conditions</option>
                <option value="New" ${filterCondition === 'New' ? 'selected' : ''}>New</option>
                <option value="Good" ${filterCondition === 'Good' ? 'selected' : ''}>Good</option>
                <option value="Fair" ${filterCondition === 'Fair' ? 'selected' : ''}>Fair</option>
                <option value="Poor" ${filterCondition === 'Poor' ? 'selected' : ''}>Poor</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Asset grid -->
        <div class="asset-cards-grid">
          ${filtered.map(a => {
            const cat = categories.find(c => c.id === a.categoryId);
            return `
              <div class="glass-panel asset-card state-${a.status} animate-fade-in" data-id="${a.id}">
                <div class="asset-card-banner"></div>
                <div class="asset-card-title">
                  <span title="${a.name}">${a.name}</span>
                  <span class="badge badge-${a.status.toLowerCase().replace(' ', '-')}">${a.status}</span>
                </div>
                <div class="asset-card-tag">${a.tag}</div>
                
                <div class="asset-card-details">
                  <div class="asset-card-detail-item">
                    <i data-lucide="tag"></i>
                    <span>Category: ${cat ? cat.name : 'Unknown'}</span>
                  </div>
                  <div class="asset-card-detail-item">
                    <i data-lucide="map-pin"></i>
                    <span>Location: ${a.location}</span>
                  </div>
                  <div class="asset-card-detail-item">
                    <i data-lucide="activity"></i>
                    <span>Condition: ${a.condition}</span>
                  </div>
                  ${a.shared ? `
                    <div class="asset-card-detail-item" style="color:var(--secondary); font-weight:600;">
                      <i data-lucide="calendar"></i>
                      <span>Shared Bookable Resource</span>
                    </div>
                  ` : ''}
                </div>

                <div class="asset-card-footer">
                  <span style="font-size:0.75rem; color:var(--text-muted);">S/N: ${a.serialNumber}</span>
                  <button class="btn btn-secondary btn-sm" style="padding: 4px 8px;">View Details</button>
                </div>
              </div>
            `;
          }).join('')}

          ${filtered.length === 0 ? `
            <div class="glass-panel" style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--text-muted);">
              <i data-lucide="package-search" style="width:48px; height:48px; margin:0 auto 16px auto; opacity:0.3; display:block;"></i>
              <p>No matching assets found in directory. Modify filters or register a new tag.</p>
            </div>
          ` : ''}
        </div>
      `;

      lucide.createIcons();
      bindEvents();
    };

    const bindEvents = () => {
      const qInput = container.querySelector('#filterQueryInput');
      const cSelect = container.querySelector('#filterCategorySelect');
      const sSelect = container.querySelector('#filterStatusSelect');
      const condSelect = container.querySelector('#filterConditionSelect');

      // Bind filter changes
      qInput.addEventListener('input', () => {
        filterQuery = qInput.value.toLowerCase().trim();
        drawView();
        container.querySelector('#filterQueryInput').focus();
      });

      cSelect.addEventListener('change', () => {
        filterCategory = cSelect.value;
        drawView();
      });

      sSelect.addEventListener('change', () => {
        filterStatus = sSelect.value;
        drawView();
      });

      condSelect.addEventListener('change', () => {
        filterCondition = condSelect.value;
        drawView();
      });

      // SVG Floor map room clicks
      container.querySelectorAll('.floorplan-room').forEach(room => {
        room.addEventListener('click', (e) => {
          const roomName = e.currentTarget.dataset.room;
          if (activeMapRoom === roomName) {
            activeMapRoom = ''; // Toggle off
          } else {
            activeMapRoom = roomName; // Filter by room
          }
          drawView();
        });
      });

      // Reset Map button
      const resetMapBtn = container.querySelector('#btnResetMapFilter');
      if (resetMapBtn) {
        resetMapBtn.addEventListener('click', () => {
          activeMapRoom = '';
          drawView();
        });
      }

      // Register asset click
      const regBtn = container.querySelector('#btnRegisterAssetDirectory');
      if (regBtn) {
        regBtn.addEventListener('click', () => {
          DashboardView.openRegisterModal(appInstance);
        });
      }

      // Card click opens modal
      container.querySelectorAll('.asset-card').forEach(card => {
        card.addEventListener('click', () => {
          const id = card.dataset.id;
          appInstance.openAssetDetailModal(id);
        });
      });
    };

    drawView();
  }
};
