/* Resource Booking View: Overlap-validated Scheduler */

import { db, TABLES } from '../db.js';

export const BookingView = {
  title: 'Resource Bookings',

  render(container, appInstance) {
    const assets = db.get(TABLES.ASSETS);
    const sharedResources = assets.filter(a => a.shared && a.status !== 'Retired' && a.status !== 'Disposed');

    // Default select state
    let selectedResourceId = sharedResources.length > 0 ? sharedResources[0].id : '';
    let selectedDate = new Date().toISOString().split('T')[0];

    const drawView = () => {
      const bookings = db.get(TABLES.BOOKINGS);
      const employees = db.get(TABLES.EMPLOYEES);
      
      const currentResource = sharedResources.find(r => r.id === selectedResourceId);
      
      // Filter bookings for target resource & date
      const activeBookings = bookings.filter(b => 
        b.resourceId === selectedResourceId && 
        b.date === selectedDate && 
        b.status !== 'Cancelled'
      );

      container.innerHTML = `
        <div class="booking-grid-wrapper animate-fade-in">
          <!-- Calendar Row layout -->
          <div style="display:grid; grid-template-columns: 320px 1fr; gap:24px;">
            
            <!-- Left panel schedule form -->
            <div class="glass-panel" style="height: fit-content;">
              <h3 style="margin-bottom:16px; font-size:1.1rem; color:var(--primary);"><i data-lucide="calendar"></i> Reserve Resource</h3>
              
              <form id="bookResourceForm">
                <div class="form-group">
                  <label for="bookResource">Select Resource</label>
                  <select id="bookResource" class="form-select" required>
                    ${sharedResources.map(r => `
                      <option value="${r.id}" ${selectedResourceId === r.id ? 'selected' : ''}>${r.tag} : ${r.name}</option>
                    `).join('')}
                    ${sharedResources.length === 0 ? '<option value="">No shared resources registered</option>' : ''}
                  </select>
                </div>

                <div class="form-group">
                  <label for="bookDate">Reservation Date</label>
                  <input type="date" id="bookDate" class="form-input" value="${selectedDate}" required />
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="bookStart">Start Time</label>
                    <select id="bookStart" class="form-select" required>
                      ${generateTimeOptions()}
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="bookEnd">End Time</label>
                    <select id="bookEnd" class="form-select" required>
                      ${generateTimeOptions()}
                    </select>
                  </div>
                </div>

                <button type="submit" class="btn btn-primary" style="width:100%; margin-top:10px;" ${sharedResources.length === 0 ? 'disabled' : ''}>
                  Confirm Reservation
                </button>
              </form>

              <div style="margin-top:20px; padding:12px; background:rgba(255,255,255,0.02); border-radius:8px; border:1px solid var(--border-color); font-size:0.75rem; color:var(--text-muted);">
                <h4 style="margin-bottom:6px; font-weight:600;"><i data-lucide="shield-alert"></i> Booking Rules:</h4>
                <ul style="padding-left:14px; display:flex; flex-direction:column; gap:4px;">
                  <li>Conflict Engine blocks overlapping hours automatically.</li>
                  <li>Adjacent reservations (e.g. 10:00-11:00 and 11:00-12:00) are permitted.</li>
                  <li>Available slots: 08:00 AM to 08:00 PM.</li>
                </ul>
              </div>
            </div>

            <!-- Right panel visual scheduler -->
            <div>
              <div class="booking-calendar-card">
                <div class="calendar-header">
                  <div>
                    <h3 style="font-weight:700;">${currentResource ? currentResource.name : 'No Resource Selected'}</h3>
                    <span style="font-size:0.78rem; color:var(--text-muted);">
                      Tag: ${currentResource ? currentResource.tag : '—'} | Location: ${currentResource ? currentResource.location : '—'}
                    </span>
                  </div>
                  <div style="display:flex; align-items:center; gap:8px;">
                    <button class="btn btn-secondary btn-sm" id="btnPrevDay"><i data-lucide="chevron-left"></i></button>
                    <span style="font-weight:600;font-size:0.9rem;" id="calendarDateLabel">${new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <button class="btn btn-secondary btn-sm" id="btnNextDay"><i data-lucide="chevron-right"></i></button>
                  </div>
                </div>

                <div class="calendar-grid scrollbar-custom" style="max-height:600px; overflow-y:auto; position:relative;">
                  <!-- Hourly scale (08:00 to 20:00) -->
                  <div class="calendar-hours-col">
                    ${Array.from({ length: 12 }).map((_, idx) => {
                      const h = 8 + idx;
                      return `
                        <div class="calendar-hour-cell">
                          ${String(h).padStart(2, '0')}:00
                        </div>
                      `;
                    }).join('')}
                  </div>

                  <!-- Slot Rows Area -->
                  <div class="calendar-slots-col" id="calendarSlotsCol">
                    ${Array.from({ length: 12 }).map((_, idx) => `
                      <div class="calendar-slot-row"></div>
                    `).join('')}

                    <!-- Absolute Booking Blocks injected here -->
                    ${activeBookings.map(b => {
                      const user = employees.find(e => e.id === b.bookedById);
                      
                      // Calculate pixel layouts relative to 60px height rows
                      const [sh, sm] = b.startTime.split(':').map(Number);
                      const [eh, em] = b.endTime.split(':').map(Number);
                      
                      const startMinsOffset = (sh - 8) * 60 + sm;
                      const durationMins = (eh - sh) * 60 + (em - sm);
                      
                      const topPx = (startMinsOffset / 60) * 60;
                      const heightPx = (durationMins / 60) * 60;

                      return `
                        <div class="booking-block status-${b.status}" style="top:${topPx}px; height:${heightPx}px;" data-id="${b.id}">
                          <div class="booking-block-title">${user ? user.name : 'Reserved slot'}</div>
                          <div class="booking-block-time">${b.startTime} - ${b.endTime}</div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      `;

      lucide.createIcons();
      bindEvents();
    };

    // Helper to list hours options
    const generateTimeOptions = () => {
      const options = [];
      for (let h = 8; h <= 20; h++) {
        const timeStrVal = `${String(h).padStart(2, '0')}:00`;
        const timeStrDisplay = h <= 11 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;
        options.push(`<option value="${timeStrVal}">${timeStrDisplay}</option>`);

        if (h !== 20) {
          const halfStrVal = `${String(h).padStart(2, '0')}:30`;
          const halfStrDisplay = h <= 11 ? `${h}:30 AM` : h === 12 ? '12:30 PM' : `${h - 12}:30 PM`;
          options.push(`<option value="${halfStrVal}">${halfStrDisplay}</option>`);
        }
      }
      return options.join('');
    };

    const bindEvents = () => {
      const form = container.querySelector('#bookResourceForm');
      const rSelect = container.querySelector('#bookResource');
      const dInput = container.querySelector('#bookDate');
      const startSelect = container.querySelector('#bookStart');
      const endSelect = container.querySelector('#bookEnd');
      const prevBtn = container.querySelector('#btnPrevDay');
      const nextBtn = container.querySelector('#btnNextDay');

      // Adjust defaults
      startSelect.value = '09:00';
      endSelect.value = '10:00';

      // Dropdowns change handler
      rSelect.addEventListener('change', () => {
        selectedResourceId = rSelect.value;
        drawView();
      });

      dInput.addEventListener('change', () => {
        selectedDate = dInput.value;
        drawView();
      });

      // Calendar pagination (previous day)
      prevBtn.addEventListener('click', () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - 1);
        selectedDate = d.toISOString().split('T')[0];
        drawView();
      });

      // Calendar pagination (next day)
      nextBtn.addEventListener('click', () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + 1);
        selectedDate = d.toISOString().split('T')[0];
        drawView();
      });

      // Submit new booking
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        try {
          db.bookResource(appInstance.currentUser.id, {
            resourceId: selectedResourceId,
            date: selectedDate,
            startTime: startSelect.value,
            endTime: endSelect.value
          });

          appInstance.showToast('Booking Complete', 'Resource successfully booked!', 'success');
          
          // Re-render UI
          drawView();
        } catch (err) {
          appInstance.showToast('Booking Conflict', err.message, 'danger');
        }
      });

      // Click booking blocks to view Details / Cancel
      container.querySelectorAll('.booking-block').forEach(block => {
        block.addEventListener('click', (e) => {
          e.stopPropagation();
          const bookingId = block.dataset.id;
          openBookingDetailModal(bookingId);
        });
      });
    };

    // Modal popup showing details and cancellation action
    const openBookingDetailModal = (bookingId) => {
      const bookings = db.get(TABLES.BOOKINGS);
      const employees = db.get(TABLES.EMPLOYEES);
      const assets = db.get(TABLES.ASSETS);

      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) return;

      const user = employees.find(e => e.id === booking.bookedById);
      const asset = assets.find(a => a.id === booking.resourceId);

      const loggedUser = appInstance.currentUser;
      const isOwner = loggedUser.id === booking.bookedById;
      const isPrivileged = loggedUser.role === 'Admin' || loggedUser.role === 'Asset Manager';

      const content = `
        <div class="modal-header">
          <h2>Reservation Details</h2>
          <button class="close-icon-btn" data-modal-close><i data-lucide="x"></i></button>
        </div>
        <div class="asset-card-details" style="margin-bottom: 24px;">
          <div class="asset-card-detail-item">
            <strong>Resource:</strong> <span>${asset ? asset.name : '—'} (${asset ? asset.tag : ''})</span>
          </div>
          <div class="asset-card-detail-item">
            <strong>Reserved By:</strong> <span>${user ? user.name : '—'} (${user ? user.email : ''})</span>
          </div>
          <div class="asset-card-detail-item">
            <strong>Booking Date:</strong> <span>${booking.date}</span>
          </div>
          <div class="asset-card-detail-item">
            <strong>Time Slot:</strong> <span>${booking.startTime} - ${booking.endTime}</span>
          </div>
          <div class="asset-card-detail-item">
            <strong>Booking ID:</strong> <code>${booking.id}</code>
          </div>
        </div>

        <div class="modal-footer">
          ${isOwner || isPrivileged ? `
            <button class="btn btn-danger" id="btnCancelBookingModal">Cancel Reservation</button>
          ` : ''}
          <button class="btn btn-secondary" data-modal-close>Close</button>
        </div>
      `;

      const setupModalEvents = (card) => {
        const cancelBtn = card.querySelector('#btnCancelBookingModal');
        if (cancelBtn) {
          cancelBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to cancel this reservation slot?')) {
              try {
                db.cancelBooking(appInstance.currentUser.id, bookingId);
                appInstance.showToast('Cancelled', 'Reservation successfully cancelled.', 'info');
                appInstance.closeModal();
                drawView();
              } catch (err) {
                appInstance.showToast('Error', err.message, 'danger');
              }
            }
          });
        }
      };

      appInstance.openModal(content, setupModalEvents);
    };

    drawView();
  }
};
