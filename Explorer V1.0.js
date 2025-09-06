/**
 * =====================================================================
 * Explorer V1.0 (BACKEND SCRIPT)
 * =====================================================================
 *
 * // =====================================================================
// LAKE ILLAWONG EXPLORER API - RESIDENTS DIRECTORY EXTENSION
// =====================================================================
// 📄 EXTENSION VERSION: V1.1.0 (Residents Directory Support)
// 🆕 NEW FUNCTIONALITY: UnitList-based residents directory search
// 📅 ADDED: August 2025
// 🎯 PURPOSE: Safe extension to existing Explorer API for contact directory
// 
// 📊 NEW BACKEND VERSION HISTORY ENTRY:
// • v1.1.0 (Aug 2025): Added residents directory support (UnitList integration)
//   - New getResidents() function for contact directory searches
//   - Column J (Stage) and Column K (Role Tags) support  
//   - Stage 1/Stage 2 address generation capability
//   - Enhanced search functionality for residents, management, committees
//   - Zero impact on existing Explorer API functionality
//
// 🎯 API ENDPOINTS ADDED:
// • **getResidents**: Load all residents from UnitList (Columns A, B, C, D, J, K)
//
// 📄 NEW DATA STRUCTURE MAPPING:
// **UNITLIST COLUMNS** - Enhanced for directory support:
// • A(0): Unit Number               • J(9): Stage (Stage 1/Stage 2)
// • B(1): Resident Name             • K(10): Role Tags (Resident,Director,etc)
// • C(2): Email Address            
// • D(3): Phone Number             
//
// 🔗 FRONTEND INTEGRATION:
// • **residents-directory.html**: Primary consumer for directory searches
// • **residents-portal.html**: Integration point for directory access
// • **Standalone module**: Opens in separate tab (no navigation dependencies)
//
// ⚠️ SAFETY GUARANTEE:
// • **Zero impact** on existing Explorer API functions
// • **Read-only access** to UnitList tab (no data modification)
// • **Non-disruptive extension** - existing functionality unchanged
// • **Independent operation** - directory functions isolated from analytics
//
// Add this to your existing Explorer API Google Apps Script
// Safe, non-disruptive extension for residents directory search

// Add this new function to handle directory searches
 * 📄 WORKFLOW PROCESS:
 * 1. **Before ANY change**: Copy current script to backup version
 * 2. **Make change**: Update the Google Apps Script 
 * 3. **Update header**: Increment version, add to VERSION HISTORY
 * 4. **Document change**: Note what was modified
 * 5. **Redeploy**: Publish new web app version
 * 6. **Update frontend URLs**: If major version change
 *
 * 🎯 VERSION NUMBERING:
 * • **Restarted  V1.0 3 Sept 2025
 *
 * 📋 SCRIPT INFORMATION:
 * • Script Name: Explorer
 * • System: Lake Illawong Maintenance Portal (Production)
 * • Component Type: Read-Only Analytics Backend API for Data Exploration
 * • **BACKEND SCRIPT VERSION: V1.0.0** (This Google Apps Script version)
 * • **FRONTEND INTEGRATION**: holden-desktop-explorer.html, holden-mobile-explorer.html, index.html
 * • Status: ✅ PRODUCTION READY - Read-only analytics backend for data exploration
 * • Created: August 2025
 * • Last Modified: August 15, 2025
 * • Backup Location: Google Apps Script Version History + Drive Backups
 *
 * 📊 BACKEND VERSION HISTORY: - this is history
 * • v1.0.0 (Aug 15, 2025): Initial read-only analytics API with desktop/mobile support
 * • v0.9.x: Development versions with analytics functions testing
 * • v0.8.x: Initial data loading architecture from Maintenance Portal V2.2
 * • v0.7.x: Column mapping and data structure standardization
 *
 * 🔗 SYSTEM CONNECTIONS:
 * • **CALLS**: Google Sheets API (FaultLog, LegacyLog, Maintenance tabs)
 * • **CALLED BY**: holden-desktop-explorer.html, holden-mobile-explorer.html, index.html
 * • **BASED ON**: MaintenanePortal (read-only subset)
 * • **DATA SOURCES**: Same Google Sheet as Maintenance Portal with identical structure
 * • **DIFFERS FROM MAINTENANCE API**: NO update/edit functions, analytics-focused
 *
 * 📄 BACKUP PROTOCOL:
 * • Before ANY changes: Save current version in Google Apps Script version history
 * • Document version number increment in header after changes
 * • Update deployment URL in calling frontend files if major version change
 * • Coordinate with Maintenance Portal API for shared data structure changes
 * • Independent deployment from Maintenance Portal for read-only stability
 *
 * 🎯 PRIMARY PURPOSE:
 * Read-only analytics backend specifically designed for the Problem Data Explorer
 * portals (desktop and mobile versions). Provides optimized data loading, pre-calculated
 * analytics, legacy data access, and dropdown options without any data modification
 * capabilities. Serves as the analytical layer for problem data visualization,
 * reporting, and business intelligence while maintaining complete separation from
 * data modification operations in the Maintenance Portal API.
 *
 * 🔗 INTEGRATION ARCHITECTURE:
 * • **Data Loading**: Optimized read-only access to FaultLog with analytics processing
 * • **Legacy Support**: Access to historical data from LegacyLog tab (A-G structure)
 * • **Analytics Engine**: Pre-calculated statistics and metrics for dashboard display
 * • **Dropdown Sync**: Synchronized dropdown options from Maintenance tab
 * • **Performance Optimization**: Read-only operations for faster response times
 * • **Frontend Agnostic**: Serves both desktop and mobile Explorer interfaces
 *
 * ⚙️ TECHNICAL SPECIFICATIONS:
 * • Platform: Google Apps Script (Cloud-based JavaScript runtime)
 * • API Protocol: HTTP GET requests with JSONP callback support for cross-origin
 * • Authentication: Public read-only access (no authentication required)
 * • Dependencies: Google Sheets API, SpreadsheetApp (NO Gmail API needed)
 * • Data Access: Read-only operations on shared Google Sheets backend
 * • Response Format: JSON with analytics-optimized structure
 * • Cross-Origin: JSONP support for frontend integration
 * • Performance: Optimized for analytics and data visualization
 *
 * 🎨 API ENDPOINTS & ACTIONS:
 * **READ-ONLY DATA ENDPOINTS**:
 * • **getFaultLogData**: Load all current problems from FaultLog (A-S columns)
 * • **getLegacyLogData**: Load historical problems from LegacyLog (A-G columns)
 * • **getDropdownOptions**: Retrieve dropdown data from Maintenance tab
 * • **getExplorerStats**: Pre-calculated analytics and metrics for dashboard
 *
 * **ANALYTICS FUNCTIONS**:
 * • **Problem Statistics**: Total, active, completed, urgent problem counts
 * • **Completion Rates**: Percentage calculations for status analysis
 * • **Priority Analysis**: Distribution of priority levels across problems
 * • **Category Breakdown**: Problem categorization statistics
 * • **Time-based Analytics**: Trends and patterns in problem reporting
 *
 * **EXCLUDED FUNCTIONS** (Read-only API):
 * ❌ **updateProblem**: No data modification capabilities
 * ❌ **Email Functions**: No email notifications (read-only system)
 * ❌ **Admin Functions**: No dropdown management (read-only access)
 *
 * 📄 DATA STRUCTURE MAPPING:
 * **FAULTLOG COLUMNS (A-S)** - 19 columns total:
 * • A(0): Timestamp (Reported)     • J(9): Internal ID          • S(18): Reporter Phone
 * • B(1): Unit Number              • K(10): Status              
 * • C(2): Reported By (Name)       • L(11): Priority            
 * • D(3): Reporter Email           • M(12): Comments            
 * • E(4): Problem Description      • N(13): Category            
 * • F(5): Zone                     • O(14): Sub-Category        
 * • G(6): Unit Primary Name        • P(15): Assigned To         
 * • H(7): Unit Primary Email       • Q(16): Completion Date     
 * • I(8): Unit Primary Phone       • R(17): Last Updated        
 *
 * **LEGACYLOG COLUMNS (A-G)** - 7 columns total:
 * • A(0): Date                     • D(3): Location/Unit        
 * • B(1): Description              • E(4): Status               
 * • C(2): Reported By              • F(5): Priority             
 *                                  • G(6): Completion Date      
 *
 * 🚀 DEPLOYMENT STATUS: ✅ PRODUCTION READY
 * • Current State: Fully functional read-only analytics API
 * • Frontend Integration: Active with both desktop and mobile Explorer portals
 * • Data Synchronization: Real-time access to same backend as Maintenance Portal
 * • Analytics Performance: Optimized for dashboard and reporting functions
 * • Production URL: [Deployed as web app with "Anyone" access for read-only operations]
 *
 * 📋 GOOGLE SHEETS INTEGRATION:
 * • **Sheet ID**: 14u4Hl3Uluvk45ABIcgKGltX8EpBdGj1JvF_kEtZwmEE (same as Maintenance Portal)
 * • **FaultLog Tab**: Current problems (A-S columns) with complete problem data
 * • **LegacyLog Tab**: Historical problems (A-G columns) with legacy structure
 * • **Maintenance Tab**: Dropdown source for categories, status, priority options
 * • **Data Consistency**: Synchronized with Maintenance Portal backend data
 * • **Read-Only Access**: No data modification, only analytical processing
 *
 * 
 * 🔧 FRONTEND DEPENDENCIES:
 * • **DesktopExplorer.html**: Primary consumer for advanced analytics
 * • **MobileExplorer.html**: Mobile-optimized data consumption
 * • **SystemHub.html**: Dashboard statistics for landing page integration
 * • **CSV Export Functions**: Structured data for reporting and export features
 *
 * 📊 DATA SYNCHRONIZATION:
 * • **Maintenance Portal Sync**: Real-time access to same Google Sheets backend
 * • **No Data Conflicts**: Read-only operations prevent data modification issues
 * • **Schema Consistency**: Must maintain compatibility with Maintenance Portal structure
 * • **Legacy Support**: Separate LegacyLog access for historical data analysis
 *
 * 🔄 API COMPATIBILITY:
 * • **Maintenance Portal Independence**: Separate API prevents interference with data operations
 * • **Shared Data Source**: Same Google Sheets backend ensures data consistency
 * • **Version Isolation**: Independent versioning from Maintenance Portal API
 * • **Read-Only Guarantee**: No impact on Maintenance Portal data integrity
 *
 *
 * 📈 MONITORING & MAINTENANCE:
 * • **Daily**: Monitor API response times and data loading performance
 * • **Weekly**: Verify data synchronization with Maintenance Portal backend
 * • **Monthly**: Review analytics accuracy and dashboard performance metrics
 * • **Quarterly**: Optimize data processing and enhance analytical capabilities
 * • **Version Control**: Maintain deployment history for rollbacks
 * • **Performance Tracking**: Monitor read-only operation efficiency
 *
 * 🛡️ SECURITY & PERMISSIONS:
 * • **Script Execution**: Runs under owner's Google account permissions
 * • **Read-Only Access**: Google Sheets read permissions only (no write access)
 * • **Public API**: "Anyone" access for read-only analytical operations
 * • **Data Privacy**: No data modification or storage beyond Google Sheets access
 * • **Security Isolation**: Separate from Maintenance Portal data modification functions
 * • **Audit Trail**: Read-only operations logged for monitoring and debugging
 *
 * 📋 MAINTENANCE CHECKLIST:
 * ✅ Data synchronization verification with Maintenance Portal
 * ✅ Analytics accuracy validation and performance monitoring
 * ✅ API response time optimization and performance tuning
 * ✅ Frontend integration testing with desktop and mobile interfaces
 * ✅ Legacy data access testing and format validation
 * ✅ Dropdown synchronization with Maintenance Portal backend
 * ✅ Documentation updates for any changes or enhancements
 * ✅ Performance monitoring for read-only operation efficiency
 *
 * 
 * 
 * =====================================================================
 * 
 * 
 * 
 * 
 */




function getLegacyLogData() {
  try {
    console.log('📚 Reading LegacyLog sheet for historical data...');
    console.log('Using Sheet ID:', HOLDEN_EXPLORER_SHEET_ID);
    
    const sheet = SpreadsheetApp.openById(HOLDEN_EXPLORER_SHEET_ID);
    const legacySheet = sheet.getSheetByName('LegacyLog');
    
    if (!legacySheet) {
      console.log('❌ LegacyLog sheet not found');
      return { success: false, message: 'LegacyLog sheet not found' };
    }
    
    const data = legacySheet.getDataRange().getValues();
    console.log('📊 Total rows in LegacyLog:', data.length);
    
    const problems = [];
    
    // Process each data row (skip header row)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows (check Unit Number column B)
      if (!row[1]) continue;
      
      // A-G column structure for legacy data
      const problem = {
        // Core legacy data (A-G structure)
        timestamp: row[0] || '',                    // A: Date Reported
        unitNumber: row[1] || '',                   // B: Unit Number
        problemDescription: row[2] || '',           // C: Problem Description
        category: row[3] || '',                     // D: Category
        subCategory: row[4] || '',                  // E: Sub-Category
        problemPriority: row[5] || 'Medium',        // F: Priority
        zone: row[6] || '',                         // G: Zone (direct!)
        
        // Default/derived fields for UI consistency
        problemStatus: 'Completed',                 // All legacy assumed completed
        assignedTo: '',                            // Not relevant for legacy
        internalId: `LEGACY-${i}`,                 // Simple legacy ID
        reportedBy: 'Legacy Import',               // Placeholder
        reporterEmail: '',                         // Not in legacy data
        unitPrimaryName: '',                       // Not in legacy data
        unitPrimaryEmail: '',                      // Not in legacy data
        unitPrimaryPhone: '',                      // Not in legacy data
        comments: '',                              // Not in legacy data
        completionDate: row[0] || '',              // Same as reported date
        lastUpdated: row[0] || '',                 // Same as reported date
        reporterPhone: ''                          // Not in legacy data
      };
      
      problems.push(problem);
    }
    
    console.log(`✅ Loaded ${problems.length} legacy problems`);
    
    return {
      success: true,
      data: problems
    };
    
  } catch (error) {
    console.error('❌ Error loading LegacyLog:', error);
    return { 
      success: false, 
      error: error.toString(),
      message: 'Failed to load legacy problems from LegacyLog'
    };
  }
}

const HOLDEN_EXPLORER_SHEET_ID = '14u4Hl3Uluvk45ABIcgKGltX8EpBdGj1JvF_kEtZwmEE';

/**
 * WEB APP ENTRY POINT - Handles all API requests
 */
function doGet(e) {
  try {
    console.log('🔍 HOLDEN EXPLORER API V1.0 REQUEST');
    console.log('Parameters:', JSON.stringify(e.parameter));
    
    const action = e.parameter.action;
    const callback = e.parameter.callback;
    
    let result;
    
    switch (action) {
      case 'getFaultLogData':
        console.log('📊 Loading fault log data for Explorer...');
        result = getFaultLogData();
        break;
        
      case 'getDropdownOptions':
        console.log('🎛️ Loading dropdown options from Maintenance tab...');
        result = getDropdownOptions();
        break;
        
      case 'getExplorerStats':
        console.log('📈 Loading Explorer analytics...');
        result = getExplorerStats();
        break;
        
      case 'getLegacyLogData':
        console.log('📚 Loading legacy data from LegacyLog tab...');
        result = getLegacyLogData();
        break;
        
      case 'getResidents':  // NEW CASE - RESIDENTS DIRECTORY
        console.log('📞 Loading residents directory from UnitList tab...');
        result = getResidents();
        break;
        
      default:
        console.log('❌ Unknown action:', action);
        result = { success: false, message: 'Unknown action: ' + action };
    }
    
    console.log('📤 Explorer API Response:', result);
    
    // Handle JSONP callback
    if (callback) {
      return ContentService.createTextOutput(`${callback}(${JSON.stringify(result)})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('💥 EXPLORER API ERROR:', error);
    
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
 * GET DROPDOWN OPTIONS FROM MAINTENANCE TAB
 * =====================================================================
 */
function getDropdownOptions() {
  try {
    console.log('🎛️ Loading dropdown options from Dropdowns tab...');
    console.log('Using Sheet ID:', HOLDEN_EXPLORER_SHEET_ID);
    
    const spreadsheet = SpreadsheetApp.openById(HOLDEN_EXPLORER_SHEET_ID);
    
    // Get all sheets for debugging
    const allSheets = spreadsheet.getSheets();
    const sheetNames = allSheets.map(sheet => sheet.getName());
    console.log('📋 Available sheets:', sheetNames);
    
    // Get Maintenance sheet (same structure as Holden Portal)
    const maintenanceSheet = spreadsheet.getSheetByName('Dropdowns');
    
    if (!maintenanceSheet) {
      console.error('❌ Dropdowns sheet not found in sheets:', sheetNames);
      return {
        success: false,
        error: 'Dropdowns  sheet not found. Available sheets: ' + sheetNames.join(', ')
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
    
    // Process each row (skip header if present)
    // Expected format: Column A (Type) | Column B (Value)
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

/**
 * =====================================================================
 * LOAD PROBLEMS FROM FAULTLOG - SIMPLE HARDCODED COLUMN MAPPING
 * =====================================================================
 */
function getFaultLogData() {
  try {
    console.log('📖 Reading FaultLog sheet for Explorer...');
    console.log('Using Sheet ID:', HOLDEN_EXPLORER_SHEET_ID);
    
    const sheet = SpreadsheetApp.openById(HOLDEN_EXPLORER_SHEET_ID);
    const faultLogSheet = sheet.getSheetByName('FaultLog');
    
    if (!faultLogSheet) {
      console.log('❌ FaultLog sheet not found');
      return { success: false, message: 'FaultLog sheet not found' };
    }
    
    const data = faultLogSheet.getDataRange().getValues();
    console.log('📊 Total rows in FaultLog:', data.length);
    
    const problems = [];
    
    // Process each data row (skip header row)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows (check Internal ID column J)
      if (!row[9]) continue;
      
      // Simple hardcoded column mapping (A-S structure)
      const problem = {
        // Section 1: Basic Info
        timestamp: row[0] || '',                    // A: Timestamp (Reported)
        unitNumber: row[1] || '',                   // B: Unit Number
        reportedBy: row[2] || '',                   // C: Reported By (Name)
        reporterEmail: row[3] || '',                // D: Reporter Email
        problemDescription: row[4] || '',           // E: Problem Description
        zone: row[5] || '',                         // F: Zone
        
        // Section 2: Contact Info
        unitPrimaryName: row[6] || '',              // G: Unit Primary Name
        unitPrimaryEmail: row[7] || '',             // H: Unit Primary Email
        unitPrimaryPhone: row[8] || '',             // I: Unit Primary Phone
        
        // Section 3: Problem Management
        internalId: row[9] || '',                   // J: Internal ID
        problemStatus: row[10] || 'Reported',       // K: Status
        problemPriority: row[11] || 'Medium',       // L: Priority
        comments: row[12] || '',                    // M: Comments
        category: row[13] || '',                    // N: Category
        subCategory: row[14] || '',                 // O: Sub-Category
        assignedTo: row[15] || '',                  // P: Assigned To
        
        // Section 4: Completion & Tracking
        completionDate: row[16] || '',              // Q: Completion Date
        lastUpdated: row[17] || '',                 // R: Last Updated
        reporterPhone: row[18] || ''                // S: Reporter Phone
      };
      
      problems.push(problem);
    }
    
    console.log(`✅ Loaded ${problems.length} problems for Explorer`);
    
    return {
      success: true,
      data: problems
    };
    
  } catch (error) {
    console.error('❌ Error loading FaultLog for Explorer:', error);
    return { 
      success: false, 
      error: error.toString(),
      message: 'Failed to load problems from FaultLog'
    };
  }
}

/**
 * =====================================================================
 * GET EXPLORER ANALYTICS - PRE-CALCULATED STATS
 * =====================================================================
 */
function getExplorerStats() {
  try {
    console.log('📈 Calculating Explorer analytics...');
    
    // Get all problems
    const problemsResult = getFaultLogData();
    if (!problemsResult.success) {
      return problemsResult;
    }
    
    const problems = problemsResult.data;
    console.log(`📊 Analyzing ${problems.length} problems for stats`);
    
    // Calculate basic stats
    const totalProblems = problems.length;
    const activeProblems = problems.filter(p => 
      p.problemStatus !== 'Completed' && p.problemStatus !== 'Cancelled'
    ).length;
    const urgentProblems = problems.filter(p => p.problemPriority === 'Urgent').length;
    const completedProblems = problems.filter(p => p.problemStatus === 'Completed').length;
    
    // Zone breakdown
    const zoneStats = {};
    problems.forEach(problem => {
      const zone = problem.zone || 'Unknown';
      if (!zoneStats[zone]) {
        zoneStats[zone] = { total: 0, active: 0, completed: 0 };
      }
      zoneStats[zone].total++;
      if (problem.problemStatus === 'Completed') {
        zoneStats[zone].completed++;
      } else if (problem.problemStatus !== 'Cancelled') {
        zoneStats[zone].active++;
      }
    });
    
    // Category breakdown
    const categoryStats = {};
    problems.forEach(problem => {
      const category = problem.category || 'Uncategorized';
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });
    
    // Priority breakdown
    const priorityStats = {};
    problems.forEach(problem => {
      const priority = problem.problemPriority || 'Medium';
      priorityStats[priority] = (priorityStats[priority] || 0) + 1;
    });
    
    // Status breakdown
    const statusStats = {};
    problems.forEach(problem => {
      const status = problem.problemStatus || 'Reported';
      statusStats[status] = (statusStats[status] || 0) + 1;
    });
    
    // Calculate average resolution time (for completed problems)
    let avgResolutionDays = 0;
    const completedWithDates = problems.filter(p => 
      p.problemStatus === 'Completed' && p.completionDate && p.timestamp
    );
    
    if (completedWithDates.length > 0) {
      const totalDays = completedWithDates.reduce((sum, problem) => {
        const reported = new Date(problem.timestamp);
        const completed = new Date(problem.completionDate);
        const days = Math.ceil((completed - reported) / (1000 * 60 * 60 * 24));
        return sum + (days > 0 ? days : 0);
      }, 0);
      avgResolutionDays = Math.round(totalDays / completedWithDates.length);
    }
    
    const analytics = {
      summary: {
        totalProblems,
        activeProblems,
        urgentProblems,
        completedProblems,
        avgResolutionDays
      },
      breakdown: {
        zones: zoneStats,
        categories: categoryStats,
        priorities: priorityStats,
        statuses: statusStats
      },
      trends: {
        completionRate: totalProblems > 0 ? Math.round((completedProblems / totalProblems) * 100) : 0,
        activeRate: totalProblems > 0 ? Math.round((activeProblems / totalProblems) * 100) : 0,
        urgentRate: totalProblems > 0 ? Math.round((urgentProblems / totalProblems) * 100) : 0
      }
    };
    
    console.log('✅ Analytics calculated:', analytics.summary);
    
    return {
      success: true,
      data: analytics
    };
    
  } catch (error) {
    console.error('❌ Error calculating Explorer analytics:', error);
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to calculate analytics'
    };
  }
}

/**
 * =====================================================================
 * UTILITY FUNCTIONS
 * =====================================================================
 */

/**
 * Test function to verify API deployment
 */
function testExplorerAPI() {
  console.log('🧪 Testing Holden Explorer API...');
  
  // Test data loading
  const dataResult = getFaultLogData();
  console.log('Data loading test:', dataResult.success ? '✅ PASS' : '❌ FAIL');
  
  // Test dropdown options
  const dropdownResult = getDropdownOptions();
  console.log('Dropdown loading test:', dropdownResult.success ? '✅ PASS' : '❌ FAIL');
  
  // Test analytics
  const analyticsResult = getExplorerStats();
  console.log('Analytics test:', analyticsResult.success ? '✅ PASS' : '❌ FAIL');
  
  return {
    dataLoading: dataResult.success,
    dropdownLoading: dropdownResult.success,
    analytics: analyticsResult.success,
    timestamp: new Date().toISOString()
  };
}

/**
 * Get friendly PID from internal ID
 */
function getFriendlyPID(internalId) {
  if (!internalId) return 'PID Unknown';
  const parts = internalId.split('-');
  return parts.length === 2 ? `PID ${parts[1]}` : `PID ${internalId}`;
}

// Add this new function to handle directory searches
function getResidents() {
  try {
    console.log('📞 Directory API: Getting residents data...');
    
    // Access the UnitList tab
    const SHEET_ID = '14u4Hl3Uluvk45ABIcgKGltX8EpBdGj1JvF_kEtZwmEE'; // Same as your Explorer API
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName('UnitList');
    
    if (!sheet) {
      throw new Error('UnitList tab not found');
    }
    
    // Get all data from UnitList tab
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return { success: false, message: 'No resident data found' };
    }
    
    // Process the data (skip header row)
    const residents = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row[0] && !row[1]) continue;
      
      const resident = {
        unit: row[0] || '',           // Column A - Unit Number
        name: row[1] || '',           // Column B - Reported By (Name)
        email: row[2] || '',          // Column C - Reported Email  
        phone: row[3] || '',          // Column D - Reporter Phone
        stage: row[9] || 'Stage 1',   // Column J - Stage (default to Stage 1)
        roleTags: row[10] || 'Resident', // Column K - Role Tags (default to Resident)
        address: getUnitAddress(row[0], row[9]) // Generate address based on unit and stage
      };
      
      // Only add if we have at least unit or name
      if (resident.unit || resident.name) {
        residents.push(resident);
      }
    }
    
    console.log(`📞 Directory API: Found ${residents.length} residents`);
    
    return {
      success: true,
      residents: residents,
      count: residents.length,
      message: `Found ${residents.length} residents`
    };
    
  } catch (error) {
    console.error('❌ Directory API Error:', error.toString());
    
    return {
      success: false,
      message: 'Error accessing resident directory: ' + error.toString(),
      residents: []
    };
  }
}

// Helper function to generate unit addresses based on stage
// ONLY UPDATE THIS FUNCTION - Leave getResidents() alone!
function getUnitAddress(unitNumber, stage) {
  if (!unitNumber) return '';
  
  const unitNum = parseInt(unitNumber.toString().replace(/\D/g, ''));
  if (isNaN(unitNum)) return '';
  
  const stageValue = stage || 'Stage 1';
  
  if (stageValue.toLowerCase().includes('stage 2')) {
    if (unitNum >= 1 && unitNum <= 32) {
      return `Unit ${unitNum}, 59-73 Gladesville Boulevard, Patterson Lakes, Melbourne 3197`;
    }
  } else {
    if (unitNum >= 1 && unitNum <= 44) {
      return `Unit ${unitNum}, 75-93 Gladesville Boulevard, Patterson Lakes, Melbourne 3197`;
    }
  }
  
  return `Unit ${unitNum}, Lake Illawong Retirement Village, Patterson Lakes, Melbourne 3197`;
}

// =====================================================================
// TEST FUNCTION (OPTIONAL)
// =====================================================================
// Use this to test the directory API after deployment
function testDirectoryAPI() {
  const result = getResidents();
  console.log('Directory Test Result:', JSON.stringify(result, null, 2));
  
  // Log sample data for verification
  if (result.success && result.residents.length > 0) {
    console.log('Sample resident:', JSON.stringify(result.residents[0], null, 2));
  }
}

console.log('🔍 Holden Problem Data Explorer API V1.0 - Loaded and Ready!');
console.log('📊 Read-only analytics backend for desktop-first data exploration');
console.log('🎛️ Dynamic dropdown support from Maintenance tab');
console.log('📈 Pre-calculated analytics for dashboard');