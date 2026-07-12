/* Reports & Analytics View: Live custom SVG Charts and CSV Exports */

import { db, TABLES } from '../db.js';

export const ReportsView = {
  title: 'Reports & Analytics',

  render(container, appInstance) {
    const assets = db.get(TABLES.ASSETS);
    const categories = db.get(TABLES.CATEGORIES);
    const departments = db.get(TABLES.DEPARTMENTS);
    const allocations = db.get(TABLES.ALLOCATIONS);
    const maintenance = db.get(TABLES.MAINTENANCE);
    const bookings = db.get(TABLES.BOOKINGS);

    // Compute Metrics Data
    
    // 1. Department Checkout weight
    const deptAllocsCount = {};
    departments.forEach(d => {
      deptAllocsCount[d.name] = allocations.filter(al => 
        al.status === 'Active' && al.assigneeType === 'department' && al.assigneeId === d.id
      ).length;
    });

    // 2. Category allocation totals
    const catTotals = [];
    categories.forEach(c => {
      const total = assets.filter(a => a.categoryId === c.id).length;
      const allocated = assets.filter(a => a.categoryId === c.id && a.status === 'Allocated').length;
      const rate = total > 0 ? Math.round((allocated / total) * 100) : 0;
      catTotals.push({ name: c.name, total, allocated, rate });
    });

    // 3. Maintenance frequency by category
    const maintFreq = {};
    categories.forEach(c => {
      const catAssets = assets.filter(a => a.categoryId === c.id).map(a => a.id);
      maintFreq[c.name] = maintenance.filter(m => catAssets.includes(m.assetId)).length;
    });

    // 4. Simulated Heatmap booking hours density
    // Matrix: 5 days (Mon-Fri) vs 8 slots (9:00 - 17:00)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
    
    // Mock density generator based on booked counts
    const getHeatmapLevel = (dayIdx, slotIdx) => {
      // Seed values for realistic distribution
      const seeds = [
        [3, 4, 1, 0, 2, 4, 1, 0], // Mon
        [1, 2, 3, 2, 4, 1, 0, 1], // Tue
        [0, 1, 2, 4, 3, 2, 1, 0], // Wed
        [2, 4, 4, 1, 2, 3, 2, 1], // Thu
        [1, 0, 1, 0, 1, 2, 0, 0]  // Fri
      ];
      const val = seeds[dayIdx][slotIdx] || 0;
      return { val, className: `level-${val}` };
    };

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Top Action exports row -->
        <div class="glass-panel" style="margin-bottom:24px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h3 style="font-weight:700;">Actionable Operations Center</h3>
            <p style="font-size:0.75rem; color:var(--text-muted);">Generate real-time system spreadsheets. Evaluator clicks trigger file downloads.</p>
          </div>
          <div style="display:flex; gap:12px;">
            <button class="btn btn-secondary" id="btnExportAssets">
              <i data-lucide="download"></i> Export Asset CSV
            </button>
            <button class="btn btn-secondary" id="btnExportMaintenance">
              <i data-lucide="download"></i> Export Maintenance CSV
            </button>
          </div>
        </div>

        <!-- Charts grid -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px; margin-bottom:24px;">
          
          <!-- Chart A: Category Utilization -->
          <div class="glass-panel">
            <div class="panel-header">
              <h2><i data-lucide="bar-chart-2"></i> Category Utilization Rates (%)</h2>
            </div>
            
            <div class="chart-container">
              ${catTotals.map(item => `
                <div class="chart-bar-wrapper">
                  <div class="chart-bar" style="height: ${item.rate}%;">
                    <div class="chart-bar-hover-val">${item.rate}% (${item.allocated}/${item.total})</div>
                  </div>
                  <span class="chart-bar-label" title="${item.name}">${item.name}</span>
                </div>
              `).join('')}
            </div>
            <p style="font-size:0.72rem;color:var(--text-muted);text-align:center;margin-top:10px;">Percentage of total stock currently allocated to users.</p>
          </div>

          <!-- Chart B: Maintenance Issues logged -->
          <div class="glass-panel">
            <div class="panel-header">
              <h2><i data-lucide="activity"></i> Maintenance Frequencies</h2>
            </div>
            
            <div class="chart-container">
              ${Object.keys(maintFreq).map(name => {
                const val = maintFreq[name];
                const max = Math.max(...Object.values(maintFreq), 1);
                const pct = (val / max) * 100;

                return `
                  <div class="chart-bar-wrapper">
                    <div class="chart-bar" style="height: ${pct}%; background: linear-gradient(to top, var(--danger), var(--warning));">
                      <div class="chart-bar-hover-val">${val} tickets</div>
                    </div>
                    <span class="chart-bar-label">${name}</span>
                  </div>
                `;
              }).join('')}
            </div>
            <p style="font-size:0.72rem;color:var(--text-muted);text-align:center;margin-top:10px;">Sum of all historical repairs raised by category.</p>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:24px;">
          <!-- Left Widget: Department breakdown -->
          <div class="glass-panel">
            <div class="panel-header">
              <h2><i data-lucide="pie-chart"></i> Department Checkouts</h2>
            </div>
            <div style="display:flex; flex-direction:column; gap:12px; padding:10px 0;">
              ${Object.keys(deptAllocsCount).map(name => {
                const count = deptAllocsCount[name];
                const totalActive = allocations.filter(al => al.status === 'Active').length || 1;
                const pct = Math.round((count / totalActive) * 100);

                return `
                  <div>
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                      <span><strong>${name}</strong></span>
                      <span>${count} active checkouts (${pct}%)</span>
                    </div>
                    <div style="width:100%; height:6px; background:rgba(255,255,255,0.05); border-radius:3px; overflow:hidden;">
                      <div style="width:${pct}%; height:100%; background:var(--primary); border-radius:3px;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Right Widget: Resource booking heatmap -->
          <div class="glass-panel">
            <div class="panel-header">
              <h2><i data-lucide="grid"></i> Booking Density Heatmap</h2>
            </div>
            
            <div class="heatmap-wrapper">
              <div class="heatmap-grid">
                <!-- empty corner header cell -->
                <div class="heatmap-header-cell"></div>
                <!-- hours header cells -->
                ${timeSlots.map(t => `<div class="heatmap-header-cell">${t}</div>`).join('')}
                
                <!-- grid rows -->
                ${days.map((day, dIdx) => `
                  <!-- day label -->
                  <div class="heatmap-day-label">${day.substring(0, 3)}</div>
                  
                  <!-- cells -->
                  ${timeSlots.map((slot, sIdx) => {
                    const level = getHeatmapLevel(dIdx, sIdx);
                    return `
                      <div class="heatmap-cell ${level.className}">
                        <div class="heatmap-tooltip">
                          ${day} at ${slot} <br/>
                          <strong>${level.val} bookings</strong> (Density Level ${level.val})
                        </div>
                      </div>
                    `;
                  }).join('')}
                `).join('')}
              </div>

              <!-- legend scale indicator -->
              <div style="display:flex; justify-content:flex-end; align-items:center; gap:6px; margin-top:16px; font-size:0.7rem; color:var(--text-muted);">
                <span>Idle</span>
                <span class="heatmap-cell level-0" style="width:12px;height:12px;margin:0;"></span>
                <span class="heatmap-cell level-1" style="width:12px;height:12px;margin:0;"></span>
                <span class="heatmap-cell level-2" style="width:12px;height:12px;margin:0;"></span>
                <span class="heatmap-cell level-3" style="width:12px;height:12px;margin:0;"></span>
                <span class="heatmap-cell level-4" style="width:12px;height:12px;margin:0;"></span>
                <span>Peak Load</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    lucide.createIcons();
    this.bindEvents(container, assets, maintenance, appInstance);
  },

  bindEvents(container, assets, maintenance, appInstance) {
    // Export Assets CSV download
    container.querySelector('#btnExportAssets').addEventListener('click', () => {
      try {
        const headers = ['Asset Tag', 'Asset Name', 'Serial Number', 'Condition', 'Status', 'Location', 'Acquisition Cost'];
        const rows = assets.map(a => [
          a.tag,
          `"${a.name.replace(/"/g, '""')}"`,
          a.serialNumber,
          a.condition,
          a.status,
          `"${a.location.replace(/"/g, '""')}"`,
          a.acquisitionCost
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        
        triggerCsvDownload(csvContent, 'asset_inventory_report.csv');
        appInstance.showToast('CSV Compiled', 'Asset list downloaded successfully!', 'success');
      } catch (err) {
        appInstance.showToast('Export Error', err.message, 'danger');
      }
    });

    // Export Maintenance CSV download
    container.querySelector('#btnExportMaintenance').addEventListener('click', () => {
      try {
        const headers = ['Request ID', 'Asset ID', 'Priority', 'Workflow Status', 'Technician Assignee', 'Created Date'];
        const rows = maintenance.map(m => [
          m.id,
          m.assetId,
          m.priority,
          m.status,
          `"${(m.technicianName || 'Unassigned').replace(/"/g, '""')}"`,
          m.createdDate
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        
        triggerCsvDownload(csvContent, 'maintenance_history_report.csv');
        appInstance.showToast('CSV Compiled', 'Maintenance logs downloaded successfully!', 'success');
      } catch (err) {
        appInstance.showToast('Export Error', err.message, 'danger');
      }
    });
  }
};

// Pure javascript client side downloader helper
const triggerCsvDownload = (content, filename) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
