/**
 * =====================================================================
 * MaintenancePortal V1.0
 * =====================================================================
 ** 
 * 
 * PURPOSE: Complete backend with individual user accounts + activity logging 
 * FEATURES: User authentication, activity tracking, dynamic dropdowns, completion automation, smart emails, ADMIN CRUD
 * SHEET: Lake Illawong - Maintenance System V2
 * Added individual user accounts and comprehensive activity logging
 * 
 *
 * ✅ Individual user authentication (4 accounts: Director, Team x2, RC)
 * ✅ Comprehensive activity logging (all changes tracked with user/timestamp)
 * ✅ Enhanced FaultLog structure with new columns T, U, V
 * ✅ UserAccounts sheet for individual login management
 * ✅ Activity timeline display in problem management
 * ✅ PRESERVES ALL V2.3 FUNCTIONALITY (admin functions, completion automation, emails)
 * 
 * ENHANCED FAULTLOG STRUCTURE (A-V):
 * A: Timestamp (Reported)      J: Internal ID           S: Reporter Phone
 * B: Unit Number               K: Status                T: ActivityLog (JSON)     ← NEW
 * C: Reported By (Name)        L: Priority              U: LastActionBy           ← NEW  
 * D: Reporter Email            M: Comments              V: LastActionTime         ← NEW
 * E: Problem Description       N: Category              
 * F: Zone                      O: Sub-Category          
 * G: Unit Primary Name         P: Assigned To           
 * H: Unit Primary Email        Q: Completion Date       
 * I: Unit Primary Phone        R: Last Updated          
 * 
 * USER ACCOUNTS STRUCTURE:
 * A: Username               D: Role                  G: LastLogin
 * B: PasswordHash           E: Name                  H: IsActive
 * C: Email                  F: CreatedDate           I: LoginAttempts
 * 
 * 📄 WORKFLOW PROCESS:
 * 1. **Before ANY change**: Copy current script to backup version
 * 2. **Make change**: Update the Google Apps Script 
 * 3. **Update header**: Increment version, add to VERSION HISTORY
 * 4. **Document change**: Note what was modified
 * 5. **Redeploy**: Publish new web app version
 * 6. **Update frontend URLs**: If major version change
 *
 * 📋 SCRIPT INFORMATION:
 * • Script Name: MAaintenencePortal 
 * • System: Lake Illawong Maintenance Portal (Production)
 * • Component Type: Complete Backend API with User Authentication & Activity Logging
 * • **FRONTEND INTEGRATION**: MaintenancePortal.html, Email Notification Management
 * • Status: ✅ PRODUCTION READY - Complete backend with individual user accounts
 * • Created: August 2025
 * • Last Modified: September 10th , 2025
 * • Backup Location: Google Apps Script Version History + Drive Backups
 *
 * 📊 BACKEND VERSION HISTORY: (this is left in for historical purposes)
 * • v2.4.0 (Aug 15, 2025): Individual user authentication + comprehensive activity logging
 * • v2.3.x: Admin CRUD functions for dropdown management
 * • v2.2.x: Completion automation and smart email notifications
 * • v2.1.x: Dynamic dropdown functionality
 * • v2.0.x: Core maintenance portal functionality
 * • v1.x.x: Legacy versions (deprecated)
 *
 * 🔗 SYSTEM CONNECTIONS:
 * • **CALLS**: Google Sheets API (FaultLog, UserAccounts, Maintenance, Categories tabs)
 * • **CALLED BY**: holden-maintenance-portal.html, Email Notification Management.html, admin portals
 * • **INTEGRATES WITH**: Gmail API, ZoneRepEmailList, EmailTemplateRange, Named Ranges
 * • **DATA STORAGE**: Enhanced FaultLog with Activity Logging (columns T, U, V)
 * • **USER MANAGEMENT**: UserAccounts sheet with authentication and role management
 *
 * 📄 BACKUP PROTOCOL:
 * • Before ANY changes: Save current version in Google Apps Script version history
 * • Document version number increment in header after changes
 * • Update deployment URL in calling frontend files if major version change
 * • Zero risk deployment approach with instant rollback capability
 *
 * 🎯 PRIMARY PURPOSE:
 * Complete backend API for Lake Illawong Maintenance Portal providing individual user
 * authentication, comprehensive activity logging, and all maintenance management functions.
 * Serves as the primary data layer for problem management, user access control, dropdown
 * administration, completion automation, and email notifications. V2.4 adds individual
 * user accounts with role-based access while preserving ALL V2.3 functionality.
 *
 * 🔗 INTEGRATION ARCHITECTURE:
 * • **User Authentication**: Individual login accounts with SHA-256 password hashing
 * • **Activity Logging**: Comprehensive change tracking with user attribution and timestamps
 * • **Problem Management**: Complete CRUD operations for maintenance problems
 * • **Admin Functions**: Dynamic dropdown management for all system categories
 * • **Email Integration**: Completion automation with template-based notifications
 * • **Role-Based Access**: User roles (Director, Team, Committee) with future enhancement support
 *
 * ⚙️ TECHNICAL SPECIFICATIONS:
 * • Platform: Google Apps Script (Cloud-based JavaScript runtime)
 * • API Protocol: HTTP GET requests with JSONP callback support
 * • Authentication: Individual user accounts with session management
 * • Dependencies: Google Sheets API, Gmail API, SpreadsheetApp, GmailApp
 * • Data Storage: Enhanced Google Sheets with activity logging (columns T, U, V)
 * • Response Format: JSON with comprehensive success/error structure
 * • Cross-Origin: JSONP support for frontend integration
 *
 * 🎨 API ENDPOINTS & ACTIONS:
 *
 * • **getFaultLogData**: Load all maintenance problems with activity logs
 * • **updateProblem**: Update problem with optional user attribution
 * • **getDropdownOptions**: Retrieve all dynamic dropdown data
 * • **addDropdownItem**: Add new dropdown options (admin function)
 * • **updateDropdownItem**: Modify dropdown options (admin function) 
 * • **deleteDropdownItem**: Remove dropdown options (admin function)
 * • **getNamedRangeData**: Retrieve specific named range data
 * • **updateNamedRangeCell**: Update individual cells in named ranges
 * • **updateNamedRangeRow**: Update complete rows in named ranges
 * • **addNamedRangeRow**: Add new rows to named ranges
 * • **deleteNamedRangeRow**: Remove rows from named ranges
 *
 * 
 * • **authenticateUser**: Individual user login with username/password
 * • **getCurrentUser**: Retrieve current user session information
 * • **getUserList**: Get all user accounts for administration
 * • **updateProblemWithActivity**: Enhanced problem updates with activity logging
 * • **getActivityLog**: Retrieve activity history for specific problems
 * • **createUser**: Add new user accounts (admin function)
 * • **updateUser**: Modify user account details (admin function)
 * • **deleteUser**: Remove user accounts (admin function)
 * • **resetUserPassword**: Generate new temporary passwords
 * • **toggleUserStatus**: Enable/disable user accounts
 *
 * 📄 ENHANCED DATA STRUCTURE:
 * **FAULTLOG COLUMNS (A-V)**:
 * • A: Timestamp (Reported)     • J: Internal ID          • S: Reporter Phone
 * • B: Unit Number              • K: Status               • T: ActivityLog (JSON) ← NEW
 * • C: Reported By (Name)       • L: Priority             • U: LastActionBy ← NEW
 * • D: Reporter Email           • M: Comments             • V: LastActionTime ← NEW
 * • E: Problem Description      • N: Category
 * • F: Zone                     • O: Sub-Category
 * • G: Unit Primary Name        • P: Assigned To
 * • H: Unit Primary Email       • Q: Completion Date
 * • I: Unit Primary Phone       • R: Last Updated
 *
 * **USER ACCOUNTS STRUCTURE**:
 * • A: Username                 • D: Role                 • G: LastLogin
 * • B: PasswordHash             • E: Name                 • H: IsActive
 * • C: Email                    • F: CreatedDate          • I: LoginAttempts
 *
 * 🚀 DEPLOYMENT STATUS: ✅ PRODUCTION READY
 * • Current State: Complete backend with individual user authentication and activity logging
 * 
 * • Integration: Ready for frontend authentication integration
 * • User Accounts: 4 default accounts auto-created (director, team1, team2, committee)
 * • Activity Logging: JSON format activity tracking with 50-entry rolling history
 *
 * 🔧 AUTHENTICATION ARCHITECTURE:
 * • Module Category: Individual User Authentication / Role-Based Access Control
 * • Access Pattern: Username/password with SHA-256 hashing
 * • Session Management: Login attempt tracking and account status control
 * • Default Accounts: 4 pre-configured users ready for immediate use
 * • Security Features: Password hashing, login attempt monitoring, account disable/enable
 * • Future Enhancement: Role-based permissions and advanced access control ready
 *
 *
 * 📋 GOOGLE SHEETS INTEGRATION:
 * • **Sheet ID**: 14u4Hl3Uluvk45ABIcgKGltX8EpBdGj1JvF_kEtZwmEE
 * • **Enhanced Sheets**: FaultLog (A-V), UserAccounts (A-I), Maintenance, Categories
 * • **Named Ranges**: ZoneRepEmailList, EmailTemplateRange, dropdown management ranges
 * • **Activity Logging**: JSON format in column T with structured change tracking
 * • **User Accounts**: Auto-created sheet with 4 default accounts and security features
 * • **Data Validation**: Enhanced validation for activity logs and user management
 *
 * ⚠️ CRITICAL INTEGRATION POINTS:
 *
 * 🔧 FRONTEND DEPENDENCIES:
 * • **holden-maintenance-portal.html**: Requires authentication integration and activity timeline display
 * • **Email Notification Management.html**: Uses preserved named range functions
 * • **Admin Portals**: All dropdown management functions preserved exactly
 * • **Activity Display**: Frontend must parse activityLogParsed for timeline display
 *
 * 🔄 DEPLOYMENT REQUIREMENTS:
 * • **Google Sheets Setup**: Add columns T, U, V to FaultLog sheet before deployment
 * • **Default Users**: UserAccounts sheet auto-created with 4 accounts on first API call
 * • **Testing Required**: Complete authentication and activity logging verification
 * • **Fallback Ready**: V2.3 URL maintained for instant rollback if issues occur
 *
 * 📊 ACTIVITY LOGGING ARCHITECTURE:
 * • **JSON Format**: Structured activity data in column T (ActivityLog)
 * • **Change Tracking**: Field-level before/after value tracking
 * • **User Attribution**: Every change attributed to authenticated user
 * • **Timestamp Precision**: ISO format timestamps for all activities
 * • **Rolling History**: Maintains last 50 activities per problem
 * • **System Activities**: Automatic logging for completion and email events
 * • **Timeline Display**: Frontend parsing for activity timeline visualization
 * 
 * =====================================================================
 */

const HOLDEN_SHEET_ID = '14u4Hl3Uluvk45ABIcgKGltX8EpBdGj1JvF_kEtZwmEE';

/**
 * WEB APP ENTRY POINT - Enhanced with user authentication
 */
function doGet(e) {
  try {
    console.log('🔧 HOLDEN PORTAL API V2.4 REQUEST');
    console.log('ALL PARAMETERS RECEIVED:', e.parameter);
    
    const action = e.parameter.action;
    const callback = e.parameter.callback;
    
    let result;
    
    switch (action) {
      // Existing V2.3 endpoints - PRESERVED EXACTLY
      case 'getFaultLogData':
        console.log('📊 Loading fault log data...');
        result = getFaultLogData();
        break;
        
      case 'updateProblem':
        console.log('✏️ Updating problem...');
        result = updateProblem(e.parameter);
        break;
        
      case 'getDropdownOptions':
        console.log('🎛️ Loading dropdown options...');
        result = getDropdownOptions();
        break;
        
      // V2.3 Admin functions - PRESERVED EXACTLY
      case 'addDropdownItem':
        console.log('➕ Adding dropdown item...');
        result = addDropdownItem(e.parameter);
        break;

      case 'updateDropdownItem':
        console.log('✏️ Updating dropdown item...');
        result = updateDropdownItem(e.parameter);
        break;

      case 'deleteDropdownItem':
        console.log('🗑️ Deleting dropdown item...');
        result = deleteDropdownItem(e.parameter);
        break;

      case 'getNamedRangeData':
        console.log('📋 Getting named range data:', e.parameter.rangeName);
        result = getNamedRangeData(e.parameter.rangeName);
        break;

      case 'updateNamedRangeCell':
        console.log('✏️ Updating named range cell...');
        result = updateNamedRangeCell(e.parameter);
        break;

      case 'updateNamedRangeRow':
        console.log('✏️ Updating named range row...');
        result = updateNamedRangeRow(e.parameter);
        break;

      case 'addNamedRangeRow':
        console.log('➕ Adding named range row...');
        result = addNamedRangeRow(e.parameter);
        break;

      case 'deleteNamedRangeRow':
        console.log('🗑️ Deleting named range row...');
        result = deleteNamedRangeRow(e.parameter);
        break;
        
      // NEW V2.4: User authentication endpoints
      case 'authenticateUser':
        console.log('🔐 Authenticating user...');
        result = authenticateUser(e.parameter);
        break;
        
      case 'getCurrentUser':
        console.log('👤 Getting current user...');
        result = getCurrentUser(e.parameter);
        break;
        
      case 'getUserList':
        console.log('👥 Getting user list...');
        result = getUserList();
        break;
        
      // NEW V2.4: Enhanced problem update with activity logging
      case 'updateProblemWithActivity':
        console.log('📝 Updating problem with activity log...');
        result = updateProblemWithActivity(e.parameter);
        break;
        
      case 'getActivityLog':
        console.log('📜 Getting activity log...');
        result = getActivityLog(e.parameter);
        break;

      // NEW: User Management CRUD endpoints
      case 'createUser':
        console.log('👤➕ Creating new user...');
        result = createUser(e.parameter);
        break;
        
      case 'updateUser':
        console.log('👤✏️ Updating user...');
        result = updateUser(e.parameter);
        break;
        
      case 'deleteUser':
        console.log('👤🗑️ Deleting user...');
        result = deleteUser(e.parameter);
        break;
        
      case 'resetUserPassword':
        console.log('👤🔑 Resetting user password...');
        result = resetUserPassword(e.parameter);
        break;
        
      case 'toggleUserStatus':
        console.log('👤⏯️ Toggling user status...');
        result = toggleUserStatus(e.parameter);
        break;

        
      default:
        console.log('❌ Unknown action:', action);
        result = { success: false, message: 'Unknown action: ' + action };
    }
    
    console.log('📤 Response:', result);
    
    // Handle JSONP callback
    if (callback) {
      return ContentService.createTextOutput(`${callback}(${JSON.stringify(result)})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('💥 API ERROR:', error);
    
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

function getFaultLogData() {
  try {
    console.log('📊 Loading FaultLog data...');
    
    const sheet = SpreadsheetApp.openById(HOLDEN_SHEET_ID);
    const faultLogSheet = sheet.getSheetByName('FaultLog');
    
    if (!faultLogSheet) {
      console.log('❌ FaultLog sheet not found');
      return { success: false, message: 'FaultLog sheet not found' };
    }
    
    const data = faultLogSheet.getDataRange().getValues();
    const headers = data[0];
    
    console.log('📋 FaultLog headers:', headers);
    console.log(`📊 Found ${data.length - 1} problems in FaultLog`);
    
    // Create column mapping
    const columnMap = {};
    headers.forEach((header, index) => {
      columnMap[header] = index;
    });
    
    const problems = [];
    
    // Process each row (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      const problem = {
        timestamp: row[columnMap['Timestamp (Reported)']] || '',
        unitNumber: row[columnMap['Unit Number']] || '',
        reportedBy: row[columnMap['Reported By']] || '',
        reporterEmail: row[columnMap['Reporter Email']] || '',
        problemDescription: row[columnMap['Problem Description']] || '',
        zone: row[columnMap['Zone']] || '',
        unitPrimaryName: row[columnMap['Unit Primary Name']] || '',
        unitPrimaryEmail: row[columnMap['Unit Primary Email']] || '',
        unitPrimaryPhone: row[columnMap['Unit Primary Phone']] || '',
        internalId: row[columnMap['Internal ID']] || '',
        problemStatus: row[columnMap['Status']] || 'Reported',
        problemPriority: row[columnMap['Priority']] || 'Medium',
        comments: row[columnMap['Comments']] || '',
        category: row[columnMap['Category']] || '',
        subCategory: row[columnMap['Sub-Category']] || '',
        assignedTo: row[columnMap['Assigned To']] || '',
        completionDate: row[columnMap['Completion Date']] || '',
        lastUpdated: row[columnMap['Last Updated']] || '',
        reporterPhone: row[columnMap['Reporter Phone']] || '',
        
        // NEW V2.4: Activity log fields
        activityLog: row[columnMap['ActivityLog']] || '[]',
        lastActionBy: row[columnMap['LastActionBy']] || '',
        lastActionTime: row[columnMap['LastActionTime']] || ''
      };
      
      // Parse activity log JSON
      try {
        problem.activityLogParsed = JSON.parse(problem.activityLog);
      } catch (e) {
        problem.activityLogParsed = [];
      }
      
      problems.push(problem);
    }
    
    console.log(`✅ Loaded ${problems.length} problems with activity logs`);
    
    return {
      success: true,
      data: problems
    };
    
  } catch (error) {
    console.error('❌ Error loading FaultLog:', error);
    return { success: false, error: error.toString() };
  }
}

function updateProblem(params) {
  // Call the new function with 'SYSTEM' as user for backward compatibility
  return updateProblemWithActivity({
    ...params,
    user: params.user || 'SYSTEM'
  });
}


function updateProblemWithActivity(params) {
  try {
    console.log('✏️ Updating problem with activity:', params.internalId);
    console.log('Update data:', {
      status: params.problemStatus,
      priority: params.problemPriority,
      comments: params.comments,
      category: params.category,
      subCategory: params.subCategory,
      assignedTo: params.assignedTo,
      user: params.user
    });
    
    const sheet = SpreadsheetApp.openById(HOLDEN_SHEET_ID);
    const faultLogSheet = sheet.getSheetByName('FaultLog');
    
    if (!faultLogSheet) {
      console.log('❌ FaultLog sheet not found');
      return { success: false, message: 'FaultLog sheet not found' };
    }
    
    const data = faultLogSheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find column indices
    const columnMap = {};
    headers.forEach((header, index) => {
      columnMap[header] = index;
    });
    
    // Find the problem row
    let rowNum = -1;
    let currentRow = null;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][columnMap['Internal ID']] === params.internalId) {
        rowNum = i + 1; // Convert to 1-based indexing for sheet operations
        currentRow = [...data[i]]; // Create a copy we can update
        break;
      }
    }
    
    if (rowNum === -1) {
      console.log('❌ Problem not found:', params.internalId);
      return { success: false, message: 'Problem not found' };
    }
    
    console.log(`✅ Found problem at row ${rowNum}`);
    
    const updates = [];
    const changes = []; // Track changes for activity log
    
    // Handle completion automation (PRESERVED FROM V2.3)
    let isBecomingCompleted = false;
    if (params.problemStatus === 'Completed') {
      const currentStatus = currentRow[columnMap['Status']];
      if (currentStatus !== 'Completed') {
        isBecomingCompleted = true;
        const today = new Date();
        const completionDate = Utilities.formatDate(today, 'Australia/Melbourne', 'yyyy-MM-dd');
        
        faultLogSheet.getRange(rowNum, columnMap['Completion Date'] + 1).setValue(completionDate);
        updates.push(`Auto-completion date: ${completionDate}`);
        
        // Update currentRow to reflect the change
        currentRow[columnMap['Completion Date']] = completionDate;
        
        changes.push({
          field: 'Completion Date',
          oldValue: currentRow[columnMap['Completion Date']] || '',
          newValue: completionDate
        });
        
        // Send completion email notification
        try {
          const problemData = {
  internalId: currentRow[columnMap['Internal ID']],
  unitNumber: currentRow[columnMap['Unit Number']],
  problemDescription: currentRow[columnMap['Problem Description']],
  unitPrimaryEmail: currentRow[columnMap['Unit Primary Email']],
  unitPrimaryName: currentRow[columnMap['Unit Primary Name']],
  reportedBy: currentRow[columnMap['Reported By']],
  reporterEmail: currentRow[columnMap['Reporter Email']],
  zone: currentRow[columnMap['Zone']],
  completionDate: completionDate
};
          
          sendCompletionNotification(problemData);
          updates.push('📧 Completion notification sent');
          
        } catch (emailError) {
          console.error('❌ Error sending completion email:', emailError);
          updates.push('⚠️ Email notification failed: ' + emailError.toString());
        }
      }
    }
    
    // Update status if provided
    if (params.problemStatus && columnMap['Status'] !== undefined) {
      const oldValue = currentRow[columnMap['Status']];
      if (oldValue !== params.problemStatus) {
        faultLogSheet.getRange(rowNum, columnMap['Status'] + 1).setValue(params.problemStatus);
        updates.push(`Status: ${params.problemStatus}`);
        
        // Update currentRow to reflect the change
        currentRow[columnMap['Status']] = params.problemStatus;
        
        changes.push({
          field: 'Status',
          oldValue: oldValue,
          newValue: params.problemStatus
        });
      }
    }
    
    // Update priority if provided
    if (params.problemPriority && columnMap['Priority'] !== undefined) {
      const oldValue = currentRow[columnMap['Priority']];
      if (oldValue !== params.problemPriority) {
        faultLogSheet.getRange(rowNum, columnMap['Priority'] + 1).setValue(params.problemPriority);
        updates.push(`Priority: ${params.problemPriority}`);
        
        // Update currentRow to reflect the change
        currentRow[columnMap['Priority']] = params.problemPriority;
        
        changes.push({
          field: 'Priority',
          oldValue: oldValue,
          newValue: params.problemPriority
        });
      }
    }
    
    // ROBUST: Update comments with copy/paste safe addition detection
    if (params.comments !== undefined && columnMap['Comments'] !== undefined) {
      const oldValue = currentRow[columnMap['Comments']] || '';
      const newValue = params.comments || '';
      
      if (oldValue !== newValue) {
        faultLogSheet.getRange(rowNum, columnMap['Comments'] + 1).setValue(newValue);
        updates.push(`Comments: ${newValue}`);
        
        // Update currentRow to reflect the change
        currentRow[columnMap['Comments']] = newValue;
        
        // 🔧 ROBUST: Normalize text for comparison (handles copy/paste issues)
        const normalizeText = (text) => {
          return text
            .replace(/\r\n/g, '\n')    // Normalize Windows line endings
            .replace(/\r/g, '\n')      // Normalize Mac line endings  
            .replace(/\u00A0/g, ' ')   // Replace non-breaking spaces
            .replace(/\u200B/g, '')    // Remove zero-width spaces
            .replace(/\uFEFF/g, '')    // Remove byte order marks
            .trim();                   // Remove leading/trailing whitespace
        };
        
        const normalizedOld = normalizeText(oldValue);
        const normalizedNew = normalizeText(newValue);
        
        // 🔧 ENHANCED: Detect if this is a comment addition vs full replacement
        const isCommentAddition = normalizedNew.startsWith(normalizedOld) && 
                                 normalizedNew.length > normalizedOld.length &&
                                 normalizedOld.length > 0;
        
        if (isCommentAddition) {
          // Extract just the new comment that was added
          const addedContent = normalizedNew.substring(normalizedOld.length);
          const cleanAddedContent = addedContent.replace(/^\n+/, '').replace(/\n+$/, ''); // Remove leading/trailing newlines
          
          // 🔧 SAFETY CHECK: Ensure we actually have new content
          if (cleanAddedContent.length > 0) {
            // Log as a comment addition
            changes.push({
              field: 'Comment Added',
              oldValue: '', // Don't show old value for additions
              newValue: cleanAddedContent,
              changeType: 'addition'
            });
            
            console.log('📝 Comment addition detected:', cleanAddedContent);
          } else {
            // Fallback to full change if no clean content detected
            console.log('⚠️ Comment addition detected but no clean content - using full change');
            changes.push({
              field: 'Comments',
              oldValue: oldValue,
              newValue: newValue,
              changeType: 'replacement'
            });
          }
          
        } else {
          // This is a full comment replacement or first comment
          const changeType = normalizedOld.length === 0 ? 'addition' : 'replacement';
          
          changes.push({
            field: changeType === 'addition' ? 'Comment Added' : 'Comments',
            oldValue: changeType === 'addition' ? '' : oldValue,
            newValue: newValue,
            changeType: changeType
          });
          
          console.log('📝 Comment change detected:', changeType, '- Length check:', normalizedOld.length, '->', normalizedNew.length);
        }
      }
    }
    
    // Update category if provided
    if (params.category !== undefined && columnMap['Category'] !== undefined) {
      const oldValue = currentRow[columnMap['Category']];
      if (oldValue !== params.category) {
        faultLogSheet.getRange(rowNum, columnMap['Category'] + 1).setValue(params.category);
        updates.push(`Category: ${params.category}`);
        
        // Update currentRow to reflect the change
        currentRow[columnMap['Category']] = params.category;
        
        changes.push({
          field: 'Category',
          oldValue: oldValue,
          newValue: params.category
        });
      }
    }
    
    // Update sub-category if provided
    if (params.subCategory !== undefined && columnMap['Sub-Category'] !== undefined) {
      const oldValue = currentRow[columnMap['Sub-Category']];
      if (oldValue !== params.subCategory) {
        faultLogSheet.getRange(rowNum, columnMap['Sub-Category'] + 1).setValue(params.subCategory);
        updates.push(`Sub-Category: ${params.subCategory}`);
        
        // Update currentRow to reflect the change
        currentRow[columnMap['Sub-Category']] = params.subCategory;
        
        changes.push({
          field: 'Sub-Category',
          oldValue: oldValue,
          newValue: params.subCategory
        });
      }
    }
    
    // Update assigned to if provided
    if (params.assignedTo !== undefined && columnMap['Assigned To'] !== undefined) {
      const oldValue = currentRow[columnMap['Assigned To']];
      if (oldValue !== params.assignedTo) {
        faultLogSheet.getRange(rowNum, columnMap['Assigned To'] + 1).setValue(params.assignedTo);
        updates.push(`Assigned To: ${params.assignedTo}`);
        
        // Update currentRow to reflect the change
        currentRow[columnMap['Assigned To']] = params.assignedTo;
        
        changes.push({
          field: 'Assigned To',
          oldValue: oldValue,
          newValue: params.assignedTo
        });
      }
    }
    
    // Update completion date if manually provided (and not auto-filled)
    if (params.completionDate !== undefined && columnMap['Completion Date'] !== undefined && !isBecomingCompleted) {
      const oldValue = currentRow[columnMap['Completion Date']];
      if (oldValue !== params.completionDate) {
        faultLogSheet.getRange(rowNum, columnMap['Completion Date'] + 1).setValue(params.completionDate);
        updates.push(`Completion Date: ${params.completionDate}`);
        
        // Update currentRow to reflect the change
        currentRow[columnMap['Completion Date']] = params.completionDate;
        
        changes.push({
          field: 'Completion Date',
          oldValue: oldValue,
          newValue: params.completionDate
        });
      }
    }
    
    // V2.4: Add activity log entry if there were changes
    if (changes.length > 0 && columnMap['ActivityLog'] !== undefined) {
      const currentActivityLog = currentRow[columnMap['ActivityLog']] || '[]';
      let activityArray;
      
      try {
        activityArray = JSON.parse(currentActivityLog);
      } catch (e) {
        activityArray = [];
      }
      
      // Add new activity entry
      const activityEntry = {
        timestamp: new Date().toISOString(),
        user: params.user || 'SYSTEM',
        action: 'Updated',
        changes: changes
      };
      
      activityArray.push(activityEntry);
      
      // Keep only last 50 entries
      if (activityArray.length > 50) {
        activityArray = activityArray.slice(-50);
      }
      
      const newActivityLog = JSON.stringify(activityArray);
      faultLogSheet.getRange(rowNum, columnMap['ActivityLog'] + 1).setValue(newActivityLog);
      
      // Update currentRow to reflect the change
      currentRow[columnMap['ActivityLog']] = newActivityLog;
      
      console.log('📜 Activity logged:', activityEntry);
    }
    
    // V2.4: Update last action tracking
    if (columnMap['LastActionBy'] !== undefined) {
      faultLogSheet.getRange(rowNum, columnMap['LastActionBy'] + 1).setValue(params.user || 'SYSTEM');
      currentRow[columnMap['LastActionBy']] = params.user || 'SYSTEM';
    }
    
    if (columnMap['LastActionTime'] !== undefined) {
      const now = new Date();
      faultLogSheet.getRange(rowNum, columnMap['LastActionTime'] + 1).setValue(now);
      currentRow[columnMap['LastActionTime']] = now;
    }
    
    // Always update last modified timestamp - PRESERVED FROM V2.3
    if (columnMap['Last Updated'] !== undefined) {
      const now = new Date();
      faultLogSheet.getRange(rowNum, columnMap['Last Updated'] + 1).setValue(now);
      updates.push(`Last Updated: ${now.toISOString()}`);
      
      // Update currentRow to reflect the change
      currentRow[columnMap['Last Updated']] = now;
    }
    
    console.log('📝 Updates applied:', updates);
    console.log('📊 Changes detected:', changes.length);
    
    // Force save
    SpreadsheetApp.flush();
    
    return {
      success: true,
      message: 'Problem updated successfully',
      updates: updates,
      activityLogged: changes.length > 0,
      changesCount: changes.length
    };
    
  } catch (error) {
    console.error('❌ Error updating problem:', error);
    return { 
      success: false, 
      error: error.toString(),
      message: 'Failed to update problem'
    };
  }
}


/**
 * =====================================================================
 * MINIMAL FIX: DROPDOWN OPTIONS LOADING - ONLY SHEET NAME CHANGED
 * =====================================================================
 * CHANGE: ONLY changed "Maintenance" to "Dropdowns" - nothing else!
 */
function getDropdownOptions() {
  try {
    console.log('🎛️ Loading dropdown options from DROPDOWNS TAB...');
    console.log('Using Sheet ID:', HOLDEN_SHEET_ID);
    
    const spreadsheet = SpreadsheetApp.openById(HOLDEN_SHEET_ID);
    
    // Get all sheets for debugging
    const allSheets = spreadsheet.getSheets();
    const sheetNames = allSheets.map(sheet => sheet.getName());
    console.log('📋 Available sheets:', sheetNames);
    
    // 🔄 ONLY CHANGE: "Maintenance" → "Dropdowns"
    const maintenanceSheet = spreadsheet.getSheetByName('Dropdowns');
    
    if (!maintenanceSheet) {
      console.error('❌ Dropdowns sheet not found in sheets:', sheetNames);
      return {
        success: false,
        error: 'Dropdowns sheet not found. Available sheets: ' + sheetNames.join(', ')
      };
    }
    
    console.log('✅ Dropdowns sheet found');
    
    // Read data from Dropdowns sheet  
    const data = maintenanceSheet.getDataRange().getValues();
    console.log('✅ Data read from Dropdowns sheet:', data.length, 'rows');
    
    const dropdownData = {
      categories: [],
      subCategories: [],
      priorities: [],
      statuses: [],
      assignedTo: []
    };
    
    // Process each row (skip header if present) - UNCHANGED FROM BASELINE
    for (let i = 1; i < data.length; i++) {
      const type = data[i][0]; // Column A: Type
      const value = data[i][1]; // Column B: Value
      
      if (!type || !value) continue;
      
      console.log(`Processing row ${i}: Type="${type}", Value="${value}"`);
      
      if (type === 'Category') {
        dropdownData.categories.push(value);
      } else if (type === 'Sub-Category') {
        dropdownData.subCategories.push(value);
      } else if (type === 'Priority') {
        dropdownData.priorities.push(value);
      } else if (type === 'Status') {
        dropdownData.statuses.push(value);
      } else if (type === 'Assigned To') {
        dropdownData.assignedTo.push(value);
      }
    }
    
    console.log('✅ Dropdown options processed:', {
      categories: dropdownData.categories.length,
      subCategories: dropdownData.subCategories.length,
      priorities: dropdownData.priorities.length,
      statuses: dropdownData.statuses.length,
      assignedTo: dropdownData.assignedTo.length
    });
    
    return {
      success: true,
      data: dropdownData
    };
    
  } catch (error) {
    console.error('❌ Error in getDropdownOptions:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}


function sendCompletionNotification(problemData) {
  console.log('🔧 Sending completion notification for:', problemData.internalId);
  
  const friendlyPID = getFriendlyPID(problemData.internalId);
  
  // IMPROVED RECIPIENT LOGIC - Multiple recipients based on business rules
  const recipients = [];
  
  // Add unit primary email (if exists)
  if (problemData.unitPrimaryEmail && problemData.unitPrimaryEmail.trim() !== '') {
    recipients.push(problemData.unitPrimaryEmail.trim());
    console.log('🔧 Added Unit Primary Email:', problemData.unitPrimaryEmail);
  }
  
  // Add zone rep email (if exists) 
  const zoneRepEmail = getZoneRepEmail(problemData.zone);
  if (zoneRepEmail && zoneRepEmail.trim() !== '') {
    recipients.push(zoneRepEmail.trim());
    console.log('🔧 Added Zone Rep Email:', zoneRepEmail);
  }
  
  // Add reporter email ONLY if reporter is different from unit primary
  const reporterIsDifferent = problemData.reportedBy !== problemData.unitPrimaryName;
  if (reporterIsDifferent && problemData.reporterEmail && problemData.reporterEmail.trim() !== '') {
    if (problemData.reporterEmail !== problemData.unitPrimaryEmail) {
      recipients.push(problemData.reporterEmail.trim());
      console.log('🔧 Added Reporter Email:', problemData.reporterEmail);
    }
  }
  
  // Remove duplicates and ensure we have recipients
  const uniqueRecipients = [...new Set(recipients)];
  if (uniqueRecipients.length === 0) {
    console.error('❌ No email recipients found');
    throw new Error('No email recipient found for notification');
  }
  
  const recipientEmail = uniqueRecipients.join(', ');
  const recipientType = `${uniqueRecipients.length} recipient(s)`;
  console.log('🔧 Final recipients:', recipientEmail);
  
  // Generate email content - PRESERVED V2.3 FORMAT
  const subject = `Problem Completed - ${friendlyPID} - ${problemData.unitNumber}`;
  
  const emailBody = `
Good news! The maintenance request for ${problemData.unitNumber} has been completed.

Problem Details:
• Problem ID: ${friendlyPID}
• Unit: ${problemData.unitNumber}
• Description: ${problemData.problemDescription}
• Completed Date: ${problemData.completionDate}

The issue has been resolved by our maintenance team.

Should you have any queries regarding this problem, please contact our Maintenance team.

Thank you for your patience.

---
Lake Illawong Maintenance Team
`.trim();
  
  // Send the email
  try {
    MailApp.sendEmail({
      to: recipientEmail,
      subject: subject,
      body: emailBody
    });
    
    console.log(`✅ Completion notification sent to ${recipientType}: ${recipientEmail}`);
    
  } catch (emailError) {
    console.error('❌ Failed to send completion email:', emailError);
    throw emailError;
  }
}

function getZoneRepEmail(zone) {
  console.log(`🔍 Looking for zone rep email for zone: "${zone}"`);
  
  if (!zone) {
    console.log('❌ No zone provided');
    return null;
  }
  
  try {
    const spreadsheet = SpreadsheetApp.openById(HOLDEN_SHEET_ID);
    const namedRange = spreadsheet.getRangeByName('ZoneRepEmailList');
    
    if (!namedRange) {
      console.error('❌ ZoneRepEmailList named range not found');
      return null;
    }
    
    console.log('✅ Found ZoneRepEmailList named range');
    const zoneData = namedRange.getValues();
    
    console.log(`🔍 Zone data has ${zoneData.length} rows`);
    
    // Find the zone in the named range - PRESERVED V2.3 CORRECT 3-COLUMN STRUCTURE
    for (let i = 0; i < zoneData.length; i++) {
      const rowZone = zoneData[i][0];  // Column A - Zone
      const name = zoneData[i][1];     // Column B - Name
      const email = zoneData[i][2];    // Column C - Email ✅ CORRECT!
      
      console.log(`🔍 Row ${i}: "${rowZone}" === "${zone}"? Name: ${name}, Email: ${email}`);
      
      if (rowZone === zone && email) {
        console.log(`✅ Found zone rep email for ${zone}: ${email}`);
        return email;
      }
    }
    
    console.log(`❌ No zone rep email found for zone: ${zone}`);
    return null;
    
  } catch (error) {
    console.error('❌ Error looking up zone rep email:', error);
    return null;
  }
}

/**
 * Convert internal ID to friendly PID format - PRESERVED V2.3
 */
function getFriendlyPID(internalId) {
  if (!internalId) return 'PID Unknown';
  const parts = internalId.split('-');
  return parts.length === 2 ? `PID ${parts[1]}` : `PID ${internalId}`;
}

function addDropdownItem(params) {
  try {
    const type = params.type;
    const value = params.value;
    
    console.log('📝 Adding dropdown item to Maintenance tab:', type, '=', value);
    
    if (!type || !value) {
      return { success: false, message: 'Type and value are required' };
    }
    
    // Validate type for Maintenance tab
    const validTypes = ['Status', 'Priority', 'Category', 'Sub-Category', 'Assigned To'];
    if (!validTypes.includes(type)) {
      return { success: false, message: `Invalid type. Must be one of: ${validTypes.join(', ')}` };
    }
    
    const sheet = SpreadsheetApp.openById(HOLDEN_SHEET_ID);
    const maintenanceSheet = sheet.getSheetByName('Maintenance');
    
    if (!maintenanceSheet) {
      return { success: false, message: 'Maintenance sheet not found' };
    }
    
    const data = maintenanceSheet.getDataRange().getValues();
    
    // Check for duplicates
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === type && data[i][1] === value) {
        return { success: false, message: `"${value}" already exists in ${type}` };
      }
    }
    
    // Add the new item
    const lastRow = maintenanceSheet.getLastRow();
    maintenanceSheet.getRange(lastRow + 1, 1, 1, 2).setValues([[type, value]]);
    
    console.log(`✅ Added "${value}" to ${type}`);
    
    // Re-sort the data
    sortMaintenanceData(sheet);
    
    SpreadsheetApp.flush();
    
    return {
      success: true,
      message: `Added "${value}" to ${type} and sorted`
    };
    
  } catch (error) {
    console.error('❌ Error adding dropdown item:', error);
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to add dropdown item'
    };
  }
}

function updateDropdownItem(params) {
  try {
    const type = params.type;
    const oldValue = params.oldValue;
    const newValue = params.newValue;
    
    console.log(`📝 Updating dropdown item: ${type} "${oldValue}" → "${newValue}"`);
    
    if (!type || !oldValue || !newValue) {
      return { success: false, message: 'Type, oldValue, and newValue are required' };
    }
    
    const validTypes = ['Status', 'Priority', 'Category', 'Sub-Category', 'Assigned To'];
    if (!validTypes.includes(type)) {
      return { success: false, message: `Invalid type. Must be one of: ${validTypes.join(', ')}` };
    }
    
    const sheet = SpreadsheetApp.openById(HOLDEN_SHEET_ID);
    const maintenanceSheet = sheet.getSheetByName('Maintenance');
    
    if (!maintenanceSheet) {
      return { success: false, message: 'Maintenance sheet not found' };
    }
    
    const data = maintenanceSheet.getDataRange().getValues();
    
    // Check if new value already exists (and it's different from old value)
    if (oldValue !== newValue) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === type && data[i][1] === newValue) {
          return { success: false, message: `"${newValue}" already exists in ${type}` };
        }
      }
    }
    
    // Find and update the item
    let updated = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === type && data[i][1] === oldValue) {
        maintenanceSheet.getRange(i + 1, 2).setValue(newValue);
        updated = true;
        break;
      }
    }
    
    if (!updated) {
      return { success: false, message: `"${oldValue}" not found in ${type}` };
    }
    
    console.log(`✅ Updated "${oldValue}" to "${newValue}" in ${type}`);
    
    // Re-sort the data
    sortMaintenanceData(sheet);
    
    SpreadsheetApp.flush();
    
    return {
      success: true,
      message: `Updated "${oldValue}" to "${newValue}" in ${type}`
    };
    
  } catch (error) {
    console.error('❌ Error updating dropdown item:', error);
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to update dropdown item'
    };
  }
}

function deleteDropdownItem(params) {
  try {
    const type = params.type;
    const value = params.value;
    
    console.log(`🗑️ Deleting dropdown item: ${type} "${value}"`);
    
    if (!type || !value) {
      return { success: false, message: 'Type and value are required' };
    }
    
    const validTypes = ['Status', 'Priority', 'Category', 'Sub-Category', 'Assigned To'];
    if (!validTypes.includes(type)) {
      return { success: false, message: `Invalid type. Must be one of: ${validTypes.join(', ')}` };
    }
    
    const sheet = SpreadsheetApp.openById(HOLDEN_SHEET_ID);
    const maintenanceSheet = sheet.getSheetByName('Maintenance');
    
    if (!maintenanceSheet) {
      return { success: false, message: 'Maintenance sheet not found' };
    }
    
    const data = maintenanceSheet.getDataRange().getValues();
    
    // Find and delete the item
    let deleted = false;
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][0] === type && data[i][1] === value) {
        maintenanceSheet.deleteRow(i + 1);
        deleted = true;
        console.log(`✅ Deleted row ${i + 1}: ${type} = ${value}`);
        break;
      }
    }
    
    if (!deleted) {
      return { success: false, message: `"${value}" not found in ${type}` };
    }
    
    console.log(`✅ Deleted "${value}" from ${type}`);
    
    SpreadsheetApp.flush();
    
    return {
      success: true,
      message: `Deleted "${value}" from ${type}`
    };
    
  } catch (error) {
    console.error('❌ Error deleting dropdown item:', error);
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to delete dropdown item'
    };
  }
}

/**
 * SORT MAINTENANCE DATA - 
 */
function sortMaintenanceData(sheet) {
  try {
    console.log('🔄 Sorting Maintenance tab data...');
    
    const maintenanceSheet = sheet.getSheetByName('Maintenance');
    const data = maintenanceSheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      console.log('⚠️ No data to sort');
      return;
    }
    
    const headers = data[0];
    const dataRows = data.slice(1);
    
    // Group by type
    const grouped = {};
    dataRows.forEach(row => {
      const type = row[0];
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(row);
    });
    
    // Sort each group
    Object.keys(grouped).forEach(type => {
      if (type === 'Priority') {
        grouped[type] = grouped[type].sort((a, b) => {
          const order = ['Low', 'Medium', 'High', 'Urgent'];
          return order.indexOf(a[1]) - order.indexOf(b[1]);
        });
      } else if (type === 'Status') {
        grouped[type] = grouped[type].sort((a, b) => {
          const order = ['Reported', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];
          return order.indexOf(a[1]) - order.indexOf(b[1]);
        });
      } else if (type === 'Assigned To') {
        grouped[type] = grouped[type].sort((a, b) => {
          const aSurname = a[1].split(' ').pop();
          const bSurname = b[1].split(' ').pop();
          return aSurname.localeCompare(bSurname);
        });
      } else {
        grouped[type] = grouped[type].sort((a, b) => a[1].localeCompare(b[1]));
      }
    });
    
    // Reconstruct sorted data
    const sortedData = [headers];
    const typeOrder = ['Status', 'Priority', 'Category', 'Sub-Category', 'Assigned To'];
    
    typeOrder.forEach(type => {
      if (grouped[type]) {
        sortedData.push(...grouped[type]);
      }
    });
    
    // Add any other types not in the standard order
    Object.keys(grouped).forEach(type => {
      if (!typeOrder.includes(type)) {
        sortedData.push(...grouped[type]);
      }
    });
    
    // Clear and repopulate sheet
    maintenanceSheet.clear();
    if (sortedData.length > 0) {
      maintenanceSheet.getRange(1, 1, sortedData.length, sortedData[0].length).setValues(sortedData);
    }
    
    console.log('✅ Maintenance data sorted successfully');
    
  } catch (error) {
    console.error('❌ Error sorting maintenance data:', error);
  }
}


/**
 * GET NAMED RANGE DATA - WITH 3-COLUMN SUPPORT
 */
function getNamedRangeData(rangeName) {
  try {
    console.log(`📋 Loading data from named range: ${rangeName}`);
    
    const sheet = SpreadsheetApp.openById(HOLDEN_SHEET_ID);
    const namedRange = sheet.getRangeByName(rangeName);
    
    if (!namedRange) {
      console.error(`❌ Named range '${rangeName}' not found`);
      return {
        success: false,
        error: `Named range '${rangeName}' not found`
      };
    }
    
    const values = namedRange.getValues();
    console.log(`✅ Retrieved ${values.length} rows from ${rangeName}`);
    
    // Convert to objects for easier frontend handling - PRESERVED V2.3 LOGIC
    const data = values.map((row, index) => {
      if (rangeName === 'MtceTeamEmailList') {
        return {
          rowIndex: index,
          name: row[0] || '',
          email: row[1] || ''
        };
      } 
      else if (rangeName === 'ZoneRepEmailList') {
        return {
          rowIndex: index,
          zone: row[0] || '',
          name: row[1] || '',     // NEW: Name column
          email: row[2] || ''     // MOVED: Email to column 3
        };
      }
      else {
        // Generic handling for any other named ranges
        return {
          rowIndex: index,
          col1: row[0] || '',
          col2: row[1] || '',
          col3: row[2] || ''
        };
      }
    });
    
    return {
      success: true,
      data: data,
      rangeName: rangeName,
      totalRows: values.length
    };
    
  } catch (error) {
    console.error(`❌ Error getting named range data for ${rangeName}:`, error);
    return {
      success: false,
      error: error.toString(),
      message: `Failed to load ${rangeName} data`
    };
  }
}

/**
 * UPDATE NAMED RANGE CELL 
 */
function updateNamedRangeCell(params) {
  try {
    const { rangeName, row, col, value } = params;
    console.log(`✏️ Updating ${rangeName} row ${row}, col ${col} to: "${value}"`);
    
    const sheet = SpreadsheetApp.openById(HOLDEN_SHEET_ID);
    const namedRange = sheet.getRangeByName(rangeName);
    
    if (!namedRange) {
      return {
        success: false,
        error: `Named range '${rangeName}' not found`
      };
    }
    
    // Get the specific cell within the named range
    const targetCell = namedRange.getCell(parseInt(row) + 1, parseInt(col) + 1);
    targetCell.setValue(value);
    
    console.log(`✅ Successfully updated ${rangeName}`);
    
    // Force save
    SpreadsheetApp.flush();
    
    return {
      success: true,
      message: `Updated ${rangeName} successfully`,
      updatedValue: value
    };
    
  } catch (error) {
    console.error('❌ Error updating named range cell:', error);
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to update named range'
    };
  }
}

/**
 * UPDATE NAMED RANGE ROW - WITH 3-COLUMN SUPPORT
 */
function updateNamedRangeRow(params) {
  try {
    const { rangeName, row, name, email, zone } = params;
    const rowIndex = parseInt(row);
    console.log(`✏️ Updating entire row ${rowIndex} in ${rangeName}`);
    
    const sheet = SpreadsheetApp.openById(HOLDEN_SHEET_ID);
    const namedRange = sheet.getRangeByName(rangeName);
    
    if (!namedRange) {
      return {
        success: false,
        error: `Named range '${rangeName}' not found`
      };
    }
    
    // Determine row data based on range type - PRESERVED V2.3 LOGIC
    let rowData;
    if (rangeName === 'MtceTeamEmailList') {
      rowData = [name || '', email || ''];
    } else if (rangeName === 'ZoneRepEmailList') {
      rowData = [zone || '', name || '', email || ''];  // PRESERVED: All 3 columns!
    } else {
      rowData = [name || zone || '', email || ''];
    }
    
    // Update the specific row
    const targetRow = namedRange.getCell(rowIndex + 1, 1).getRow();
    const targetSheet = namedRange.getSheet();
    const startCol = namedRange.getColumn();
    
    const rowRange = targetSheet.getRange(targetRow, startCol, 1, rowData.length);
    rowRange.setValues([rowData]);
    
    console.log(`✅ Successfully updated row in ${rangeName}`);
    
    // Force save
    SpreadsheetApp.flush();
    
    return {
      success: true,
      message: `Updated ${rangeName} row successfully`,
      updatedData: rowData
    };
    
  } catch (error) {
    console.error('❌ Error updating named range row:', error);
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to update row'
    };
  }
}

/**
 * ADD NAMED RANGE ROW - WITH 3-COLUMN SUPPORT
 */
function addNamedRangeRow(params) {
  try {
    const { rangeName, name, email, zone } = params;
    console.log(`➕ Adding new row to ${rangeName}`);
    
    const sheet = SpreadsheetApp.openById(HOLDEN_SHEET_ID);
    const namedRange = sheet.getRangeByName(rangeName);
    
    if (!namedRange) {
      return {
        success: false,
        error: `Named range '${rangeName}' not found`
      };
    }
    
    // Get the sheet and range info
    const targetSheet = namedRange.getSheet();
    const lastRow = namedRange.getLastRow();
    const startCol = namedRange.getColumn();
    
    // Determine what to add based on range type - PRESERVED V2.3 LOGIC
    let newRowData;
    if (rangeName === 'MtceTeamEmailList') {
      newRowData = [name || '', email || ''];
    } else if (rangeName === 'ZoneRepEmailList') {
      newRowData = [zone || '', name || '', email || ''];  // PRESERVED: All 3 columns!
    } else {
      // Generic 2-column handling
      newRowData = [name || zone || '', email || ''];
    }
    
    console.log('Adding row data:', newRowData);
    
    // Add the new row right after the current range
    const newRowRange = targetSheet.getRange(lastRow + 1, startCol, 1, newRowData.length);
    newRowRange.setValues([newRowData]);
    
    // Expand the named range to include the new row
    const expandedRange = targetSheet.getRange(
      namedRange.getRow(), 
      namedRange.getColumn(),
      namedRange.getNumRows() + 1,
      namedRange.getNumColumns()
    );
    
    // Update the named range definition
    sheet.setNamedRange(rangeName, expandedRange);
    
    console.log(`✅ Successfully added row to ${rangeName}`);
    
    // Force save
    SpreadsheetApp.flush();
    
    return {
      success: true,
      message: `Added new entry to ${rangeName}`,
      newRowData: newRowData
    };
    
  } catch (error) {
    console.error('❌ Error adding named range row:', error);
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to add new row'
    };
  }
}

/**
 * DELETE NAMED RANGE ROW 
 */
function deleteNamedRangeRow(params) {
  try {
    const { rangeName, row } = params;
    const rowIndex = parseInt(row);
    console.log(`🗑️ Deleting row ${rowIndex} from ${rangeName}`);
    
    const sheet = SpreadsheetApp.openById(HOLDEN_SHEET_ID);
    const namedRange = sheet.getRangeByName(rangeName);
    
    if (!namedRange) {
      return {
        success: false,
        error: `Named range '${rangeName}' not found`
      };
    }
    
    // Calculate the actual sheet row number
    const sheetRowToDelete = namedRange.getRow() + rowIndex;
    const targetSheet = namedRange.getSheet();
    
    console.log(`🗑️ Deleting sheet row ${sheetRowToDelete}`);
    
    // Delete the row from the sheet
    targetSheet.deleteRow(sheetRowToDelete);
    
    // Update the named range to reflect the deletion
    const newRange = targetSheet.getRange(
      namedRange.getRow(),
      namedRange.getColumn(), 
      Math.max(1, namedRange.getNumRows() - 1), // At least 1 row
      namedRange.getNumColumns()
    );
    
    sheet.setNamedRange(rangeName, newRange);
    
    console.log(`✅ Successfully deleted row from ${rangeName}`);
    
    // Force save
    SpreadsheetApp.flush();
    
    return {
      success: true,
      message: `Deleted row from ${rangeName}`
    };
    
  } catch (error) {
    console.error('❌ Error deleting named range row:', error);
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to delete row'
    };
  }
}

/**
 * =====================================================================
 * USER AUTHENTICATION SYSTEM -REDUNDANT AS OF 10/09/2025
 * =====================================================================
 */

/**
 * Initialize UserAccounts sheet if it doesn't exist
 */
function initializeUserAccounts() {
  try {
    const sheet = SpreadsheetApp.openById(_SHEET_ID);
    let userSheet = sheet.getSheetByName('UserAccounts');
    
    if (!userSheet) {
      console.log('📋 Creating UserAccounts sheet...');
      userSheet = sheet.insertSheet('UserAccounts');
      
      // Set up headers
      const headers = ['Username', 'PasswordHash', 'Email', 'Role', 'Name', 'CreatedDate', 'LastLogin', 'IsActive', 'LoginAttempts'];
      userSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Add default users
      const defaultUsers = [
        ['director', hashPassword('maint2025'), 'director@lakeillawong.com.au', 'Director', 'Director Account', new Date(), '', true, 0],
        ['team1', hashPassword('team2025'), 'team1@lakeillawong.com.au', 'Team', 'Team Member 1', new Date(), '', true, 0],
        ['team2', hashPassword('team2025'), 'team2@lakeillawong.com.au', 'Team', 'Team Member 2', new Date(), '', true, 0],
        ['committee', hashPassword('rc2025'), 'committee@lakeillawong.com.au', 'Committee', 'Residents Committee', new Date(), '', true, 0]
      ];
      
      userSheet.getRange(2, 1, defaultUsers.length, defaultUsers[0].length).setValues(defaultUsers);
      
      console.log('✅ UserAccounts sheet created with default users');
    }
    
    return userSheet;
    
  } catch (error) {
    console.error('❌ Error initializing UserAccounts:', error);
    throw error;
  }
}

/**
 * Simple password hashing
 */
function hashPassword(password) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password));
}

/**
 * Authenticate user
 */
function authenticateUser(params) {
  try {
    const username = params.username;
    const password = params.password;
    
    console.log('🔐 Authenticating user:', username);
    
    if (!username || !password) {
      return { success: false, message: 'Username and password required' };
    }
    
    const userSheet = initializeUserAccounts();
    const data = userSheet.getDataRange().getValues();
    
    // Find user
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === username && row[7] === true) { // Username match and IsActive
        const storedHash = row[1];
        const inputHash = hashPassword(password);
        
        if (storedHash === inputHash) {
          // Update last login
          userSheet.getRange(i + 1, 7).setValue(new Date());
          userSheet.getRange(i + 1, 9).setValue(0); // Reset login attempts
          
          console.log('✅ User authenticated successfully');
          
          return {
            success: true,
            user: {
              username: row[0],
              email: row[2],
              role: row[3],
              name: row[4]
            }
          };
        } else {
          // Increment login attempts
          const attempts = (row[8] || 0) + 1;
          userSheet.getRange(i + 1, 9).setValue(attempts);
          
          console.log('❌ Invalid password for user:', username);
          return { success: false, message: 'Invalid username or password' };
        }
      }
    }
    
    console.log('❌ User not found:', username);
    return { success: false, message: 'Invalid username or password' };
    
  } catch (error) {
    console.error('❌ Error authenticating user:', error);
    return {
      success: false,
      error: error.toString(),
      message: 'Authentication failed'
    };
  }
}

/**
 * Get current user info
 */
function getCurrentUser(params) {
  try {
    const username = params.username;
    
    if (!username) {
      return { success: false, message: 'Username required' };
    }
    
    const userSheet = initializeUserAccounts();
    const data = userSheet.getDataRange().getValues();
    
    // Find user
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === username && row[7] === true) {
        return {
          success: true,
          user: {
            username: row[0],
            email: row[2],
            role: row[3],
            name: row[4],
            lastLogin: row[6]
          }
        };
      }
    }
    
    return { success: false, message: 'User not found' };
    
  } catch (error) {
    console.error('❌ Error getting current user:', error);
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to get user info'
    };
  }
}

/**
 * Get list of all users
 */
function getUserList() {
  try {
    const userSheet = initializeUserAccounts();
    const data = userSheet.getDataRange().getValues();
    
    const users = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[7] === true) { // IsActive
        users.push({
          username: row[0],
          email: row[2],
          role: row[3],
          name: row[4],
          lastLogin: row[6]
        });
      }
    }
    
    return {
      success: true,
      users: users
    };
    
  } catch (error) {
    console.error('❌ Error getting user list:', error);
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to get user list'
    };
  }
}

/**
 * Get activity log for a specific problem
 */
function getActivityLog(params) {
  try {
    const internalId = params.internalId;
    
    if (!internalId) {
      return { success: false, message: 'Internal ID required' };
    }
    
    const sheet = SpreadsheetApp.openById(HOLDEN_SHEET_ID);
    const faultLogSheet = sheet.getSheetByName('FaultLog');
    
    if (!faultLogSheet) {
      return { success: false, message: 'FaultLog sheet not found' };
    }
    
    const data = faultLogSheet.getDataRange().getValues();
    const headers = data[0];
    
    const columnMap = {};
    headers.forEach((header, index) => {
      columnMap[header] = index;
    });
    
    // Find the problem
    for (let i = 1; i < data.length; i++) {
      if (data[i][columnMap['Internal ID']] === internalId) {
        const activityLogJson = data[i][columnMap['ActivityLog']] || '[]';
        
        try {
          const activityLog = JSON.parse(activityLogJson);
          return {
            success: true,
            activityLog: activityLog
          };
        } catch (e) {
          return {
            success: true,
            activityLog: []
          };
        }
      }
    }
    
    return { success: false, message: 'Problem not found' };
    
  } catch (error) {
    console.error('❌ Error getting activity log:', error);
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to get activity log'
    };
  }
}



/**
 * Create a new user
 */
function createUser(params) {
  try {
    const { username, password, email, role, name } = params;
    
    console.log('👤➕ Creating new user:', username, 'Role:', role);
    
    // Validate required fields
    if (!username || !password || !email || !role || !name) {
      return { success: false, message: 'All fields are required' };
    }
    
    // Validate password length
    if (password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' };
    }
    
    // Validate role
    const validRoles = ['Director', 'Team', 'Committee'];
    if (!validRoles.includes(role)) {
      return { success: false, message: 'Invalid role' };
    }
    
    const userSheet = initializeUserAccounts();
    const data = userSheet.getDataRange().getValues();
    
    // Check if username already exists
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === username) {
        return { success: false, message: 'Username already exists' };
      }
    }
    
    // Check if email already exists
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === email) {
        return { success: false, message: 'Email already exists' };
      }
    }
    
    // Add new user
    const newRow = [
      username,
      hashPassword(password),
      email,
      role,
      name,
      new Date(),
      '', // LastLogin
      true, // IsActive
      0 // LoginAttempts
    ];
    
    userSheet.appendRow(newRow);
    
    console.log('✅ User created successfully:', username);
    
    return {
      success: true,
      message: `User ${username} created successfully`,
      user: {
        username: username,
        email: email,
        role: role,
        name: name,
        isActive: true,
        createdDate: new Date()
      }
    };
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to create user'
    };
  }
}

/**
 * Update existing user
 */
function updateUser(params) {
  try {
    const { username, email, role, name } = params;
    
    console.log('👤✏️ Updating user:', username);
    
    // Validate required fields
    if (!username || !email || !role || !name) {
      return { success: false, message: 'All fields are required' };
    }
    
    // Validate role
    const validRoles = ['Director', 'Team', 'Committee'];
    if (!validRoles.includes(role)) {
      return { success: false, message: 'Invalid role' };
    }
    
    const userSheet = initializeUserAccounts();
    const data = userSheet.getDataRange().getValues();
    
    // Find user row
    let userRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === username) {
        userRowIndex = i + 1; // Google Sheets is 1-indexed
        break;
      }
    }
    
    if (userRowIndex === -1) {
      return { success: false, message: 'User not found' };
    }
    
    // Check if email already exists (for other users)
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === email && data[i][0] !== username) {
        return { success: false, message: 'Email already exists for another user' };
      }
    }
    
    // Update user fields
    userSheet.getRange(userRowIndex, 3).setValue(email); // Column C: Email
    userSheet.getRange(userRowIndex, 4).setValue(role);  // Column D: Role
    userSheet.getRange(userRowIndex, 5).setValue(name);  // Column E: Name
    
    console.log('✅ User updated successfully:', username);
    
    return {
      success: true,
      message: `User ${username} updated successfully`,
      user: {
        username: username,
        email: email,
        role: role,
        name: name
      }
    };
    
  } catch (error) {
    console.error('❌ Error updating user:', error);
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to update user'
    };
  }
}

/**
 * Delete user (protect director account)
 */
function deleteUser(params) {
  try {
    const { username } = params;
    
    console.log('👤🗑️ Deleting user:', username);
    
    if (!username) {
      return { success: false, message: 'Username is required' };
    }
    
    // Protect director account
    if (username === 'director') {
      return { success: false, message: 'Cannot delete director account' };
    }
    
    const userSheet = initializeUserAccounts();
    const data = userSheet.getDataRange().getValues();
    
    // Find user row
    let userRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === username) {
        userRowIndex = i + 1; // Google Sheets is 1-indexed
        break;
      }
    }
    
    if (userRowIndex === -1) {
      return { success: false, message: 'User not found' };
    }
    
    // Delete the row
    userSheet.deleteRow(userRowIndex);
    
    console.log('✅ User deleted successfully:', username);
    
    return {
      success: true,
      message: `User ${username} deleted successfully`
    };
    
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to delete user'
    };
  }
}

/**
 * Reset user password
 */
function resetUserPassword(params) {
  try {
    const { username } = params;
    
    console.log('👤🔑 Resetting password for user:', username);
    
    if (!username) {
      return { success: false, message: 'Username is required' };
    }
    
    const userSheet = initializeUserAccounts();
    const data = userSheet.getDataRange().getValues();
    
    // Find user row
    let userRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === username) {
        userRowIndex = i + 1; // Google Sheets is 1-indexed
        break;
      }
    }
    
    if (userRowIndex === -1) {
      return { success: false, message: 'User not found' };
    }
    
    // Generate temporary password
    const tempPassword = generateTempPassword();
    const hashedPassword = hashPassword(tempPassword);
    
    // Update password and reset login attempts
    userSheet.getRange(userRowIndex, 2).setValue(hashedPassword); // Column B: PasswordHash
    userSheet.getRange(userRowIndex, 9).setValue(0); // Column I: LoginAttempts
    
    console.log('✅ Password reset successfully for user:', username);
    
    return {
      success: true,
      message: `Password reset successfully for ${username}`,
      tempPassword: tempPassword
    };
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to reset password'
    };
  }
}

/**
 * Toggle user active status
 */
function toggleUserStatus(params) {
  try {
    const { username, currentStatus } = params;
    
    console.log('👤⏯️ Toggling status for user:', username, 'Current:', currentStatus);
    
    if (!username || currentStatus === undefined) {
      return { success: false, message: 'Username and current status are required' };
    }
    
    // Protect director account
    if (username === 'director' && currentStatus === true) {
      return { success: false, message: 'Cannot disable director account' };
    }
    
    const userSheet = initializeUserAccounts();
    const data = userSheet.getDataRange().getValues();
    
    // Find user row
    let userRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === username) {
        userRowIndex = i + 1; // Google Sheets is 1-indexed
        break;
      }
    }
    
    if (userRowIndex === -1) {
      return { success: false, message: 'User not found' };
    }
    
    // Toggle status
    const newStatus = !currentStatus;
    userSheet.getRange(userRowIndex, 8).setValue(newStatus); // Column H: IsActive
    
    console.log('✅ User status toggled successfully:', username, 'New status:', newStatus);
    
    return {
      success: true,
      message: `User ${username} ${newStatus ? 'enabled' : 'disabled'} successfully`,
      newStatus: newStatus
    };
    
  } catch (error) {
    console.error('❌ Error toggling user status:', error);
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to toggle user status'
    };
  }
}

/**
 * Generate temporary password
 */
function generateTempPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}


