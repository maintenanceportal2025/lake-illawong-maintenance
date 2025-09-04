/**
 * =====================================================================
 * ResidentSubmissionForm V1.0
 * =====================================================================
 * Version reet 
 * 
 * STATUS: ✅ COMPLETE FIXED VERSION - All V1.5 functionality + Fixed Admin extensions
 * FIXES: Type/Value based deletion, Enhanced error handling, Automatic sorting
 * 
 * 
 * ✅ Dual lookup system (Unit Primary + Reporter data)
 * ✅ Automatic email notifications (residents + maintenance team)
 * ✅ Dynamic dropdowns from Categories tab
 * ✅ Fault submission with PID generation
 * 
 * ✅ getAdminDropdownData - Returns formatted Categories tab data
 * ✅ addDropdownItem - Adds new dropdown item with sorting
 * ✅ updateDropdownItem - Updates existing dropdown item  
 * ✅ deleteDropdownItem - FIXED: Removes by type/value match
 * 
 * 
 * =====================================================================
 */

// Sheet ID - UNCHANGED
const HOLDEN_SHEET_ID = '14u4Hl3Uluvk45ABIcgKGltX8EpBdGj1JvF_kEtZwmEE';

/**
 * WEB APP ENTRY POINT - EXTENDED WITH ADMIN ACTIONS
 */
function doGet(e) {
  try {
    console.log('🌐 HOLDEN RESIDENT SUBMISSION V1.6 COMPLETE REQUEST');
    console.log('Raw parameters:', JSON.stringify(e.parameter));
    
    // Extract form data
    const unitNumber = e.parameter.unitNumber;
    const reportedBy = e.parameter.reportedBy;
    const problemDescription = e.parameter.problemDescription;
    const action = e.parameter.action;
    const callback = e.parameter.callback;
    
    console.log('Extracted values:');
    console.log('  unitNumber:', unitNumber, '(type:', typeof unitNumber, ')');
    console.log('  reportedBy:', reportedBy);
    console.log('  action:', action);
    
    let result;
    
    // Route to appropriate function based on action
    if (action === 'submitFault') {
      console.log('\n📝 PROCESSING FAULT SUBMISSION');
      
      // Step 1: Dual lookup system (V1.5 - UNCHANGED)
      console.log('\n🔍 STEP 1: Unit lookup (Fixed V1.5)');
      const unitData = performTwoLookups(unitNumber, reportedBy);
      
      // Step 2: Create record
      console.log('\n📋 STEP 2: Create record');
      const record = createRecord(unitNumber, reportedBy, problemDescription, unitData);
      
      // Step 3: Write to sheet
      console.log('\n💾 STEP 3: Write to FaultLog');
      const success = writeToFaultLog(record);
      
      result = {
        success: success,
        message: success ? 'Submitted successfully' : 'Failed to submit',
        internalId: record.internalId,
        friendlyPID: getFriendlyPID(record.internalId)
      };
      
    } else if (action === 'getDropdownOptions') {
      console.log('\n📋 LOADING DROPDOWN OPTIONS');
      result = getDropdownOptions();
      
    // 🆕 FIXED V1.6 ADMIN ENDPOINTS
    } else if (action === 'getAdminDropdownData') {
      console.log('\n👑 ADMIN: Loading editable Categories tab data...');
      result = getAdminDropdownData();
      
    } else if (action === 'addDropdownItem') {
      console.log('\n👑 ADMIN: Adding Categories tab item...');
      result = addDropdownItem(e.parameter);
      
    } else if (action === 'updateDropdownItem') {
      console.log('\n👑 ADMIN: Updating Categories tab item...');
      result = updateDropdownItem(e.parameter);
      
    } else if (action === 'deleteDropdownItem') {
      console.log('\n👑 ADMIN: Deleting Categories tab item...');
      result = deleteDropdownItem(e.parameter);
      
    } else {
      console.log('❌ Invalid action:', action);
      result = { success: false, message: 'Invalid action' };
    }
    
    console.log('📤 RESPONSE:', result);
    
    // Handle JSONP callback
    if (callback) {
      return ContentService.createTextOutput(`${callback}(${JSON.stringify(result)})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('💥 FATAL ERROR:', error);
    
    const errorResponse = { success: false, error: error.toString() };
    const callback = e.parameter.callback;
    
    if (callback) {
      return ContentService.createTextOutput(`${callback}(${JSON.stringify(errorResponse)})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * =====================================================================
 * ✅ ALL V1.5 FUNCTIONS PRESERVED - DUAL LOOKUP + EMAIL SYSTEM
 * =====================================================================
 */

/**
 * FIXED LOOKUP FUNCTION - V1.5 DUAL LOOKUP SYSTEM (UNCHANGED)
 */
function performTwoLookups(unitNumber, reportedBy) {
  console.log('🔍 performTwoLookups called with (V1.5 Fixed Version):');
  console.log('  unitNumber:', unitNumber, '(type:', typeof unitNumber, ')');
  console.log('  reportedBy:', reportedBy);
  
  try {
    const sheet = SpreadsheetApp.openById(HOLDEN_SHEET_ID);
    const unitListSheet = sheet.getSheetByName('UnitList');
    
    if (!unitListSheet) {
      console.log('❌ UnitList sheet not found');
      return getDefaultData();
    }
    
    const data = unitListSheet.getDataRange().getValues();
    console.log('📊 UnitList rows:', data.length);
    console.log('📋 Headers:', data[0]);
    
    // LOOKUP 1: Find Unit Primary data by Unit Number
    let unitPrimaryData = null;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowUnitNumber = row[0];
      
      console.log(`  Row ${i}: Comparing "${rowUnitNumber}" with "${unitNumber}"`);
      
      if (rowUnitNumber === unitNumber) {
        console.log('✅ UNIT PRIMARY MATCH FOUND at row', i);
        unitPrimaryData = {
          zone: row[4] || 'Zone 1',          // E - Zone
          unitPrimaryName: row[6] || '',     // G - Unit Primary Name
          unitPrimaryEmail: row[7] || '',    // H - Unit Primary Email
          unitPrimaryPhone: row[8] || ''     // I - Unit Primary Phone
        };
        console.log('📊 Unit Primary data:', unitPrimaryData);
        break;
      }
    }
    
    // LOOKUP 2: Find Reporter data by Reporter Name
    let reporterData = null;
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const unitPrimaryName = row[6] || '';  // G - Unit Primary Name
      
      if (unitPrimaryName === reportedBy) {
        console.log('✅ REPORTER MATCH FOUND at row', i);
        reporterData = {
          reportedEmail: row[7] || '',     // H - Email
          reporterPhone: row[8] || ''      // I - Phone  
        };
        console.log('📊 Reporter data:', reporterData);
        break;
      }
    }
    
    // Combine results in V1.5 format
    const result = {
      zone: unitPrimaryData?.zone || 'Zone 1',
      reportedEmail: reporterData?.reportedEmail || '',
      unitPrimaryName: unitPrimaryData?.unitPrimaryName || '',
      unitPrimaryEmail: unitPrimaryData?.unitPrimaryEmail || '',
      unitPrimaryPhone: unitPrimaryData?.unitPrimaryPhone || '',
      reporterPhone: reporterData?.reporterPhone || ''
    };
    
    console.log('🔍 V1.5 lookup result:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error in performTwoLookups:', error);
    return getDefaultData();
  }
}

/**
 * GET DROPDOWN OPTIONS FROM DROPDOWNS TAB - FIXED: Filter out #REF entries
 * CHANGE: Added #REF filtering to prevent form dropdown errors
 */
function getDropdownOptions() {
  console.log('📋 Loading dropdown options from Dropdowns tab...');
  
  try {
    const sheet = SpreadsheetApp.openById(HOLDEN_SHEET_ID);
    const categoriesSheet = sheet.getSheetByName('Dropdowns');
    
    if (!categoriesSheet) {
      console.log('⚠️ Dropdowns sheet not found, using defaults');
      return getDefaultDropdownOptions();
    }
    
    const data = categoriesSheet.getDataRange().getValues();
    console.log('📊 Dropdowns rows:', data.length);
    
    if (data.length < 2) {
      console.log('⚠️ Dropdowns sheet is empty, using defaults');
      return getDefaultDropdownOptions();
    }
    
    const unitNumbers = [];
    const reportedByNames = [];
    
    // Process each row (skip header row) - ENHANCED: Filter #REF entries
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const type = row[0] ? row[0].toString().trim() : '';
      const value = row[1] ? row[1].toString().trim() : '';
      
      // ✅ ENHANCED FILTERING: Skip empty, #REF, and invalid entries
      if (!type || !value || value === '#REF' || type === '#REF') {
        console.log(`🚫 Skipping invalid entry: Type="${type}", Value="${value}"`);
        continue;
      }
      
      console.log(`🔍 Processing: Type="${type}", Value="${value}"`);
      
      if (type === 'Unit Number') {
        unitNumbers.push(value);
      } else if (type === 'Reported By') {
        reportedByNames.push(value);
      }
    }
    
    console.log('✅ Dropdown data processed (filtered):', {
      unitNumbers: unitNumbers.length,
      reportedByNames: reportedByNames.length
    });
    
    return {
      success: true,
      unitNumbers: unitNumbers,
      reportedBy: reportedByNames
    };
    
  } catch (error) {
    console.error('❌ Error loading dropdown options:', error);
    return getDefaultDropdownOptions();
  }
}

/**
 * DEFAULT DATA WHEN LOOKUP FAILS - V1.5 (UNCHANGED)
 */
function getDefaultData() {
  return {
    zone: 'Zone 1',
    reportedEmail: '',
    unitPrimaryName: '',
    unitPrimaryEmail: '',
    unitPrimaryPhone: '',
    reporterPhone: ''
  };
}

/**
 * CREATE FAULT RECORD - V1.5 (UNCHANGED)
 */
function createRecord(unitNumber, reportedBy, problemDescription, unitData) {
  const now = new Date();
  const internalId = generateInternalId();
  
  const record = {
    timestamp: now,
    unitNumber: unitNumber,
    reportedBy: reportedBy,
    reporterEmail: unitData.reportedEmail,           // D - From Reporter lookup
    problemDescription: problemDescription,
    zone: unitData.zone,
    unitPrimaryName: unitData.unitPrimaryName,       // G - From Unit Primary lookup
    unitPrimaryEmail: unitData.unitPrimaryEmail,     // H - From Unit Primary lookup
    unitPrimaryPhone: unitData.unitPrimaryPhone,     // I - From Unit Primary lookup
    internalId: internalId,
    problemStatus: 'Reported',
    problemPriority: 'Medium',
    comments: '',
    category: 'General',
    subCategory: '',
    assignedTo: '',
    completionDate: '',
    lastUpdated: now,
    reporterPhone: unitData.reporterPhone            // S - From Reporter lookup
  };
  
  console.log('📋 Created record with V1.5 lookup data:');
  console.log('  D (Reporter Email):', record.reporterEmail);
  console.log('  G (Unit Primary Name):', record.unitPrimaryName);
  console.log('  H (Unit Primary Email):', record.unitPrimaryEmail);
  console.log('  I (Unit Primary Phone):', record.unitPrimaryPhone);
  console.log('  S (Reporter Phone):', record.reporterPhone);
  
  return record;
}

/**
 * WRITE TO FAULTLOG SHEET - V1.5 WITH EMAIL NOTIFICATIONS (UNCHANGED)
 */
function writeToFaultLog(record) {
  try {
    const sheet = SpreadsheetApp.openById(HOLDEN_SHEET_ID);
    const faultLogSheet = sheet.getSheetByName('FaultLog');
    
    if (!faultLogSheet) {
      console.log('❌ FaultLog sheet not found');
      return false;
    }
    
    const rowData = [
      record.timestamp,           // A
      record.unitNumber,          // B
      record.reportedBy,          // C
      record.reporterEmail,       // D - Fixed Reporter email
      record.problemDescription,  // E
      record.zone,                // F
      record.unitPrimaryName,     // G - Fixed Unit Primary name
      record.unitPrimaryEmail,    // H - Fixed Unit Primary email
      record.unitPrimaryPhone,    // I - Fixed Unit Primary phone
      record.internalId,          // J
      record.problemStatus,       // K
      record.problemPriority,     // L
      record.comments,            // M
      record.category,            // N
      record.subCategory,         // O
      record.assignedTo,          // P
      record.completionDate,      // Q
      record.lastUpdated,         // R
      record.reporterPhone        // S - Fixed Reporter phone
    ];
    
    console.log('💾 Writing row with V1.5 fixed key fields:');
    console.log('  Position 3 (D):', rowData[3]);
    console.log('  Position 6 (G):', rowData[6]);
    console.log('  Position 7 (H):', rowData[7]);
    console.log('  Position 8 (I):', rowData[8]);
    console.log('  Position 18 (S):', rowData[18]);
    
    faultLogSheet.appendRow(rowData);
    console.log('✅ Successfully wrote to FaultLog');

    // Send email notifications - V1.5 (UNCHANGED)
    sendEmailNotifications(record);
    
    // Send maintenance team notifications - V1.5 (UNCHANGED)
    sendMaintenanceTeamNotification(record);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error writing to FaultLog:', error);
    return false;
  }
}

/**
 * GENERATE INTERNAL ID - V1.5 (UNCHANGED)
 */
function generateInternalId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

/**
 * GET FRIENDLY PID - V1.5 (UNCHANGED)
 */
function getFriendlyPID(internalId) {
  if (!internalId || typeof internalId !== 'string') {
    return 'PID Unknown';
  }
  
  const parts = internalId.split('-');
  if (parts.length === 2) {
    return `PID ${parts[1]}`;
  }
  
  return `PID ${internalId}`;
}

/**
 * =====================================================================
 * V1.5 EMAIL NOTIFICATION FUNCTIONS (UNCHANGED)
 * =====================================================================
 */

function sendEmailNotifications(record) {
  try {
    console.log('📧 Starting RESIDENT email notifications for:', record.internalId);
    
    const unitPrimaryEmail = record.unitPrimaryEmail;
    const reporterEmail = record.reporterEmail;
    const zoneRepEmail = getZoneRepEmail(record.zone);
    
    const recipients = determineEmailRecipients(
      record.reportedBy, 
      record.unitPrimaryName,
      unitPrimaryEmail,
      reporterEmail,
      zoneRepEmail
    );
    
    if (recipients.length === 0) {
      console.log('⚠️ No valid RESIDENT email recipients found');
      return;
    }
    
    sendResidentNotificationEmail(record, recipients);
    console.log('✅ RESIDENT email notifications sent successfully');
    
  } catch (error) {
    console.error('❌ Error sending RESIDENT email notifications:', error);
  }
}

function determineEmailRecipients(reportedBy, unitPrimaryName, unitPrimaryEmail, reporterEmail, zoneRepEmail) {
  const recipients = [];
  
  if (unitPrimaryEmail && unitPrimaryEmail.trim() !== '') {
    recipients.push(unitPrimaryEmail);
  }
  
  if (zoneRepEmail && zoneRepEmail.trim() !== '') {
    recipients.push(zoneRepEmail);
  }
  
  const reporterIsDifferent = reportedBy !== unitPrimaryName;
  if (reporterIsDifferent && reporterEmail && reporterEmail.trim() !== '') {
    if (reporterEmail !== unitPrimaryEmail) {
      recipients.push(reporterEmail);
    }
  }
  
  return [...new Set(recipients)];
}

function sendResidentNotificationEmail(record, recipients) {
  try {
    const friendlyPID = getFriendlyPID(record.internalId);
    const formattedDate = Utilities.formatDate(record.timestamp, 'Australia/Sydney', 'EEE MMM dd yyyy HH:mm:ss');
    
    const subject = `Fault Report ${friendlyPID} - ${record.unitNumber}`;
    const body = `PROBLEM REPORT NOTIFICATION

Report ID: ${friendlyPID}
Location: ${record.unitNumber}
Reported By: ${record.reportedBy}
Reported: ${formattedDate}

Problem Description:
${record.problemDescription}

Make a note of the Report ID and quote this in any communication you may have with the Maintenance Team.

This is an automated notification from the Lake Illawong Fault Reporting System.

---
Do not reply to this email. Please do not re-report this problem. For questions, contact the maintenance team.`;
    
    const recipientString = recipients.join(',');
    MailApp.sendEmail(recipientString, subject, body);
    console.log('✅ RESIDENT email sent successfully to:', recipientString);
    
  } catch (error) {
    console.error('❌ Error sending RESIDENT notification email:', error);
    throw error;
  }
}

function getZoneRepEmail(zone) {
  try {
    const sheet = SpreadsheetApp.openById(HOLDEN_SHEET_ID);
    const emailListSheet = sheet.getSheetByName('EmailList');
    
    if (!emailListSheet) {
      return null;
    }
    
    try {
      const namedRange = sheet.getRangeByName('ZoneRepEmailList');
      if (namedRange) {
        const zoneRepData = namedRange.getValues();
        for (let i = 0; i < zoneRepData.length; i++) {
          if (zoneRepData[i][0] === zone) {
            return zoneRepData[i][2];  // CHANGED: Column C (email)
          }
        }
      }
    } catch (e) {
      console.log('⚠️ Named range not found, trying direct lookup');
    }
    
    const data = emailListSheet.getDataRange().getValues();
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === zone) {
        return data[i][2];  // CHANGED: Column C (email)
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Error getting zone rep email:', error);
    return null;
  }
}

function sendMaintenanceTeamNotification(record) {
  try {
    const maintenanceEmails = getMaintenanceTeamEmails();
    if (maintenanceEmails.length === 0) {
      return;
    }
    sendMaintenanceNotificationEmail(record, maintenanceEmails);
  } catch (error) {
    console.error('❌ Error in maintenance team notification:', error);
  }
}

function getMaintenanceTeamEmails() {
  try {
    const sheet = SpreadsheetApp.openById(HOLDEN_SHEET_ID);
    
    try {
      let namedRange = sheet.getRangeByName('MtceTeamEmailList');
      if (!namedRange) {
        const emailListSheet = sheet.getSheetByName('EmailList');
        if (emailListSheet) {
          namedRange = emailListSheet.getRange('B12:B14');
        }
      }
      
      if (namedRange) {
        const rawValues = namedRange.getValues();
        const emails = rawValues.flat().filter(email => email !== "" && email != null && email.toString().includes('@'));
        if (emails.length > 0) {
          return emails;
        }
      }
    } catch (e) {
      console.log('❌ Error accessing named range:', e.message);
    }
    
    return ['irc.mtceteam@gmail.com'];
    
  } catch (error) {
    return ['irc.mtceteam@gmail.com'];
  }
}

function sendMaintenanceNotificationEmail(record, maintenanceEmails) {
  try {
    const friendlyPID = getFriendlyPID(record.internalId);
    const formattedDate = Utilities.formatDate(record.timestamp, 'Australia/Sydney', 'EEE MMM dd yyyy HH:mm:ss');
    const portalLink = createMaintenancePortalLink(record.internalId);
    
    const subject = `🔧 NEW FAULT REPORT: ${friendlyPID} - ${record.unitNumber} - ${record.problemPriority} Priority`;
    const body = `MAINTENANCE TEAM NOTIFICATION

NEW FAULT REPORT SUBMITTED

Report ID: ${friendlyPID}
Internal ID: ${record.internalId}
Location: ${record.unitNumber} (${record.zone})
Reported By: ${record.reportedBy}
Submitted: ${formattedDate}
Priority: ${record.problemPriority}
Status: ${record.problemStatus}

PROBLEM DETAILS:
${record.problemDescription}

CONTACT INFORMATION:
Unit Primary: ${record.unitPrimaryName}
Unit Primary Email: ${record.unitPrimaryEmail}
Unit Primary Phone: ${record.unitPrimaryPhone}
Reporter Email: ${record.reporterEmail}
Reporter Phone: ${record.reporterPhone}

MAINTENANCE PORTAL:
View and manage this fault: ${portalLink}

QUICK ACTIONS:
• Update status and priority
• Assign to team member
• Add maintenance comments
• Mark as completed

═══════════════════════════════════════
This is an automated notification from the Lake Illawong Fault Reporting System.

Please do not reply to this email. Use the maintenance portal link above to manage this fault report.`;
    
    const recipientString = maintenanceEmails.join(',');
    MailApp.sendEmail(recipientString, subject, body);
    console.log('✅ Maintenance email sent successfully to:', recipientString);
    
  } catch (error) {
    console.error('❌ Error sending maintenance email:', error);
    throw error;
  }
}

function createMaintenancePortalLink(internalId) {
  const portalUrl = 'https://maintenanceportal2025.github.io/maintenance-portal/MaintenancePortal.html';
  const friendlyPID = getFriendlyPID(internalId);
  return `${portalUrl}?search=${encodeURIComponent(friendlyPID)}`;
}

/**
 * =====================================================================
 * 🆕 V1.6 FIXED: ADMIN DROPDOWN MANAGEMENT FUNCTIONS FOR CATEGORIES TAB
 * =====================================================================
 */

/**
 * GET ADMIN DROPDOWN DATA - Returns simple Categories tab data for frontend
 */
function getAdminDropdownData() {
  try {
    console.log('👑 Loading admin dropdown data from Categories tab...');
    
    const spreadsheet = SpreadsheetApp.openById(HOLDEN_SHEET_ID);
    const categoriesSheet = spreadsheet.getSheetByName('Categories');
    
    if (!categoriesSheet) {
      return {
        success: false,
        error: 'Categories sheet not found'
      };
    }
    
    const data = categoriesSheet.getDataRange().getValues();
    console.log('📊 Raw Categories data rows:', data.length);
    
    const adminData = {
      unitNumbers: [],
      reportedBy: []
    };
    
    // Process each row - return simple values for frontend
    for (let i = 1; i < data.length; i++) {
      const type = data[i][0]; // Column A: Type
      const value = data[i][1]; // Column B: Value
      
      if (!type || !value) continue;
      
      // Simple format for frontend
      if (type === 'Unit Number') {
        adminData.unitNumbers.push(value);
      } else if (type === 'Reported By') {
        adminData.reportedBy.push(value);
      }
    }
    
    console.log('✅ Categories admin data processed:', {
      unitNumbers: adminData.unitNumbers.length,
      reportedBy: adminData.reportedBy.length
    });
    
    return {
      success: true,
      data: adminData
    };
    
  } catch (error) {
    console.error('❌ Error loading Categories admin dropdown data:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * ADD DROPDOWN ITEM - FIXED: Adds new item with automatic sorting
 */
function addDropdownItem(params) {
  try {
    console.log('👑 Adding Categories dropdown item:', params);
    
    const type = params.type;
    const value = params.value;
    
    if (!type || !value) {
      return {
        success: false,
        message: 'Type and value are required'
      };
    }
    
    // Validate type for Categories tab
    const validTypes = ['Unit Number', 'Reported By'];
    if (!validTypes.includes(type)) {
      return {
        success: false,
        message: 'Invalid type. Must be one of: ' + validTypes.join(', ')
      };
    }
    
    const spreadsheet = SpreadsheetApp.openById(HOLDEN_SHEET_ID);
    const categoriesSheet = spreadsheet.getSheetByName('Categories');
    
    if (!categoriesSheet) {
      return {
        success: false,
        message: 'Categories sheet not found'
      };
    }
    
    // Check for duplicates
    const data = categoriesSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === type && data[i][1] === value) {
        return {
          success: false,
          message: `Item "${value}" already exists in ${type}`
        };
      }
    }
    
    // Add new row
    categoriesSheet.appendRow([type, value]);
    
    // FIXED: Sort the sheet after adding
    sortCategoriesSheet(categoriesSheet);
    
    console.log(`✅ Added to Categories: ${type} | ${value}`);
    
    return {
      success: true,
      message: `Successfully added "${value}" to ${type}`,
      addedValue: value
    };
    
  } catch (error) {
    console.error('❌ Error adding Categories dropdown item:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * DELETE DROPDOWN ITEM - FIXED: Uses type/value matching instead of row numbers
 */
function deleteDropdownItem(params) {
  try {
    console.log('👑 FIXED: Deleting Categories dropdown item:', params);
    
    const type = params.type;
    const value = params.value;
    
    if (!type || !value) {
      return {
        success: false,
        message: 'Type and value are required'
      };
    }
    
    const spreadsheet = SpreadsheetApp.openById(HOLDEN_SHEET_ID);
    const categoriesSheet = spreadsheet.getSheetByName('Categories');
    
    if (!categoriesSheet) {
      return {
        success: false,
        message: 'Categories sheet not found'
      };
    }
    
    const data = categoriesSheet.getDataRange().getValues();
    console.log(`📊 Categories sheet has ${data.length} rows`);
    
    // Find the item to delete with exact matching
    let foundRow = -1;
    let actualValue = '';
    
    for (let i = 1; i < data.length; i++) { // Skip header row
      const rowType = String(data[i][0] || '').trim();
      const rowValue = String(data[i][1] || '').trim();
      
      console.log(`🔍 Row ${i}: Type="${rowType}", Value="${rowValue}"`);
      
      if (rowType === type && rowValue === value) {
        foundRow = i;
        actualValue = rowValue;
        break;
      }
    }
    
    if (foundRow === -1) {
      // Enhanced error reporting - show what actually exists
      console.log('❌ Item not found. Available items for type:', type);
      const availableItems = [];
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0] || '').trim() === type) {
          availableItems.push(String(data[i][1] || '').trim());
        }
      }
      console.log('Available items:', availableItems);
      
      return {
        success: false,
        message: `Item "${value}" not found in ${type}. Available items: ${availableItems.join(', ')}`,
        availableItems: availableItems
      };
    }
    
    // Delete the row
    console.log(`🗑️ Deleting row ${foundRow + 1}: ${type} = ${actualValue}`);
    categoriesSheet.deleteRows(foundRow + 1, 1);
    
    console.log('✅ Item deleted successfully');
    
    return {
      success: true,
      message: `Successfully deleted "${actualValue}" from ${type}`,
      deletedValue: actualValue,
      deletedFromRow: foundRow + 1
    };
    
  } catch (error) {
    console.error('❌ Error deleting Categories dropdown item:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * UPDATE DROPDOWN ITEM - FIXED: Uses type/value matching for updates
 */
function updateDropdownItem(params) {
  try {
    console.log('👑 Updating Categories dropdown item:', params);
    
    const oldType = params.oldType;
    const oldValue = params.oldValue;
    const newType = params.newType;
    const newValue = params.newValue;
    
    if (!oldType || !oldValue || !newType || !newValue) {
      return {
        success: false,
        message: 'Old type, old value, new type, and new value are required'
      };
    }
    
    // Validate new type for Categories tab
    const validTypes = ['Unit Number', 'Reported By'];
    if (!validTypes.includes(newType)) {
      return {
        success: false,
        message: 'Invalid new type. Must be one of: ' + validTypes.join(', ')
      };
    }
    
    const spreadsheet = SpreadsheetApp.openById(HOLDEN_SHEET_ID);
    const categoriesSheet = spreadsheet.getSheetByName('Categories');
    
    if (!categoriesSheet) {
      return {
        success: false,
        message: 'Categories sheet not found'
      };
    }
    
    const data = categoriesSheet.getDataRange().getValues();
    
    // Find the item to update
    let foundRow = -1;
    for (let i = 1; i < data.length; i++) {
      const rowType = String(data[i][0] || '').trim();
      const rowValue = String(data[i][1] || '').trim();
      
      if (rowType === oldType && rowValue === oldValue) {
        foundRow = i;
        break;
      }
    }
    
    if (foundRow === -1) {
      return {
        success: false,
        message: `Item "${oldValue}" not found in ${oldType}`
      };
    }
    
    // Check for duplicates (excluding current row)
    for (let i = 1; i < data.length; i++) {
      const currentRowNumber = i + 1;
      const sheetRowNumber = foundRow + 1;
      if (currentRowNumber !== sheetRowNumber && data[i][0] === newType && data[i][1] === newValue) {
        return {
          success: false,
          message: `Item "${newValue}" already exists in ${newType}`
        };
      }
    }
    
    // Update the row
    categoriesSheet.getRange(foundRow + 1, 1).setValue(newType);
    categoriesSheet.getRange(foundRow + 1, 2).setValue(newValue);
    
    // Sort after update
    sortCategoriesSheet(categoriesSheet);
    
    console.log(`✅ Updated Categories row ${foundRow + 1}: ${oldType}|${oldValue} → ${newType}|${newValue}`);
    
    return {
      success: true,
      message: `Successfully updated "${oldValue}" to "${newValue}"`,
      updatedFrom: { type: oldType, value: oldValue },
      updatedTo: { type: newType, value: newValue }
    };
    
  } catch (error) {
    console.error('❌ Error updating Categories dropdown item:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * ENHANCED SORTING FUNCTION - WITH SURNAME-BASED SORTING FOR REPORTED BY
 * Replace the sortCategoriesSheet function in your V1.6 code
 */
function sortCategoriesSheet(sheet) {
  try {
    console.log('🔄 Sorting Categories sheet with enhanced logic...');
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      console.log('ℹ️ No data to sort');
      return;
    }
    
    const header = data[0];
    const dataRows = data.slice(1);
    
    // Enhanced sorting by Type (column 0) then by Value (column 1)
    dataRows.sort((a, b) => {
      const typeA = String(a[0] || '').trim();
      const typeB = String(b[0] || '').trim();
      
      // First sort by type
      if (typeA !== typeB) {
        return typeA.localeCompare(typeB);
      }
      
      const valueA = String(a[1] || '').trim();
      const valueB = String(b[1] || '').trim();
      
      // Special sorting for Unit Numbers (numerical order)
      if (typeA === 'Unit Number' && typeB === 'Unit Number') {
        const numA = parseInt(valueA.replace(/\D/g, '')) || 0;
        const numB = parseInt(valueB.replace(/\D/g, '')) || 0;
        return numA - numB;
      }
      
      // 🆕 ENHANCED: Special sorting for Reported By (surname-based alphabetical)
      if (typeA === 'Reported By' && typeB === 'Reported By') {
        const surnameA = extractSurname(valueA);
        const surnameB = extractSurname(valueB);
        
        console.log(`🔤 Sorting names: "${valueA}" (${surnameA}) vs "${valueB}" (${surnameB})`);
        
        return surnameA.localeCompare(surnameB);
      }
      
      // Default alphabetical sorting for other types
      return valueA.localeCompare(valueB);
    });
    
    // Clear the sheet and rewrite with sorted data
    sheet.clear();
    const sortedData = [header, ...dataRows];
    sheet.getRange(1, 1, sortedData.length, sortedData[0].length).setValues(sortedData);
    
    console.log('✅ Categories sheet sorted successfully with enhanced surname sorting');
    
  } catch (error) {
    console.error('❌ Error sorting Categories sheet:', error);
  }
}

/**
 * 🆕 EXTRACT SURNAME FROM FULL NAME FOR SORTING
 * Handles various name formats and extracts the surname for alphabetical sorting
 */
function extractSurname(fullName) {
  try {
    if (!fullName || fullName.trim() === '') {
      return '';
    }
    
    const cleanName = fullName.trim();
    console.log(`🔤 Extracting surname from: "${cleanName}"`);
    
    // Split by spaces and get the last part as surname
    const nameParts = cleanName.split(/\s+/);
    
    if (nameParts.length === 1) {
      // Single name - use as is
      return cleanName.toLowerCase();
    }
    
    // Multiple parts - use last part as surname
    const surname = nameParts[nameParts.length - 1];
    console.log(`🔤 Extracted surname: "${surname}"`);
    
    return surname.toLowerCase();
    
  } catch (error) {
    console.error('❌ Error extracting surname:', error);
    return fullName.toLowerCase();
  }
}


/**
 * =====================================================================
 * 📋 DEPLOYMENT INSTRUCTIONS V1.6 COMPLETE
 * =====================================================================
 * 
 * ✅ FIXED ISSUES FROM ORIGINAL V1.6:
 * 1. Removed fragile row-number based system
 * 2. Enhanced error handling with detailed feedback
 * 3. Automatic sorting after add/update operations
 * 4. Type/value based matching for reliable deletion
 * 5. Proper duplicate checking for all operations
 * 
 * ✅ ALL V1.5 FUNCTIONALITY PRESERVED:
 * - Dual lookup system works exactly as before
 * - Email notifications unchanged
 * - Resident form submission unchanged
 * - Dynamic dropdown loading unchanged
 * 
 * 🆕 FIXED ADMIN FUNCTIONALITY:
 * - Reliable Categories tab dropdown management
 * - Enhanced error messages show available items
 * - Automatic sorting keeps Unit Numbers in order
 * - Type/value matching prevents data inconsistencies
 * 
 * 🚀 DEPLOYMENT STEPS:
 * 1. Replace your current HoldenResidentSubmission.gs with this code
 * 2. Save and redeploy the web app
 * 3. Test resident form submission (should work unchanged)
 * 4. Test admin portal dropdown management
 * 5. Verify Unit 53 now appears in correct numerical order
 * 
 * 🔍 TESTING CHECKLIST:
 * 1. ✅ Add "Unit 53" - should appear between Unit 52 and Unit 54
 * 2. ✅ Delete existing items - should work without errors
 * 3. ✅ Try to delete non-existent item - should show helpful error
 * 4. ✅ Add duplicate item - should prevent with clear message
 * 5. ✅ Verify resident form still loads dropdowns correctly
 * 6. ✅ Submit test problem - should work with email notifications
 * 
 * =====================================================================
 */

console.log('🌐 Holden Resident Submission V1.6 COMPLETE - Loaded and Ready!');
console.log('✅ All V1.5 functionality preserved - dual lookup + email notifications');
console.log('👑 FIXED admin endpoints: Type/value matching, automatic sorting, enhanced errors');
console.log('📋 Manages Categories tab: Unit Numbers, Reported By names');
console.log('🔧 Ready for admin portal integration with reliable dropdown management');