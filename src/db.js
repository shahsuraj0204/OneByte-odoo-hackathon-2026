/* OmniSync LocalStorage Database & Validation Layer */

const DB_KEY_PREFIX = 'omnisync_';

// Core Schema Table Keys
export const TABLES = {
  EMPLOYEES: 'employees',
  DEPARTMENTS: 'departments',
  CATEGORIES: 'categories',
  ASSETS: 'assets',
  ALLOCATIONS: 'allocations',
  TRANSFERS: 'transfers',
  BOOKINGS: 'bookings',
  MAINTENANCE: 'maintenance',
  AUDITS: 'audits',
  LOGS: 'logs',
  NOTIFICATIONS: 'notifications'
};

class LocalDB {
  constructor() {
    this.init();
  }

  // Get table from localStorage
  get(table) {
    try {
      const data = localStorage.getItem(DB_KEY_PREFIX + table);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Error reading table ${table} from localStorage`, e);
      return [];
    }
  }

  // Save table to localStorage
  set(table, data) {
    try {
      localStorage.setItem(DB_KEY_PREFIX + table, JSON.stringify(data));
      // Dispatch storage event to update other instances if open
      window.dispatchEvent(new Event('omnisync_db_update'));
    } catch (e) {
      console.error(`Error saving table ${table} to localStorage`, e);
    }
  }

  // Initialize DB tables if they don't exist
  init(forceReset = false) {
    let initialized = localStorage.getItem(DB_KEY_PREFIX + 'initialized');
    if (!initialized || forceReset) {
      this.seedDefaultData();
      localStorage.setItem(DB_KEY_PREFIX + 'initialized', 'true');
    }
  }

  // Reset database back to clean defaults
  reset() {
    this.init(true);
  }

  // Seed default data with relative dates so bookings & overdue returns are always relative to current execution
  seedDefaultData() {
    const today = new Date();
    const formatDate = (daysOffset, hour = 0, minute = 0) => {
      const date = new Date(today);
      date.setDate(today.getDate() + daysOffset);
      date.setHours(hour, minute, 0, 0);
      return date.toISOString().split('T')[0];
    };

    const formatDateTime = (daysOffset, hour, minute) => {
      const date = new Date(today);
      date.setDate(today.getDate() + daysOffset);
      date.setHours(hour, minute, 0, 0);
      return date.toISOString();
    };

    // 1. Seed Departments
    const departments = [
      { id: 'd-1', name: 'Information Technology', headId: 'e-3', parentId: null, status: 'Active' },
      { id: 'd-2', name: 'Human Resources', headId: 'e-4', parentId: null, status: 'Active' },
      { id: 'd-3', name: 'Facilities & Logistics', headId: 'e-3', parentId: null, status: 'Active' },
      { id: 'd-4', name: 'Executive Suite', headId: 'e-1', parentId: null, status: 'Active' },
      { id: 'd-5', name: 'DevOps Division', headId: 'e-3', parentId: 'd-1', status: 'Active' }
    ];

    // 2. Seed Categories
    const categories = [
      { id: 'c-1', name: 'Electronics', fields: ['Warranty Period (months)', 'OS Version', 'RAM (GB)'] },
      { id: 'c-2', name: 'Furniture', fields: ['Material', 'Ergonomic Rating'] },
      { id: 'c-3', name: 'Vehicles', fields: ['License Plate', 'Mileage', 'Fuel/Battery Capacity'] },
      { id: 'c-4', name: 'Office Spaces', fields: ['Capacity', 'AV Equipment'] },
      { id: 'c-5', name: 'Heavy Machinery', fields: ['Calibration Period', 'Safety Cert Class'] }
    ];

    // 3. Seed Employees
    // Passwords are pre-hashed for simulator simplicity (cleartext check in demo)
    const employees = [
      { id: 'e-1', name: 'Alice Smith', email: 'admin@omnisync.com', password: 'admin123', departmentId: 'd-4', role: 'Admin', status: 'Active' },
      { id: 'e-2', name: 'Sarah Connor', email: 'manager@omnisync.com', password: 'manager123', departmentId: 'd-3', role: 'Asset Manager', status: 'Active' },
      { id: 'e-3', name: 'Priya Patel', email: 'head@omnisync.com', password: 'head123', departmentId: 'd-1', role: 'Department Head', status: 'Active' },
      { id: 'e-4', name: 'Raj Kumar', email: 'employee@omnisync.com', password: 'employee123', departmentId: 'd-2', role: 'Employee', status: 'Active' },
      { id: 'e-5', name: 'Alex Chen', email: 'alex@omnisync.com', password: 'employee123', departmentId: 'd-1', role: 'Employee', status: 'Active' },
      { id: 'e-6', name: 'Maria Santos', email: 'maria@omnisync.com', password: 'employee123', departmentId: 'd-2', role: 'Employee', status: 'Active' },
      { id: 'e-7', name: 'John Doe', email: 'john@omnisync.com', password: 'employee123', departmentId: 'd-3', role: 'Employee', status: 'Active' }
    ];

    // 4. Seed Assets
    const assets = [
      { 
        id: 'a-1', tag: 'AF-0001', name: 'MacBook Pro 16"', categoryId: 'c-1', serialNumber: 'C02F832LMD6M', 
        acquisitionDate: formatDate(-365), acquisitionCost: 2499, condition: 'Good', location: 'IT Lab 202', 
        shared: false, status: 'Allocated', 
        customValues: { 'Warranty Period (months)': '36', 'OS Version': 'macOS Sequoia', 'RAM (GB)': '32' },
        history: [{ date: formatDateTime(-365, 9, 0), type: 'Registration', user: 'Sarah Connor', notes: 'Asset registered and provisioned.' }]
      },
      { 
        id: 'a-2', tag: 'AF-0002', name: 'Dell XPS 15', categoryId: 'c-1', serialNumber: '5H9KJ43', 
        acquisitionDate: formatDate(-180), acquisitionCost: 1899, condition: 'New', location: 'IT Inventory Shelf B', 
        shared: false, status: 'Available', 
        customValues: { 'Warranty Period (months)': '24', 'OS Version': 'Windows 11 Pro', 'RAM (GB)': '16' },
        history: [{ date: formatDateTime(-180, 10, 0), type: 'Registration', user: 'Sarah Connor', notes: 'Unboxed and formatted.' }]
      },
      { 
        id: 'a-3', tag: 'AF-0003', name: 'Boardroom Delta (Level 4)', categoryId: 'c-4', serialNumber: 'RM-BD4', 
        acquisitionDate: formatDate(-730), acquisitionCost: 12000, condition: 'Good', location: 'HQ Main Block 4F', 
        shared: true, status: 'Available', 
        customValues: { 'Capacity': '18', 'AV Equipment': 'Dual Projector, Polycom Video Hub' },
        history: [{ date: formatDateTime(-730, 9, 0), type: 'Registration', user: 'Sarah Connor', notes: 'Assigned as a bookable resource.' }]
      },
      { 
        id: 'a-4', tag: 'AF-0004', name: 'Tesla Model 3 (Fleet 102)', categoryId: 'c-3', serialNumber: '5YJ3E1EB8LF8324', 
        acquisitionDate: formatDate(-300), acquisitionCost: 45000, condition: 'Good', location: 'Ground Garage P-2', 
        shared: true, status: 'Allocated', 
        customValues: { 'License Plate': 'CA-92-FLOW', 'Mileage': '12450', 'Fuel/Battery Capacity': '75 kWh' },
        history: [{ date: formatDateTime(-300, 11, 0), type: 'Registration', user: 'Sarah Connor', notes: 'Registered to company vehicle fleet.' }]
      },
      { 
        id: 'a-5', tag: 'AF-0005', name: 'Ergonomic Mesh Chair', categoryId: 'c-2', serialNumber: 'CH-98124', 
        acquisitionDate: formatDate(-90), acquisitionCost: 450, condition: 'Good', location: 'Open Office 3A', 
        shared: false, status: 'Available', 
        customValues: { 'Material': 'Mesh/Aluminum', 'Ergonomic Rating': 'A+' },
        history: []
      },
      { 
        id: 'a-6', tag: 'AF-0006', name: 'Sony Laser Projector Alpha', categoryId: 'c-1', serialNumber: 'SNY-PJ902', 
        acquisitionDate: formatDate(-400), acquisitionCost: 3500, condition: 'Fair', location: 'IT Maintenance Desk', 
        shared: true, status: 'Under Maintenance', 
        customValues: { 'Warranty Period (months)': '12', 'OS Version': 'Proprietary', 'RAM (GB)': '4' },
        history: []
      },
      { 
        id: 'a-7', tag: 'AF-0007', name: 'iPhone 14 Enterprise', categoryId: 'c-1', serialNumber: 'IPH14-998822', 
        acquisitionDate: formatDate(-150), acquisitionCost: 999, condition: 'Good', location: 'Unknown', 
        shared: false, status: 'Lost', 
        customValues: { 'Warranty Period (months)': '12', 'OS Version': 'iOS 17', 'RAM (GB)': '6' },
        history: []
      },
      { 
        id: 'a-8', tag: 'AF-0008', name: 'HP LaserJet Copier Pro', categoryId: 'c-1', serialNumber: 'HP-COPY-883', 
        acquisitionDate: formatDate(-1000), acquisitionCost: 5500, condition: 'Poor', location: 'Disposal Yard', 
        shared: false, status: 'Retired', 
        customValues: {},
        history: []
      }
    ];

    // 5. Seed Allocations
    // MacBook AF-0001 is allocated to Employee Priya Patel (e-3). It is OVERDUE (past expected return date).
    // Tesla AF-0004 is allocated to the Fleet/Logistics Department (d-3).
    const allocations = [
      {
        id: 'al-1', assetId: 'a-1', assigneeType: 'employee', assigneeId: 'e-3', 
        allocatedDate: formatDate(-10), expectedReturnDate: formatDate(-3), 
        actualReturnDate: null, notes: 'Provisioned for work-from-home tasks.', status: 'Active'
      },
      {
        id: 'al-2', assetId: 'a-4', assigneeType: 'department', assigneeId: 'd-3',
        allocatedDate: formatDate(-20), expectedReturnDate: null, 
        actualReturnDate: null, notes: 'Allocated to Logistics department as shared transit unit.', status: 'Active'
      }
    ];

    // Update MacBook and Tesla history lists to match initial allocation states
    assets[0].history.push({
      date: formatDateTime(-10, 9, 30), type: 'Allocation', user: 'Sarah Connor', 
      notes: 'Allocated to employee Priya Patel. Expected return: ' + formatDate(-3)
    });
    assets[3].history.push({
      date: formatDateTime(-20, 14, 0), type: 'Allocation', user: 'Sarah Connor', 
      notes: 'Allocated to Facilities & Logistics department.'
    });

    // 6. Seed Transfer Requests
    // Employee Raj wants to request MacBook AF-0001 from Priya Patel
    const transfers = [
      {
        id: 't-1', allocationId: 'al-1', fromEmployeeId: 'e-3', toEmployeeId: 'e-4',
        requestDate: formatDateTime(-2, 10, 15), status: 'Pending', notes: 'Need high performance laptop to finish the React compiler build compilation.'
      }
    ];

    // 7. Seed Bookings (Resource Bookings)
    // Boardroom Delta is booked:
    // Slot A: 09:00 - 10:00 (Today) by Priya Patel (Ongoing/Completed depending on load time)
    // Slot B: 10:30 - 12:00 (Today) by Raj Kumar (Upcoming)
    // Tesla Model 3 is booked today: 14:00 - 16:30 by Department Head
    const bookings = [
      {
        id: 'b-1', resourceId: 'a-3', bookedById: 'e-3', date: formatDate(0),
        startTime: '09:00', endTime: '10:00', status: 'Ongoing'
      },
      {
        id: 'b-2', resourceId: 'a-3', bookedById: 'e-4', date: formatDate(0),
        startTime: '10:30', endTime: '12:00', status: 'Upcoming'
      },
      {
        id: 'b-3', resourceId: 'a-4', bookedById: 'e-3', date: formatDate(0),
        startTime: '14:00', endTime: '16:30', status: 'Upcoming'
      }
    ];

    // 8. Seed Maintenance Requests
    const maintenance = [
      {
        id: 'm-1', assetId: 'a-6', reportedById: 'e-5', description: 'Laser lamp blinking yellow. Needs bulb diagnostic.', 
        priority: 'High', status: 'In Progress', technicianName: 'TechSolutions Inc', resolutionNotes: '', 
        createdDate: formatDateTime(-4, 11, 0)
      },
      {
        id: 'm-2', assetId: 'a-4', reportedById: 'e-7', description: 'Regular tire pressure rotation audit.',
        priority: 'Low', status: 'Resolved', technicianName: 'Tesla Service Center', resolutionNotes: 'Tire rotation completed, pressure set to 42 psi.', 
        createdDate: formatDateTime(-15, 8, 30)
      }
    ];

    // 9. Seed Audit Cycles
    const audits = [
      {
        id: 'aud-1', title: 'Q2 IT Equipment Physical Audit', ScopeType: 'department', ScopeTarget: 'd-1',
        startDate: formatDate(-5), endDate: formatDate(2), assignedAuditors: ['e-4'],
        items: {
          'a-1': { verified: true, condition: 'Good', notes: 'Held by Priya, verified via remote call.', status: 'Verified' },
          'a-2': { verified: true, condition: 'New', notes: 'Present in server rack.', status: 'Verified' },
          'a-7': { verified: false, condition: '', notes: 'Not found in inventory checkout logs.', status: 'Missing' }
        },
        status: 'Active', discrepancyReport: null
      }
    ];

    // 10. Seed Activity Logs
    const logs = [
      { id: 'l-1', timestamp: formatDateTime(-20, 14, 0), userId: 'e-2', userName: 'Sarah Connor', actionType: 'ALLOCATE', description: 'Allocated Fleet Car AF-0004 to Facilities Department.' },
      { id: 'l-2', timestamp: formatDateTime(-10, 9, 30), userId: 'e-2', userName: 'Sarah Connor', actionType: 'ALLOCATE', description: 'Allocated Macbook Pro AF-0001 to Priya Patel.' },
      { id: 'l-3', timestamp: formatDateTime(-5, 11, 15), userId: 'e-1', userName: 'Alice Smith', actionType: 'UPDATE_ROLE', description: 'Promoted Raj Kumar to auditor group in audit modules.' },
      { id: 'l-4', timestamp: formatDateTime(-4, 11, 0), userId: 'e-5', userName: 'Alex Chen', actionType: 'MAINTENANCE', description: 'Raised maintenance request for Sony Laser Projector AF-0006.' }
    ];

    // 11. Seed Notifications
    const notifications = [
      { id: 'n-1', userId: 'e-3', title: 'Asset Return Overdue', message: 'MacBook Pro 16" (AF-0001) was expected back on ' + formatDate(-3) + '. Please check-in or request extension.', type: 'danger', read: false, timestamp: formatDateTime(-3, 17, 0) },
      { id: 'n-2', userId: 'e-4', title: 'Resource Booking Confirmed', message: 'Boardroom Delta booked for today at 10:30.', type: 'success', read: false, timestamp: formatDateTime(0, 8, 0) },
      { id: 'n-3', userId: 'e-4', title: 'Audit Cycle Assigned', message: 'You have been assigned as an auditor for "Q2 IT Equipment Physical Audit".', type: 'info', read: false, timestamp: formatDateTime(-5, 9, 0) }
    ];

    // Write all arrays to localStorage
    this.set(TABLES.EMPLOYEES, employees);
    this.set(TABLES.DEPARTMENTS, departments);
    this.set(TABLES.CATEGORIES, categories);
    this.set(TABLES.ASSETS, assets);
    this.set(TABLES.ALLOCATIONS, allocations);
    this.set(TABLES.TRANSFERS, transfers);
    this.set(TABLES.BOOKINGS, bookings);
    this.set(TABLES.MAINTENANCE, maintenance);
    this.set(TABLES.AUDITS, audits);
    this.set(TABLES.LOGS, logs);
    this.set(TABLES.NOTIFICATIONS, notifications);
  }

  // --- CRUD API ---

  // Auth Operations
  validateLogin(email, password) {
    const employees = this.get(TABLES.EMPLOYEES);
    const user = employees.find(e => e.email.toLowerCase().trim() === email.toLowerCase().trim() && e.status === 'Active');
    
    if (user && user.password === password) { // Plaintext password match in local simulation
      return user;
    }
    return null;
  }

  signupEmployee(name, email, password, departmentId = 'd-1') {
    const employees = this.get(TABLES.EMPLOYEES);
    
    // Check if email exists
    if (employees.some(e => e.email.toLowerCase().trim() === email.toLowerCase().trim())) {
      throw new Error('Email is already registered.');
    }

    const newEmp = {
      id: 'e-' + (employees.length + 1) + '_' + Math.random().toString(36).substr(2, 4),
      name,
      email: email.toLowerCase().trim(),
      password,
      departmentId,
      role: 'Employee', // ALWAYS defaults to Employee on signup
      status: 'Active'
    };

    employees.push(newEmp);
    this.set(TABLES.EMPLOYEES, employees);
    this.addActivityLog(newEmp.id, newEmp.name, 'SIGNUP', `Registered a new employee account under ${newEmp.email}.`);
    
    return newEmp;
  }

  promoteEmployee(operatorId, employeeId, role) {
    const employees = this.get(TABLES.EMPLOYEES);
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) throw new Error('Employee not found.');
    
    const oldRole = employee.role;
    employee.role = role;
    this.set(TABLES.EMPLOYEES, employees);
    
    const operator = employees.find(e => e.id === operatorId) || { name: 'Admin' };
    this.addActivityLog(operatorId, operator.name, 'PROMOTE', `Promoted ${employee.name} from ${oldRole} to ${role}.`);
    
    // Send Notification to Employee
    this.addNotification(employeeId, 'Role Updated', `Your role has been updated to ${role} by Admin.`, 'info');
  }

  updateEmployeeStatus(operatorId, employeeId, status) {
    const employees = this.get(TABLES.EMPLOYEES);
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) throw new Error('Employee not found.');
    
    employee.status = status;
    this.set(TABLES.EMPLOYEES, employees);
    
    const operator = employees.find(e => e.id === operatorId) || { name: 'Admin' };
    this.addActivityLog(operatorId, operator.name, 'EMPLOYEE_STATUS', `Set ${employee.name} status to ${status}.`);
  }

  // Categories Operations
  createCategory(operatorId, name, customFields = []) {
    const categories = this.get(TABLES.CATEGORIES);
    const id = 'c-' + (categories.length + 1) + '_' + Math.random().toString(36).substr(2, 4);
    
    const newCategory = { id, name, fields: customFields };
    categories.push(newCategory);
    this.set(TABLES.CATEGORIES, categories);
    
    const employees = this.get(TABLES.EMPLOYEES);
    const operator = employees.find(e => e.id === operatorId) || { name: 'Admin' };
    this.addActivityLog(operatorId, operator.name, 'CREATE_CATEGORY', `Created asset category "${name}".`);
    return newCategory;
  }

  // Departments Operations
  createDepartment(operatorId, name, headId, parentId, status = 'Active') {
    const departments = this.get(TABLES.DEPARTMENTS);
    const id = 'd-' + (departments.length + 1) + '_' + Math.random().toString(36).substr(2, 4);
    
    const newDept = { id, name, headId, parentId: parentId || null, status };
    departments.push(newDept);
    this.set(TABLES.DEPARTMENTS, departments);
    
    const employees = this.get(TABLES.EMPLOYEES);
    const operator = employees.find(e => e.id === operatorId) || { name: 'Admin' };
    this.addActivityLog(operatorId, operator.name, 'CREATE_DEPT', `Created department "${name}".`);
    return newDept;
  }

  updateDepartment(operatorId, id, name, headId, parentId, status) {
    const departments = this.get(TABLES.DEPARTMENTS);
    const dept = departments.find(d => d.id === id);
    if (!dept) throw new Error('Department not found.');
    
    dept.name = name;
    dept.headId = headId;
    dept.parentId = parentId || null;
    dept.status = status;
    
    this.set(TABLES.DEPARTMENTS, departments);
    
    const employees = this.get(TABLES.EMPLOYEES);
    const operator = employees.find(e => e.id === operatorId) || { name: 'Admin' };
    this.addActivityLog(operatorId, operator.name, 'UPDATE_DEPT', `Updated department "${name}".`);
  }

  // Asset Operations
  registerAsset(operatorId, { name, categoryId, serialNumber, acquisitionDate, acquisitionCost, condition, location, shared, customValues }) {
    const assets = this.get(TABLES.ASSETS);
    
    // Auto-generate Asset Tag (AF-000X)
    const nextNum = assets.length + 1;
    const tag = 'AF-' + String(nextNum).padStart(4, '0');
    const id = 'a-' + nextNum + '_' + Math.random().toString(36).substr(2, 4);

    const employees = this.get(TABLES.EMPLOYEES);
    const operator = employees.find(e => e.id === operatorId) || { name: 'System' };
    
    const newAsset = {
      id,
      tag,
      name,
      categoryId,
      serialNumber,
      acquisitionDate,
      acquisitionCost: Number(acquisitionCost) || 0,
      condition,
      location,
      shared: shared === true || shared === 'true',
      status: 'Available', // Registers initially as Available
      customValues: customValues || {},
      history: [{
        date: new Date().toISOString(),
        type: 'Registration',
        user: operator.name,
        notes: `Registered asset via dashboard. Serial: ${serialNumber}`
      }]
    };

    assets.push(newAsset);
    this.set(TABLES.ASSETS, assets);
    
    this.addActivityLog(operatorId, operator.name, 'REGISTER_ASSET', `Registered asset ${tag} (${name}).`);
    return newAsset;
  }

  // Allocation & Conflict Resolution Engine
  allocateAsset(operatorId, { assetId, assigneeType, assigneeId, expectedReturnDate, notes }) {
    const assets = this.get(TABLES.ASSETS);
    const allocations = this.get(TABLES.ALLOCATIONS);
    const employees = this.get(TABLES.EMPLOYEES);
    const depts = this.get(TABLES.DEPARTMENTS);

    const asset = assets.find(a => a.id === assetId);
    if (!asset) throw new Error('Asset not found.');

    // 1. Conflict Prevention Rule: Prevent double-allocation
    if (asset.status !== 'Available') {
      let holderName = 'unknown';
      if (asset.status === 'Allocated') {
        const activeAlloc = allocations.find(al => al.assetId === assetId && al.status === 'Active');
        if (activeAlloc) {
          if (activeAlloc.assigneeType === 'employee') {
            const emp = employees.find(e => e.id === activeAlloc.assigneeId);
            holderName = emp ? emp.name : 'an employee';
          } else {
            const dp = depts.find(d => d.id === activeAlloc.assigneeId);
            holderName = dp ? `Department ${dp.name}` : 'a department';
          }
        }
      }
      throw new Error(`CONFLICT: Asset is currently ${asset.status}. Held by: ${holderName}. You must request a Transfer instead.`);
    }

    const operator = employees.find(e => e.id === operatorId) || { name: 'System' };
    const id = 'al-' + (allocations.length + 1) + '_' + Math.random().toString(36).substr(2, 4);

    const newAlloc = {
      id,
      assetId,
      assigneeType,
      assigneeId,
      allocatedDate: new Date().toISOString().split('T')[0],
      expectedReturnDate: expectedReturnDate || null,
      actualReturnDate: null,
      notes: notes || '',
      status: 'Active'
    };

    allocations.push(newAlloc);
    asset.status = 'Allocated';
    
    let assigneeName = '';
    if (assigneeType === 'employee') {
      const emp = employees.find(e => e.id === assigneeId);
      assigneeName = emp ? emp.name : '';
      if (emp) {
        this.addNotification(emp.id, 'Asset Allocated', `Asset ${asset.tag} (${asset.name}) has been allocated to you. Expected return: ${expectedReturnDate || 'N/A'}.`, 'info');
      }
    } else {
      const dp = depts.find(d => d.id === assigneeId);
      assigneeName = dp ? dp.name : '';
      // Notify dept head
      if (dp && dp.headId) {
        this.addNotification(dp.headId, 'Department Asset Allocated', `Asset ${asset.tag} (${asset.name}) allocated to Department: ${dp.name}.`, 'info');
      }
    }

    asset.history.push({
      date: new Date().toISOString(),
      type: 'Allocation',
      user: operator.name,
      notes: `Allocated to ${assigneeType} [${assigneeName}]. Expected Return: ${expectedReturnDate || 'Indefinite'}`
    });

    this.set(TABLES.ASSETS, assets);
    this.set(TABLES.ALLOCATIONS, allocations);
    
    this.addActivityLog(operatorId, operator.name, 'ALLOCATE', `Allocated ${asset.tag} to ${assigneeName}.`);
    return newAlloc;
  }

  // Transfer Request Workflow
  requestTransfer(operatorId, allocationId, notes) {
    const allocations = this.get(TABLES.ALLOCATIONS);
    const transfers = this.get(TABLES.TRANSFERS);
    const employees = this.get(TABLES.EMPLOYEES);

    const alloc = allocations.find(al => al.id === allocationId && al.status === 'Active');
    if (!alloc) throw new Error('Active allocation not found.');

    const operator = employees.find(e => e.id === operatorId);
    if (!operator) throw new Error('Requesting employee not found.');

    // Check if transfer request already exists for this allocation
    if (transfers.some(t => t.allocationId === allocationId && t.status === 'Pending')) {
      throw new Error('A transfer request is already pending for this asset.');
    }

    const transferId = 't-' + (transfers.length + 1) + '_' + Math.random().toString(36).substr(2, 4);
    
    // Check old holder ID
    const fromId = alloc.assigneeType === 'employee' ? alloc.assigneeId : null;

    const newTransfer = {
      id: transferId,
      allocationId,
      fromEmployeeId: fromId, // Can be null if it was allocated to department
      toEmployeeId: operatorId,
      requestDate: new Date().toISOString(),
      notes: notes || '',
      status: 'Pending'
    };

    transfers.push(newTransfer);
    alloc.status = 'Transfer Pending';

    this.set(TABLES.TRANSFERS, transfers);
    this.set(TABLES.ALLOCATIONS, allocations);

    // Notify Asset Managers + Dept Heads (approvers)
    const managers = employees.filter(e => e.role === 'Asset Manager' || e.role === 'Admin');
    managers.forEach(m => {
      this.addNotification(m.id, 'Transfer Requested', `${operator.name} has requested a transfer for asset allocation ${alloc.id}.`, 'warning');
    });

    this.addActivityLog(operatorId, operator.name, 'TRANSFER_REQUEST', `Requested transfer of allocation ${allocationId}.`);
    return newTransfer;
  }

  approveTransfer(operatorId, transferId) {
    const transfers = this.get(TABLES.TRANSFERS);
    const allocations = this.get(TABLES.ALLOCATIONS);
    const assets = this.get(TABLES.ASSETS);
    const employees = this.get(TABLES.EMPLOYEES);

    const transfer = transfers.find(t => t.id === transferId);
    if (!transfer) throw new Error('Transfer request not found.');
    if (transfer.status !== 'Pending') throw new Error('Transfer request already processed.');

    const alloc = allocations.find(al => al.id === transfer.allocationId);
    if (!alloc) throw new Error('Linked allocation not found.');

    const asset = assets.find(a => a.id === alloc.assetId);
    if (!asset) throw new Error('Linked asset not found.');

    const operator = employees.find(e => e.id === operatorId) || { name: 'Asset Manager' };
    const requester = employees.find(e => e.id === transfer.toEmployeeId);

    // 1. Close the old allocation
    alloc.actualReturnDate = new Date().toISOString().split('T')[0];
    alloc.status = 'Returned';
    alloc.notes += ` [Transferred to ${requester ? requester.name : 'Unknown'} on approval]`;

    // 2. Create the new allocation
    const newAllocId = 'al-' + (allocations.length + 1) + '_' + Math.random().toString(36).substr(2, 4);
    const newAlloc = {
      id: newAllocId,
      assetId: alloc.assetId,
      assigneeType: 'employee',
      assigneeId: transfer.toEmployeeId,
      allocatedDate: new Date().toISOString().split('T')[0],
      expectedReturnDate: null,
      actualReturnDate: null,
      notes: `Transferred allocation. Original Notes: ${alloc.notes}`,
      status: 'Active'
    };
    allocations.push(newAlloc);

    // 3. Update asset details
    asset.status = 'Allocated';
    asset.history.push({
      date: new Date().toISOString(),
      type: 'Transfer',
      user: operator.name,
      notes: `Approved transfer from ${transfer.fromEmployeeId ? employees.find(e => e.id === transfer.fromEmployeeId)?.name : 'Dept'} to ${requester?.name}.`
    });

    transfer.status = 'Approved';

    this.set(TABLES.TRANSFERS, transfers);
    this.set(TABLES.ALLOCATIONS, allocations);
    this.set(TABLES.ASSETS, assets);

    if (requester) {
      this.addNotification(requester.id, 'Transfer Approved', `Your transfer request for ${asset.tag} has been APPROVED.`, 'success');
    }
    if (transfer.fromEmployeeId) {
      this.addNotification(transfer.fromEmployeeId, 'Asset Transferred', `Your asset ${asset.tag} has been transferred to ${requester?.name}.`, 'info');
    }

    this.addActivityLog(operatorId, operator.name, 'TRANSFER_APPROVE', `Approved transfer of ${asset.tag} to ${requester ? requester.name : ''}.`);
  }

  rejectTransfer(operatorId, transferId) {
    const transfers = this.get(TABLES.TRANSFERS);
    const allocations = this.get(TABLES.ALLOCATIONS);
    const employees = this.get(TABLES.EMPLOYEES);

    const transfer = transfers.find(t => t.id === transferId);
    if (!transfer) throw new Error('Transfer request not found.');
    
    const alloc = allocations.find(al => al.id === transfer.allocationId);
    if (alloc && alloc.status === 'Transfer Pending') {
      alloc.status = 'Active';
    }

    transfer.status = 'Rejected';
    this.set(TABLES.TRANSFERS, transfers);
    this.set(TABLES.ALLOCATIONS, allocations);

    const operator = employees.find(e => e.id === operatorId) || { name: 'Asset Manager' };
    const requester = employees.find(e => e.id === transfer.toEmployeeId);

    if (requester) {
      this.addNotification(requester.id, 'Transfer Rejected', `Your transfer request has been rejected.`, 'danger');
    }

    this.addActivityLog(operatorId, operator.name, 'TRANSFER_REJECT', `Rejected transfer request ${transferId}.`);
  }

  // Return Flow
  returnAsset(operatorId, allocationId, checkInNotes, condition) {
    const allocations = this.get(TABLES.ALLOCATIONS);
    const assets = this.get(TABLES.ASSETS);
    const employees = this.get(TABLES.EMPLOYEES);

    const alloc = allocations.find(al => al.id === allocationId);
    if (!alloc) throw new Error('Allocation record not found.');
    if (alloc.status === 'Returned') throw new Error('Asset has already been returned.');

    const asset = assets.find(a => a.id === alloc.assetId);
    if (!asset) throw new Error('Asset details not found.');

    const operator = employees.find(e => e.id === operatorId) || { name: 'Manager' };

    // Update allocation
    alloc.actualReturnDate = new Date().toISOString().split('T')[0];
    alloc.status = 'Returned';
    alloc.notes += ` | Return check-in notes: ${checkInNotes}`;

    // Revert Asset to Available
    asset.status = 'Available';
    if (condition) {
      asset.condition = condition; // Update physical condition
    }

    asset.history.push({
      date: new Date().toISOString(),
      type: 'Return Check-in',
      user: operator.name,
      notes: `Returned check-in. Condition: ${condition || 'Unchanged'}. Notes: ${checkInNotes}`
    });

    this.set(TABLES.ALLOCATIONS, allocations);
    this.set(TABLES.ASSETS, assets);

    // Notify assignee
    if (alloc.assigneeType === 'employee') {
      this.addNotification(alloc.assigneeId, 'Asset Returned Successfully', `Check-in for asset ${asset.tag} was processed.`, 'success');
    }

    this.addActivityLog(operatorId, operator.name, 'RETURN_ASSET', `Processed check-in return of asset ${asset.tag}.`);
  }

  // --- Resource Booking Slot Validation & Overlaps ---

  hasBookingOverlap(assetId, date, startTime, endTime, skipBookingId = null) {
    const bookings = this.get(TABLES.BOOKINGS);
    
    // Simple helper to convert HH:MM to minutes from midnight
    const toMins = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const newStartMins = toMins(startTime);
    const newEndMins = toMins(endTime);

    if (newStartMins >= newEndMins) {
      throw new Error('Start time must be before end time.');
    }

    // Filter relevant day & resource active bookings
    const activeBookings = bookings.filter(b => 
      b.resourceId === assetId && 
      b.date === date && 
      b.status !== 'Cancelled' &&
      b.id !== skipBookingId
    );

    for (const b of activeBookings) {
      const bStartMins = toMins(b.startTime);
      const bEndMins = toMins(b.endTime);

      // Overlap calculation: (StartA < EndB) AND (EndA > StartB)
      if (newStartMins < bEndMins && newEndMins > bStartMins) {
        return b; // Returns the overlapping booking object
      }
    }

    return null;
  }

  bookResource(operatorId, { resourceId, date, startTime, endTime }) {
    const assets = this.get(TABLES.ASSETS);
    const bookings = this.get(TABLES.BOOKINGS);
    const employees = this.get(TABLES.EMPLOYEES);

    const asset = assets.find(a => a.id === resourceId);
    if (!asset) throw new Error('Resource not found.');
    if (!asset.shared) throw new Error('Asset is not marked as shared/bookable.');
    if (asset.status === 'Retired' || asset.status === 'Disposed') {
      throw new Error('Resource has been retired or disposed.');
    }

    // Overlap validation
    const overlap = this.hasBookingOverlap(resourceId, date, startTime, endTime);
    if (overlap) {
      const user = employees.find(e => e.id === overlap.bookedById);
      throw new Error(`CONFLICT: Time slot overlaps with booking by ${user ? user.name : 'another employee'} (${overlap.startTime} - ${overlap.endTime}).`);
    }

    const operator = employees.find(e => e.id === operatorId) || { name: 'User' };
    const id = 'b-' + (bookings.length + 1) + '_' + Math.random().toString(36).substr(2, 4);

    const newBooking = {
      id,
      resourceId,
      bookedById: operatorId,
      date,
      startTime,
      endTime,
      status: 'Upcoming' // Default state
    };

    bookings.push(newBooking);
    this.set(TABLES.BOOKINGS, bookings);

    // Notify employee
    this.addNotification(operatorId, 'Booking Confirmed', `Reserved ${asset.name} on ${date} from ${startTime} to ${endTime}.`, 'success');
    
    // Add history entry to asset
    asset.history.push({
      date: new Date().toISOString(),
      type: 'Booking Reserved',
      user: operator.name,
      notes: `Booked slot: ${date} [${startTime} - ${endTime}]`
    });
    this.set(TABLES.ASSETS, assets);

    this.addActivityLog(operatorId, operator.name, 'BOOKING_CREATE', `Booked resource ${asset.tag} for ${date} (${startTime}-${endTime}).`);
    return newBooking;
  }

  cancelBooking(operatorId, bookingId) {
    const bookings = this.get(TABLES.BOOKINGS);
    const assets = this.get(TABLES.ASSETS);
    const employees = this.get(TABLES.EMPLOYEES);

    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) throw new Error('Booking not found.');
    if (booking.status === 'Cancelled') throw new Error('Booking is already cancelled.');

    const operator = employees.find(e => e.id === operatorId) || { name: 'User' };
    booking.status = 'Cancelled';
    this.set(TABLES.BOOKINGS, bookings);

    const asset = assets.find(a => a.id === booking.resourceId);
    if (asset) {
      asset.history.push({
        date: new Date().toISOString(),
        type: 'Booking Cancelled',
        user: operator.name,
        notes: `Cancelled slot: ${booking.date} [${booking.startTime} - ${booking.endTime}]`
      });
      this.set(TABLES.ASSETS, assets);
    }

    this.addNotification(booking.bookedById, 'Booking Cancelled', `Your reservation for ${asset ? asset.name : 'resource'} on ${booking.date} has been cancelled.`, 'warning');
    this.addActivityLog(operatorId, operator.name, 'BOOKING_CANCEL', `Cancelled booking ${bookingId}.`);
  }

  // --- Maintenance Workflows ---

  raiseMaintenanceRequest(operatorId, assetId, description, priority) {
    const assets = this.get(TABLES.ASSETS);
    const maintenance = this.get(TABLES.MAINTENANCE);
    const employees = this.get(TABLES.EMPLOYEES);

    const asset = assets.find(a => a.id === assetId);
    if (!asset) throw new Error('Asset not found.');

    const operator = employees.find(e => e.id === operatorId) || { name: 'User' };
    const id = 'm-' + (maintenance.length + 1) + '_' + Math.random().toString(36).substr(2, 4);

    const request = {
      id,
      assetId,
      reportedById: operatorId,
      description,
      priority,
      status: 'Pending', // Initial status
      technicianName: '',
      resolutionNotes: '',
      createdDate: new Date().toISOString()
    };

    maintenance.push(request);
    this.set(TABLES.MAINTENANCE, maintenance);

    // Notify Asset Managers
    const managers = employees.filter(e => e.role === 'Asset Manager' || e.role === 'Admin');
    managers.forEach(m => {
      this.addNotification(m.id, 'Repair Request Raised', `${operator.name} raised a ${priority} repair request for ${asset.tag}.`, 'warning');
    });

    this.addActivityLog(operatorId, operator.name, 'MAINTENANCE_RAISE', `Raised maintenance for ${asset.tag} (${priority}).`);
    return request;
  }

  updateMaintenanceStatus(operatorId, requestId, status, technicianName = '', resolutionNotes = '') {
    const maintenance = this.get(TABLES.MAINTENANCE);
    const assets = this.get(TABLES.ASSETS);
    const employees = this.get(TABLES.EMPLOYEES);

    const req = maintenance.find(m => m.id === requestId);
    if (!req) throw new Error('Maintenance request not found.');

    const asset = assets.find(a => a.id === req.assetId);
    if (!asset) throw new Error('Linked asset not found.');

    const operator = employees.find(e => e.id === operatorId) || { name: 'Manager' };

    req.status = status;
    if (technicianName) req.technicianName = technicianName;
    if (resolutionNotes) req.resolutionNotes = resolutionNotes;

    // Side-effects on Asset Status
    if (status === 'Approved') {
      asset.status = 'Under Maintenance';
      asset.history.push({
        date: new Date().toISOString(),
        type: 'Maintenance Approved',
        user: operator.name,
        notes: `Repair work approved. Transitioned status to Under Maintenance.`
      });
    } else if (status === 'Resolved') {
      asset.status = 'Available'; // Restores to Available on repair resolution
      asset.history.push({
        date: new Date().toISOString(),
        type: 'Maintenance Resolved',
        user: operator.name,
        notes: `Repair resolved. Tech: ${req.technicianName}. Notes: ${resolutionNotes}`
      });
      // Notify reporter
      this.addNotification(req.reportedById, 'Maintenance Resolved', `Your reported issue for ${asset.tag} has been marked RESOLVED.`, 'success');
    } else if (status === 'Rejected') {
      asset.history.push({
        date: new Date().toISOString(),
        type: 'Maintenance Rejected',
        user: operator.name,
        notes: `Repair request rejected. Notes: ${resolutionNotes}`
      });
      // Notify reporter
      this.addNotification(req.reportedById, 'Maintenance Rejected', `Your repair request for ${asset.tag} was rejected.`, 'danger');
    }

    this.set(TABLES.MAINTENANCE, maintenance);
    this.set(TABLES.ASSETS, assets);

    this.addActivityLog(operatorId, operator.name, 'MAINTENANCE_UPDATE', `Updated request ${requestId} status to ${status}.`);
  }

  // --- Audits & Locked Cycle Management ---

  createAuditCycle(operatorId, title, scopeType, scopeTarget, startDate, endDate, auditorIds) {
    const audits = this.get(TABLES.AUDITS);
    const assets = this.get(TABLES.ASSETS);
    const employees = this.get(TABLES.EMPLOYEES);

    const operator = employees.find(e => e.id === operatorId) || { name: 'Admin' };
    const id = 'aud-' + (audits.length + 1) + '_' + Math.random().toString(36).substr(2, 4);

    // Collect list of assets falling under target scope (departmentId or location)
    let filteredAssets = [];
    if (scopeType === 'department') {
      // Find all assets allocated to that department OR allocated to employees of that department
      const allocations = this.get(TABLES.ALLOCATIONS).filter(al => al.status === 'Active');
      const deptEmployees = employees.filter(e => e.departmentId === scopeTarget).map(e => e.id);
      
      filteredAssets = assets.filter(a => {
        const alloc = allocations.find(al => al.assetId === a.id);
        if (!alloc) return false;
        if (alloc.assigneeType === 'department' && alloc.assigneeId === scopeTarget) return true;
        if (alloc.assigneeType === 'employee' && deptEmployees.includes(alloc.assigneeId)) return true;
        return false;
      });
    } else {
      // Filter by location substring
      filteredAssets = assets.filter(a => a.location.toLowerCase().includes(scopeTarget.toLowerCase()));
    }

    // Initialize audit items map
    const items = {};
    filteredAssets.forEach(a => {
      items[a.id] = { verified: false, condition: '', notes: '', status: 'Pending' };
    });

    const newAudit = {
      id,
      title,
      ScopeType: scopeType,
      ScopeTarget: scopeTarget,
      startDate,
      endDate,
      assignedAuditors: auditorIds || [],
      items,
      status: 'Active',
      discrepancyReport: null
    };

    audits.push(newAudit);
    this.set(TABLES.AUDITS, audits);

    // Notify assigned auditors
    auditorIds.forEach(audId => {
      this.addNotification(audId, 'New Audit Cycle Assigned', `You have been assigned to audit: "${title}".`, 'info');
    });

    this.addActivityLog(operatorId, operator.name, 'AUDIT_CREATE', `Created audit cycle ${id} (${title}).`);
    return newAudit;
  }

  verifyAuditItem(operatorId, cycleId, assetId, { verifiedStatus, condition, notes }) {
    const audits = this.get(TABLES.AUDITS);
    const employees = this.get(TABLES.EMPLOYEES);

    const audit = audits.find(au => au.id === cycleId);
    if (!audit) throw new Error('Audit cycle not found.');
    if (audit.status !== 'Active') throw new Error('Audit cycle is locked.');

    const operator = employees.find(e => e.id === operatorId) || { name: 'Auditor' };

    audit.items[assetId] = {
      verified: verifiedStatus === 'Verified',
      condition,
      notes,
      status: verifiedStatus // 'Verified', 'Missing', or 'Damaged'
    };

    this.set(TABLES.AUDITS, audits);
  }

  closeAuditCycle(operatorId, cycleId) {
    const audits = this.get(TABLES.AUDITS);
    const assets = this.get(TABLES.ASSETS);
    const employees = this.get(TABLES.EMPLOYEES);

    const audit = audits.find(au => au.id === cycleId);
    if (!audit) throw new Error('Audit cycle not found.');
    if (audit.status !== 'Active') throw new Error('Audit cycle is already closed.');

    const operator = employees.find(e => e.id === operatorId) || { name: 'Admin' };

    // 1. Lock the cycle
    audit.status = 'Closed';

    // 2. Process side-effects and discrepancy log
    const discrepancies = {
      missing: [],
      damaged: [],
      verified: []
    };

    Object.keys(audit.items).forEach(assetId => {
      const item = audit.items[assetId];
      const asset = assets.find(a => a.id === assetId);

      if (asset) {
        if (item.status === 'Missing') {
          discrepancies.missing.push({ assetId, tag: asset.tag, name: asset.name, notes: item.notes });
          
          // CRITICAL SIDE EFFECT: Mark confirmed missing assets as Lost
          asset.status = 'Lost';
          asset.history.push({
            date: new Date().toISOString(),
            type: 'Audit Check-in',
            user: operator.name,
            notes: `Confirmed MISSING during audit "${audit.title}". Status set to Lost.`
          });
        } 
        else if (item.status === 'Damaged') {
          discrepancies.damaged.push({ assetId, tag: asset.tag, name: asset.name, notes: item.notes, condition: item.condition });
          
          // CRITICAL SIDE EFFECT: Mark damaged assets as Under Maintenance or update condition
          asset.condition = item.condition || 'Poor';
          asset.history.push({
            date: new Date().toISOString(),
            type: 'Audit Check-in',
            user: operator.name,
            notes: `Marked DAMAGED during audit "${audit.title}". Condition set to: ${asset.condition}.`
          });
        } 
        else {
          discrepancies.verified.push({ assetId, tag: asset.tag, name: asset.name });
          asset.history.push({
            date: new Date().toISOString(),
            type: 'Audit Check-in',
            user: operator.name,
            notes: `Verified present and operational in audit "${audit.title}".`
          });
        }
      }
    });

    audit.discrepancyReport = discrepancies;

    this.set(TABLES.AUDITS, audits);
    this.set(TABLES.ASSETS, assets);

    // Notify managers
    const managers = employees.filter(e => e.role === 'Asset Manager' || e.role === 'Admin');
    managers.forEach(m => {
      this.addNotification(
        m.id, 
        'Audit Cycle Closed', 
        `"${audit.title}" closed. Missing: ${discrepancies.missing.length}, Damaged: ${discrepancies.damaged.length}.`, 
        discrepancies.missing.length > 0 ? 'danger' : 'info'
      );
    });

    this.addActivityLog(operatorId, operator.name, 'AUDIT_CLOSE', `Closed and locked audit cycle ${cycleId}. Discrepancy report compiled.`);
  }

  // --- Utility Logging & Notification Operations ---

  addActivityLog(userId, userName, actionType, description) {
    const logs = this.get(TABLES.LOGS);
    const id = 'l-' + (logs.length + 1) + '_' + Math.random().toString(36).substr(2, 4);

    const logEntry = {
      id,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      actionType,
      description
    };

    logs.unshift(logEntry); // Add to top
    this.set(TABLES.LOGS, logs.slice(0, 200)); // Cap logs at 200 items
  }

  addNotification(userId, title, message, type = 'info') {
    const notifications = this.get(TABLES.NOTIFICATIONS);
    const id = 'n-' + (notifications.length + 1) + '_' + Math.random().toString(36).substr(2, 4);

    const notif = {
      id,
      userId,
      title,
      message,
      type,
      read: false,
      timestamp: new Date().toISOString()
    };

    notifications.unshift(notif);
    this.set(TABLES.NOTIFICATIONS, notifications);
  }

  markNotificationRead(notificationId) {
    const notifications = this.get(TABLES.NOTIFICATIONS);
    const notif = notifications.find(n => n.id === notificationId);
    if (notif) {
      notif.read = true;
      this.set(TABLES.NOTIFICATIONS, notifications);
    }
  }

  markAllNotificationsRead(userId) {
    const notifications = this.get(TABLES.NOTIFICATIONS);
    notifications.forEach(n => {
      if (n.userId === userId) n.read = true;
    });
    this.set(TABLES.NOTIFICATIONS, notifications);
  }

  // --- System Diagnostic Evaluator Engine (Hackathon Special) ---
  runDiagnostics() {
    const logs = [];
    const log = (msg, type = 'info') => logs.push({ msg, type });
    let passed = true;

    log('Booting diagnostic test engine...', 'info');

    try {
      // Test 1: Double Allocation Check
      log('Running Test 1: Double Allocation Rejection...', 'info');
      
      const assets = this.get(TABLES.ASSETS);
      const employees = this.get(TABLES.EMPLOYEES);

      // Find an available asset or register one
      let testAsset = assets.find(a => a.status === 'Available');
      if (!testAsset) {
        testAsset = this.registerAsset('e-1', {
          name: 'Diagnostic Laptop',
          categoryId: 'c-1',
          serialNumber: 'DIAG-999',
          acquisitionDate: new Date().toISOString().split('T')[0],
          acquisitionCost: 1000,
          condition: 'New',
          location: 'Lab',
          shared: false
        });
      }

      const emp1 = employees[0];
      const emp2 = employees[1];

      // Allocate once
      this.allocateAsset('e-1', {
        assetId: testAsset.id,
        assigneeType: 'employee',
        assigneeId: emp1.id,
        expectedReturnDate: new Date().toISOString().split('T')[0]
      });

      // Try allocating again -> should fail
      try {
        this.allocateAsset('e-1', {
          assetId: testAsset.id,
          assigneeType: 'employee',
          assigneeId: emp2.id
        });
        log('FAILED: Managed to double-allocate asset.', 'err');
        passed = false;
      } catch (err) {
        log('PASSED: Correctly blocked double-allocation with error: ' + err.message, 'ok');
      }

      // Cleanup: return asset
      const allocations = this.get(TABLES.ALLOCATIONS);
      const activeAlloc = allocations.find(al => al.assetId === testAsset.id && al.status === 'Active');
      if (activeAlloc) {
        this.returnAsset('e-1', activeAlloc.id, 'Diagnostic return', 'Good');
      }

      // Test 2: Booking Overlap Check
      log('Running Test 2: Resource Time Slot Overlap Validation...', 'info');
      let bookableResource = assets.find(a => a.shared && a.status === 'Available');
      
      if (!bookableResource) {
        bookableResource = this.registerAsset('e-1', {
          name: 'Diagnostic Room',
          categoryId: 'c-4',
          serialNumber: 'DIAG-RM',
          acquisitionDate: new Date().toISOString().split('T')[0],
          acquisitionCost: 0,
          condition: 'Good',
          location: 'Lab',
          shared: true
        });
      }

      const testDate = new Date().toISOString().split('T')[0];

      // Book 10:00 to 11:30
      this.bookResource('e-1', {
        resourceId: bookableResource.id,
        date: testDate,
        startTime: '10:00',
        endTime: '11:30'
      });

      // Test overlap 11:00 to 12:00 -> should fail
      try {
        this.bookResource('e-2', {
          resourceId: bookableResource.id,
          date: testDate,
          startTime: '11:00',
          endTime: '12:00'
        });
        log('FAILED: Overlapping booking was accepted.', 'err');
        passed = false;
      } catch (err) {
        log('PASSED: Correctly blocked overlapping booking (11:00-12:00) with error: ' + err.message, 'ok');
      }

      // Test adjacent booking 11:30 to 12:30 -> should succeed
      try {
        this.bookResource('e-2', {
          resourceId: bookableResource.id,
          date: testDate,
          startTime: '11:30',
          endTime: '12:30'
        });
        log('PASSED: Allowed adjacent booking starting exactly when previous ended (11:30).', 'ok');
      } catch (err) {
        log('FAILED: Adjacent booking was rejected: ' + err.message, 'err');
        passed = false;
      }

      // Cleanup bookings
      const bookings = this.get(TABLES.BOOKINGS);
      const filteredBookings = bookings.filter(b => b.resourceId !== bookableResource.id);
      this.set(TABLES.BOOKINGS, filteredBookings);

    } catch (e) {
      log('DIAGNOSTICS EXCEPTION: ' + e.message, 'err');
      passed = false;
    }

    if (passed) {
      log('ALL DIAGNOSTIC CHECKS COMPLETED: SUCCESS', 'ok');
    } else {
      log('DIAGNOSTIC CHECKS FAILED - Check validation logs.', 'err');
    }

    return { passed, logs };
  }

  // --- Real-time Dashboard KPI and Overdue Metrics Calculator ---
  getSystemStats() {
    const assets = this.get(TABLES.ASSETS);
    const allocations = this.get(TABLES.ALLOCATIONS);
    const bookings = this.get(TABLES.BOOKINGS);
    const maintenance = this.get(TABLES.MAINTENANCE);
    const employees = this.get(TABLES.EMPLOYEES);

    const todayStr = new Date().toISOString().split('T')[0];

    // Basic Counts
    const available = assets.filter(a => a.status === 'Available').length;
    const allocated = assets.filter(a => a.status === 'Allocated').length;
    const underMaintenance = assets.filter(a => a.status === 'Under Maintenance').length;
    const activeBookings = bookings.filter(b => b.status === 'Upcoming' || b.status === 'Ongoing').length;
    
    // Transfers pending
    const transfers = this.get(TABLES.TRANSFERS);
    const pendingTransfers = transfers.filter(t => t.status === 'Pending').length;

    // Maintenance today
    const maintenanceToday = maintenance.filter(m => m.status === 'In Progress' || m.status === 'Pending').length;

    // Compile Overdue Return list
    const overdueAllocations = [];
    const upcomingReturns = [];

    const activeAllocs = allocations.filter(al => al.status === 'Active');
    
    activeAllocs.forEach(al => {
      const asset = assets.find(a => a.id === al.assetId);
      if (asset && al.expectedReturnDate) {
        const expected = new Date(al.expectedReturnDate);
        const today = new Date(todayStr);
        
        let holderName = 'Unknown';
        if (al.assigneeType === 'employee') {
          holderName = employees.find(e => e.id === al.assigneeId)?.name || 'Employee';
        } else {
          holderName = this.get(TABLES.DEPARTMENTS).find(d => d.id === al.assigneeId)?.name + ' Dept' || 'Dept';
        }

        const allocInfo = {
          allocationId: al.id,
          assetTag: asset.tag,
          assetName: asset.name,
          holderName,
          allocatedDate: al.allocatedDate,
          expectedReturnDate: al.expectedReturnDate,
          notes: al.notes
        };

        if (expected < today) {
          overdueAllocations.push(allocInfo);
        } else {
          upcomingReturns.push(allocInfo);
        }
      }
    });

    return {
      kpis: {
        available,
        allocated,
        maintenanceToday,
        activeBookings,
        pendingTransfers,
        overdueCount: overdueAllocations.length
      },
      overdueAllocations,
      upcomingReturns
    };
  }
}

export const db = new LocalDB();
window.AssetFlowDB = db; // Attach to window for debug console inspection
