/**
 * ManagementCentral V1.0
 * 
 * Version and name reset
 * COMPLETE FIX FOR DROPDOWN AND EMAILLIST SYNC
 * added support for Category and Sub-Category updating via Unified Contact Manager
 * Added AssignedBy updating via Unified Contact Manager
 * Added Role Assignment via Unified Contact Manager
 * Added Quick Navigation link to selected TABs
 */

// Configuration
const SHEET_ID = '14u4Hl3Uluvk45ABIcgKGltX8EpBdGj1JvF_kEtZwmEE';
const UNITLIST_TAB = 'UnitList';
const DROPDOWNS_TAB = 'Dropdowns';
const EMAILLIST_TAB = 'EmailList';
const ZONEREP_RANGE = 'A2:C11';

// ADD THESE CONSTANTS TO YOUR BACKEND SCRIPT
const CATEGORIES_RANGE = 'Categories!A:A';
const SUBCATEGORIES_RANGE = 'SubCategories!A:B';
const CATEGORIES_TAB = 'Categories';
const SUBCATEGORIES_TAB = 'SubCategories';

/**
 * Web App Entry Point - JSONP Protocol
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const callback = e.parameter.callback;
    
    let result;
    
    switch (action) {
      case 'getUnitListData':
        result = getUnitListData();
        break;
      case 'addResident':
        result = addResident(e.parameter);
        break;
      case 'updateResident':
        result = updateResident(e.parameter);
        break;
      case 'deleteResident':
        result = deleteResident(e.parameter);
        break;
      case 'processUnitHandover':
        result = processUnitHandover(e.parameter);
        break;
      case 'syncDDM':
        result = syncDDMFromUnitList();
        break;
      case 'testConnection':
        result = { success: true, message: 'Backend connection successful', version: '1.1.3' };
        break;
      case 'getZoneReps':
        result = getZoneReps();
        break;
      case 'syncZoneReps':
        result = syncZoneReps();
        break;
      case 'getRoles':
        result = getRoles();
        break;

// Add to your doGet() switch statement
case 'getCategories':
  result = getCategories();
  break;
case 'getSubCategories':
  result = getSubCategories();
  break;
case 'addCategory':
  result = addCategory(e.parameter.category);
  break;

case 'deleteCategory':
  result = deleteCategory(e.parameter);
  break;

case 'addSubCategory':
  result = addSubCategory(e.parameter.subCategory);
  break;

case 'deleteSubCategory':
  result = deleteSubCategory(e.parameter);
  break;

  case 'updateCategory':  // ADD THIS CASE
  result = updateCategory(e.parameter);
  break;

  case 'updateSubCategory':  // ADD THIS CASE
  result = updateSubCategory(e.parameter);
  break;

  case 'getAssignedBy':
  result = getAssignedBy();
  break;
case 'addAssignedBy':
  result = addAssignedBy(e.parameter.assignedBy);
  break;
case 'deleteAssignedBy':
  result = deleteAssignedBy(e.parameter);
  break;
case 'updateAssignedBy':
  result = updateAssignedBy(e.parameter);
  break;

  case 'getRoles':
    result = getRoles();
    break;
case 'addRole':
    result = addRole(e.parameter.role);
    break;
case 'deleteRole':
    result = deleteRole(e.parameter);
    break;
case 'updateRole':
    result = updateRole(e.parameter);
    break;

    case 'getUserAccounts':
        result = getUserAccounts();
        break;

      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
    
    // Return JSONP response
    const jsonResponse = JSON.stringify(result);
    if (callback) {
      return ContentService.createTextOutput(callback + '(' + jsonResponse + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService.createTextOutput(jsonResponse)
        .setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    const errorResult = { success: false, error: error.toString() };
    const jsonResponse = JSON.stringify(errorResult);
    
    if (e.parameter && e.parameter.callback) {
      return ContentService.createTextOutput(e.parameter.callback + '(' + jsonResponse + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService.createTextOutput(jsonResponse)
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
}

function getUnitListData() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(UNITLIST_TAB);
    
    if (!sheet) {
      throw new Error('UnitList sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    const residents = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] || row[1]) {
        residents.push({
          rowIndex: i + 1,
          unitNumber: row[0] || '',
          residentName: row[1] || '',
          email: row[2] || '',
          phone: row[3] || '',
          zone: row[4] || '',
          unitDisplayName: row[5] || '',
          unitPrimaryName: row[6] || '',
          unitPrimaryEmail: row[7] || '',
          unitPrimaryPhone: row[8] || '',
          stage: row[9] || 'Stage 1',
          roleTags: row[10] || 'Resident'
        });
      }
    }
    
    return {
      success: true,
      residents: residents,
      totalCount: residents.length
    };
    
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function addResident(params) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(UNITLIST_TAB);
    
    if (!sheet) {
      throw new Error('UnitList sheet not found');
    }
    
    const existingData = sheet.getDataRange().getValues();
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][1] === params.residentName) {
        throw new Error(`Resident ${params.residentName} already exists`);
      }
    }
    
    const reportedBy = params.residentName || '';
    const reportedEmail = params.email || '';
    const reportedPhone = params.phone || '';
    const stage = params.stage || 'Stage 1';
    const roleTags = params.roleTags || 'Resident';
    
    const newRow = [
      params.unitNumber || '',
      reportedBy,
      reportedEmail,
      reportedPhone,
      params.zone || '',
      params.unitDisplayName || '',
      reportedBy,
      reportedEmail,
      reportedPhone,
      stage,
      roleTags
    ];
    
    const insertRow = findCorrectInsertionPosition(sheet, stage, params.unitNumber);
    
    if (insertRow > 0) {
      sheet.insertRowAfter(insertRow);
      sheet.getRange(insertRow + 1, 1, 1, newRow.length).setValues([newRow]);
      sheet.getRange(insertRow + 1, 6).setFormula(
        `=IF(E${insertRow + 1}="","",SUBSTITUTE(A${insertRow + 1}, "Unit ", "")&" - ( "&JOIN(" & ",UNIQUE(FILTER(B:B,(A:A=A${insertRow + 1})*(E:E=E${insertRow + 1}))))&" )")`
      );
    } else {
      sheet.appendRow(newRow);
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow, 6).setFormula(
        `=IF(E${lastRow}="","",SUBSTITUTE(A${lastRow}, "Unit ", "")&" - ( "&JOIN(" & ",UNIQUE(FILTER(B:B,(A:A=A${lastRow})*(E:E=E${lastRow}))))&" )")`
      );
    }
    
    // Sync DDM and Zone Reps
    let ddmSynced = false;
    let zoneRepsSynced = false;
    
    if (params.residentName) {
      const ddmResult = syncDDMFromUnitList();
      ddmSynced = ddmResult.success;
    }
    
    const zoneRepResult = syncZoneReps();
    zoneRepsSynced = zoneRepResult.success;
    
    logAuditTrail('ADD_RESIDENT', {
      unitNumber: params.unitNumber,
      residentName: params.residentName,
      stage: stage,
      roleTags: roleTags,
      insertionRow: insertRow,
      action: 'Added new resident with smart placement'
    });
    
    return {
      success: true,
      message: `Successfully added ${stage} ${roleTags} ${params.residentName} to unit ${params.unitNumber}`,
      ddmSynced: ddmSynced,
      zoneRepsSynced: zoneRepsSynced,
      placement: insertRow > 0 ? 'stage-grouped' : 'appended'
    };
    
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function findCorrectInsertionPosition(sheet, stage, unitNumber) {
  try {
    const data = sheet.getDataRange().getValues();
    const targetStage = stage || 'Stage 1';
    const targetUnit = parseInt(String(unitNumber).replace(/\D/g, '')) || 999;
    
    let lastStageRow = 0;
    let insertPosition = 0;
    
    for (let i = 1; i < data.length; i++) {
      const rowStage = data[i][9] || 'Stage 1';
      const rowUnit = parseInt(String(data[i][0]).replace(/\D/g, '')) || 0;
      
      if (rowStage === targetStage) {
        lastStageRow = i;
        if (targetUnit < rowUnit) {
          insertPosition = i;
          break;
        }
      } else if (lastStageRow > 0 && rowStage !== targetStage) {
        insertPosition = i;
        break;
      }
    }
    
    if (lastStageRow > 0 && insertPosition === 0) {
      insertPosition = lastStageRow + 1;
    }
    
    if (lastStageRow === 0) {
      if (targetStage === 'Stage 1') {
        insertPosition = 1;
      } else {
        insertPosition = findEndOfStage(data, 'Stage 1') + 1;
      }
    }
    
    return insertPosition;
    
  } catch (error) {
    return 0;
  }
}

function findEndOfStage(data, stage) {
  let lastRow = 0;
  for (let i = 1; i < data.length; i++) {
    const rowStage = data[i][9] || 'Stage 1';
    if (rowStage === stage) {
      lastRow = i;
    }
  }
  return lastRow;
}

function updateResident(params) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(UNITLIST_TAB);
    
    if (!sheet) {
      throw new Error('UnitList sheet not found');
    }
    
    const rowIndex = parseInt(params.rowIndex);
    if (!rowIndex || rowIndex < 2) {
      throw new Error('Invalid row index');
    }
    
    const maxRows = sheet.getLastRow();
    if (rowIndex > maxRows) {
      throw new Error(`Row ${rowIndex} does not exist. Sheet has ${maxRows} rows.`);
    }
    
    const currentRow = sheet.getRange(rowIndex, 1, 1, 11).getValues()[0];
    const reportedBy = params.residentName !== undefined ? params.residentName : currentRow[1];
    const reportedEmail = params.email !== undefined ? params.email : currentRow[2];
    const reportedPhone = params.phone !== undefined ? params.phone : currentRow[3];
    
    const updates = [
      params.unitNumber || currentRow[0],
      reportedBy,
      reportedEmail,
      reportedPhone,
      params.zone !== undefined ? params.zone : currentRow[4],
      params.unitDisplayName !== undefined ? params.unitDisplayName : currentRow[5],
      reportedBy,
      reportedEmail,
      reportedPhone,
      params.stage !== undefined ? params.stage : currentRow[9],
      params.roleTags !== undefined ? params.roleTags : currentRow[10]
    ];
    
    sheet.getRange(rowIndex, 1, 1, 11).setValues([updates]);
    
    // Sync DDM and Zone Reps
    const oldReportedBy = currentRow[1];
    let ddmSynced = false;
    if (oldReportedBy !== reportedBy) {
      const ddmResult = syncDDMFromUnitList();
      ddmSynced = ddmResult.success;
    }
    
    const zoneRepResult = syncZoneReps();
    const zoneRepsSynced = zoneRepResult.success;
    
    logAuditTrail('UPDATE_RESIDENT', {
      unitNumber: updates[0],
      residentName: reportedBy,
      changes: getChanges(currentRow, updates),
      rowIndex: rowIndex
    });
    
    return {
      success: true,
      message: `Successfully updated resident in unit ${updates[0]}`,
      ddmSynced: ddmSynced,
      zoneRepsSynced: zoneRepsSynced
    };
    
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function deleteResident(params) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(UNITLIST_TAB);
    
    if (!sheet) {
      throw new Error('UnitList sheet not found');
    }
    
    const rowIndex = parseInt(params.rowIndex);
    if (!rowIndex || isNaN(rowIndex)) {
      throw new Error('Invalid row index: must be a valid number');
    }
    
    if (rowIndex < 2) {
      throw new Error('Invalid row index: cannot delete header row (row 1)');
    }
    
    const maxRows = sheet.getLastRow();
    if (rowIndex > maxRows) {
      throw new Error(`Row ${rowIndex} does not exist. Sheet has ${maxRows} rows.`);
    }
    
    const currentRow = sheet.getRange(rowIndex, 1, 1, 11).getValues()[0];
    const unitNumber = currentRow[0];
    const residentName = currentRow[1];
    
    sheet.deleteRows(rowIndex, 1);
    
    // Sync DDM and Zone Reps
    const ddmResult = syncDDMFromUnitList();
    const zoneRepResult = syncZoneReps();
    
    logAuditTrail('DELETE_RESIDENT', {
      unitNumber: unitNumber,
      residentName: residentName,
      deletedRow: rowIndex,
      deletedAt: new Date().toISOString()
    });
    
    return {
      success: true,
      message: `Successfully deleted resident ${residentName} from unit ${unitNumber}`,
      ddmSynced: ddmResult.success,
      zoneRepsSynced: zoneRepResult.success,
      deletedRow: rowIndex
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: error.toString(),
      params: params,
      timestamp: new Date().toISOString()
    };
  }
}

function processUnitHandover(params) {
  try {
    const oldResident = params.oldResident;
    const newResident = params.newResident;
    const unitNumber = params.unitNumber;
    
    if (!unitNumber) {
      throw new Error('Unit number required for handover');
    }
    
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(UNITLIST_TAB);
    const data = sheet.getDataRange().getValues();
    
    let targetRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === unitNumber) {
        targetRow = i + 1;
        break;
      }
    }
    
    if (targetRow === -1) {
      throw new Error(`Unit ${unitNumber} not found`);
    }
    
    const updateParams = {
      rowIndex: targetRow,
      residentName: newResident.name,
      email: newResident.email,
      phone: newResident.phone,
      unitPrimaryName: newResident.name,
      unitPrimaryEmail: newResident.email,
      unitPrimaryPhone: newResident.phone,
      stage: newResident.stage || data[targetRow - 1][9],
      roleTags: newResident.roleTags || 'Resident'
    };
    
    const result = updateResident(updateParams);
    
    if (result.success) {
      logAuditTrail('UNIT_HANDOVER', {
        unitNumber: unitNumber,
        oldResident: oldResident,
        newResident: newResident,
        handoverDate: new Date().toISOString()
      });
    }
    
    return {
      success: result.success,
      message: result.success 
        ? `Successfully completed handover for unit ${unitNumber}` 
        : result.error,
      ddmSynced: result.ddmSynced,
      zoneRepsSynced: result.zoneRepsSynced
    };
    
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * COMPLETELY REWRITTEN DDM SYNC FUNCTION
 * FIXED: Now properly updates Dropdowns tab with Stage 1 Residents
 */
function syncDDMFromUnitList() {
  try {
    console.log('🔄 Starting DDM sync to Dropdowns tab...');
    
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const unitListSheet = spreadsheet.getSheetByName(UNITLIST_TAB);
    const dropdownsSheet = spreadsheet.getSheetByName(DROPDOWNS_TAB);
    
    if (!unitListSheet) throw new Error('UnitList sheet not found');
    if (!dropdownsSheet) throw new Error('Dropdowns sheet not found');
    
    // Get all data from UnitList
    const unitData = unitListSheet.getDataRange().getValues();
    const eligibleResidents = [];
    
    // Process each row (skip header row 0)
    for (let i = 1; i < unitData.length; i++) {
      const row = unitData[i];
      const residentName = row[1]; // Column B
      const stage = row[9]; // Column J
      const roleTags = row[10]; // Column K
      
      // Check if this is a Stage 1 Resident
      if (residentName && residentName.toString().trim() !== '' &&
          stage && stage.toString() === 'Stage 1' && 
          roleTags && roleTags.toString().toLowerCase().includes('resident')) {
        eligibleResidents.push(residentName.toString().trim());
      }
    }
    
    // Remove duplicates and sort alphabetically
    const uniqueResidents = [...new Set(eligibleResidents)].sort();
    console.log(`Found ${uniqueResidents.length} Stage 1 Residents for DDM`);
    
    // Clear only the specific range B2:B75 in Dropdowns tab
    const clearRange = dropdownsSheet.getRange('B2:B75');
    clearRange.clearContent();
    
    // Write the residents to the dropdowns sheet if we have any
    if (uniqueResidents.length > 0) {
      // Convert to 2D array for setValues
      const residentData = uniqueResidents.map(name => [name]);
      
      // Write to B2 downwards
      dropdownsSheet.getRange(2, 2, residentData.length, 1).setValues(residentData);
      console.log(`✅ Wrote ${residentData.length} residents to Dropdowns tab`);
    }
    
    return {
      success: true,
      message: `DDM synchronized: ${uniqueResidents.length} Stage 1 Residents to Column B`,
      residentCount: uniqueResidents.length,
      syncedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ DDM sync error:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * ULTRA-SIMPLE: Zone Rep synchronization with fixed structure
 * Assumes exactly 2 rows per zone in sequence
 */
function syncZoneReps() {
  try {
    console.log('🔄 Syncing zone representatives to EmailList tab...');
    
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const unitListSheet = spreadsheet.getSheetByName(UNITLIST_TAB);
    const emailListSheet = spreadsheet.getSheetByName(EMAILLIST_TAB);
    
    if (!unitListSheet) throw new Error('UnitList sheet not found');
    if (!emailListSheet) throw new Error('EmailList sheet not found');
    
    // Get all zone reps from UnitList
    const unitData = unitListSheet.getDataRange().getValues();
    const zoneReps = {1: [], 2: [], 3: [], 4: [], 5: []};
    
    // Find all ZoneReps in UnitList
    for (let i = 1; i < unitData.length; i++) {
      const row = unitData[i];
      const name = row[1] ? row[1].toString().trim() : '';
      const email = row[2] ? row[2].toString().trim() : '';
      const roles = row[10] ? row[10].toString() : '';
      
      if (name && email && roles) {
        const roleList = roles.split(',').map(r => r.trim());
        
        for (const role of roleList) {
          if (role.startsWith('ZoneRep-')) {
            const zoneNum = parseInt(role.replace('ZoneRep-', '').replace(/\D/g, ''));
            if (!isNaN(zoneNum) && zoneNum >= 1 && zoneNum <= 5) {
              zoneReps[zoneNum].push({name, email});
            }
          }
        }
      }
    }
    
    // Prepare all data at once (10 rows: 2 per zone × 5 zones)
    const allData = [];
    
    for (let zone = 1; zone <= 5; zone++) {
      const reps = zoneReps[zone] || [];
      
      // First rep for this zone
      if (reps.length > 0) {
        allData.push([reps[0].name, reps[0].email]);
      } else {
        allData.push(['', '']);
      }
      
      // Second rep for this zone  
      if (reps.length > 1) {
        allData.push([reps[1].name, reps[1].email]);
      } else {
        allData.push(['', '']);
      }
    }
    
    // Update all name/email fields at once (B2:C11)
    emailListSheet.getRange('B2:C11').setValues(allData);
    
    console.log('✅ Zone Rep list updated in EmailList tab');
    
    return {
      success: true,
      message: `Zone Rep list synchronized in ${EMAILLIST_TAB}`,
      syncedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Zone Rep sync error:', error);
    return { success: false, error: error.toString() };
  }
}


function getZoneReps() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const unitListSheet = spreadsheet.getSheetByName(UNITLIST_TAB);
    
    if (!unitListSheet) {
      throw new Error('UnitList sheet not found');
    }
    
    const unitData = unitListSheet.getDataRange().getValues();
    const zoneReps = {1: [], 2: [], 3: [], 4: [], 5: []};
    
    for (let i = 1; i < unitData.length; i++) {
      const row = unitData[i];
      const residentName = row[1] ? row[1].toString().trim() : '';
      const email = row[2] ? row[2].toString().trim() : '';
      const roleTags = row[10] || '';
      
      if (residentName && roleTags && email) {
        const roles = roleTags.toString().split(',').map(r => r.trim());
        
        for (const role of roles) {
          if (role.startsWith('ZoneRep-')) {
            const zoneNumber = parseInt(role.replace('ZoneRep-', ''));
            if (zoneNumber >= 1 && zoneNumber <= 5) {
              zoneReps[zoneNumber].push({
                name: residentName,
                email: email,
                zone: zoneNumber
              });
            }
          }
        }
      }
    }
    
    return {
      success: true,
      zoneReps: zoneReps,
      message: `Found zone representatives for all zones`
    };
    
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function getRoles() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const rolesSheet = spreadsheet.getSheetByName('Roles');
    
    if (!rolesSheet) {
      return {
        success: true,
        roles: ['Resident', 'Director', 'Committee', 'Maintenance', 'Staff', 'External', 'Contractor', 'ZoneRep-1', 'ZoneRep-2', 'ZoneRep-3', 'ZoneRep-4', 'ZoneRep-5'],
        message: 'Default roles returned (Roles sheet not found)'
      };
    }
    
    const rolesData = rolesSheet.getDataRange().getValues();
    
    if (rolesData.length < 2) {
      return {
        success: true,
        roles: ['Resident', 'Director', 'Committee', 'Maintenance', 'Staff', 'External', 'Contractor', 'ZoneRep-1', 'ZoneRep-2', 'ZoneRep-3', 'ZoneRep-4', 'ZoneRep-5'],
        message: 'Default roles returned (Roles sheet is empty)'
      };
    }
    
    const availableRoles = [];
    
    for (let i = 1; i < rolesData.length; i++) {
      const roleName = rolesData[i][0];
      
      if (roleName && roleName.toString().trim() !== '') {
        availableRoles.push(roleName.toString().trim());
      }
    }
    
    for (let i = 1; i <= 5; i++) {
      const zoneRepRole = `ZoneRep-${i}`;
      if (!availableRoles.includes(zoneRepRole)) {
        availableRoles.push(zoneRepRole);
      }
    }
    
    return {
      success: true,
      roles: availableRoles,
      count: availableRoles.length,
      message: `Loaded ${availableRoles.length} roles from Roles TAB`
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      roles: ['Resident', 'Director', 'Committee', 'Maintenance', 'Staff', 'External', 'Contractor', 'ZoneRep-1', 'ZoneRep-2', 'ZoneRep-3', 'ZoneRep-4', 'ZoneRep-5'],
      message: 'Error occurred, returned default roles'
    };
  }
}

function logAuditTrail(action, details) {
  try {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action: action,
      details: details,
      user: Session.getActiveUser().getEmail() || 'system'
    };
    
    return { success: true, auditEntry: auditEntry };
    
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// Simple Category/Sub-Category Management Functions


function getCategories() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const categoriesRange = ss.getRangeByName('Categories');
    
    if (!categoriesRange) {
      return { success: false, error: 'Categories named range not found' };
    }
    
    const allData = categoriesRange.getValues();
    const nonEmptyData = allData
      .filter(row => row[0] && row[0].toString().trim() !== '')
      .map(row => row[0].toString().trim());
    
    const sortedData = nonEmptyData.sort((a, b) => a.localeCompare(b));
    
    // Rebuild array to match original range size
    const sortedValues = [];
    for (let i = 0; i < allData.length; i++) {
      sortedValues.push(i < sortedData.length ? [sortedData[i]] : ['']);
    }
    
    categoriesRange.setValues(sortedValues);
    
    const categories = sortedData.map((name, index) => ({
      id: index + 1,
      name: name
    }));
    
    return { success: true, categories: categories };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// GET - Read all subcategories from the SubCategories named range
function getSubCategories() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const subCategoriesRange = ss.getRangeByName('SubCategories');
    
    if (!subCategoriesRange) {
      return { success: false, error: 'SubCategories named range not found' };
    }
    
    const allData = subCategoriesRange.getValues();
    const nonEmptyData = allData
      .filter(row => row[0] && row[0].toString().trim() !== '')
      .map(row => row[0].toString().trim());
    
    const sortedData = nonEmptyData.sort((a, b) => a.localeCompare(b));
    
    // Rebuild array to match original range size
    const sortedValues = [];
    for (let i = 0; i < allData.length; i++) {
      sortedValues.push(i < sortedData.length ? [sortedData[i]] : ['']);
    }
    
    subCategoriesRange.setValues(sortedValues);
    
    const subCategories = sortedData.map((name, index) => ({
      id: index + 1,
      name: name
    }));
    
    return { success: true, subCategories: subCategories };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}



// POST - Create new category
function addCategory(categoryName) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const categoriesRange = ss.getRangeByName('Categories');
    
    if (!categoriesRange) {
      return { success: false, error: 'Categories named range not found' };
    }
    
    // Get all data from the range
    const allData = categoriesRange.getValues();
    
    // Find first empty cell and add the new entry
    let added = false;
    const updatedData = allData.map(row => {
      if (!added && (!row[0] || row[0].toString().trim() === '')) {
        added = true;
        return [categoryName];
      }
      return row;
    });
    
    if (!added) {
      return { success: false, error: 'No space available in categories range' };
    }
    
    // Filter out non-empty values and sort
    const nonEmptyData = updatedData
      .filter(row => row[0] && row[0].toString().trim() !== '')
      .map(row => row[0].toString().trim());
    
    const sortedData = nonEmptyData.sort((a, b) => a.localeCompare(b));
    
    // Rebuild array to match original range size
    const sortedValues = [];
    for (let i = 0; i < allData.length; i++) {
      sortedValues.push(i < sortedData.length ? [sortedData[i]] : ['']);
    }
    
    // Write the sorted data back
    categoriesRange.setValues(sortedValues);
    
    return { 
      success: true, 
      message: 'Category added and sorted successfully'
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// POST - Add new subcategory to the SubCategories named range
function addSubCategory(subCategoryName) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const subCategoriesRange = ss.getRangeByName('SubCategories');
    
    if (!subCategoriesRange) {
      return { success: false, error: 'SubCategories named range not found' };
    }
    
    // Get all data from the range
    const allData = subCategoriesRange.getValues();
    
    // Find first empty cell and add the new entry
    let added = false;
    const updatedData = allData.map(row => {
      if (!added && (!row[0] || row[0].toString().trim() === '')) {
        added = true;
        return [subCategoryName];
      }
      return row;
    });
    
    if (!added) {
      return { success: false, error: 'No space available in subcategories range' };
    }
    
    // Filter out non-empty values and sort
    const nonEmptyData = updatedData
      .filter(row => row[0] && row[0].toString().trim() !== '')
      .map(row => row[0].toString().trim());
    
    const sortedData = nonEmptyData.sort((a, b) => a.localeCompare(b));
    
    // Rebuild array to match original range size
    const sortedValues = [];
    for (let i = 0; i < allData.length; i++) {
      sortedValues.push(i < sortedData.length ? [sortedData[i]] : ['']);
    }
    
    // Write the sorted data back
    subCategoriesRange.setValues(sortedValues);
    
    return { 
      success: true, 
      message: 'SubCategory added and sorted successfully'
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// PUT - Update existing category
function updateCategory(params) {
  try {
    const categoryId = params.id;
    const newName = params.name;
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const categoriesRange = ss.getRangeByName('Categories');
    
    if (!categoriesRange) {
      return {
        success: false,
        error: 'Categories named range not found'
      };
    }
    
    const rowIndex = parseInt(categoryId);
    
    if (isNaN(rowIndex) || rowIndex < 1 || rowIndex > categoriesRange.getNumRows()) {
      return {
        success: false,
        error: 'Invalid category ID'
      };
    }
    
    categoriesRange.getCell(rowIndex, 1).setValue(newName);
    
    return {
      success: true,
      message: 'Category updated successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

// PUT - Update existing subcategory
function updateSubCategory(params) {
  try {
    const subCategoryId = params.id;
    const newName = params.name;
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const subCategoriesRange = ss.getRangeByName('SubCategories');
    
    if (!subCategoriesRange) {
      return {
        success: false,
        error: 'SubCategories named range not found'
      };
    }
    
    const rowIndex = parseInt(subCategoryId);
    
    if (isNaN(rowIndex) || rowIndex < 1 || rowIndex > subCategoriesRange.getNumRows()) {
      return {
        success: false,
        error: 'Invalid subcategory ID'
      };
    }
    
    subCategoriesRange.getCell(rowIndex, 1).setValue(newName);
    
    return {
      success: true,
      message: 'SubCategory updated successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}



// DELETE - Remove category
function deleteCategory(params) {
  try {
    const categoryId = params.categoryId;
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const categoriesRange = ss.getRangeByName('Categories');
    
    if (!categoriesRange) {
      return {
        success: false,
        error: 'Categories named range not found'
      };
    }
    
    const rowIndex = parseInt(categoryId);
    
    if (isNaN(rowIndex) || rowIndex < 1 || rowIndex > categoriesRange.getNumRows()) {
      return {
        success: false,
        error: 'Invalid category ID'
      };
    }
    
    categoriesRange.getCell(rowIndex, 1).clear();
    
    return {
      success: true,
      message: 'Category deleted successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

// DELETE - Remove subcategory from SubCategories named range
function deleteSubCategory(params) {
  try {
    const subCategoryId = params.subCategoryId;
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const subCategoriesRange = ss.getRangeByName('SubCategories');
    
    if (!subCategoriesRange) {
      return {
        success: false,
        error: 'SubCategories named range not found'
      };
    }
    
    const rowIndex = parseInt(subCategoryId);
    
    if (isNaN(rowIndex) || rowIndex < 1 || rowIndex > subCategoriesRange.getNumRows()) {
      return {
        success: false,
        error: 'Invalid subcategory ID'
      };
    }
    
    subCategoriesRange.getCell(rowIndex, 1).clear();
    
    return {
      success: true,
      message: 'SubCategory deleted successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Helper function to compact a list (remove empty cells in the middle)
function compactList(range) {
  const values = range.getValues();
  const nonEmptyValues = values.filter(row => row[0] && row[0].toString().trim() !== '');
  const emptyCount = values.length - nonEmptyValues.length;
  
  // Clear the range
  range.clearContent();
  
  // Add back non-empty values
  if (nonEmptyValues.length > 0) {
    range.getCell(1, 1, nonEmptyValues.length, 1).setValues(nonEmptyValues);
  }
}

// GET - Read all assignedBy values
function getAssignedBy() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const assignedByRange = ss.getRangeByName('AssignedBy');
    
    if (!assignedByRange) {
      return { success: false, error: 'AssignedBy named range not found' };
    }
    
    const allData = assignedByRange.getValues();
    const nonEmptyData = allData
      .filter(row => row[0] && row[0].toString().trim() !== '')
      .map(row => row[0].toString().trim());
    
    const sortedData = nonEmptyData.sort((a, b) => a.localeCompare(b));
    
    // Rebuild array to match original range size
    const sortedValues = [];
    for (let i = 0; i < allData.length; i++) {
      sortedValues.push(i < sortedData.length ? [sortedData[i]] : ['']);
    }
    
    // Write the sorted data back
    assignedByRange.setValues(sortedValues);
    
    const assignedByList = sortedData.map((name, index) => ({
      id: index + 1,
      name: name
    }));
    
    return { success: true, assignedBy: assignedByList };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// POST - Add new AssignedBy value
function addAssignedBy(assignedByName) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const assignedByRange = ss.getRangeByName('AssignedBy');
    
    if (!assignedByRange) {
      return { success: false, error: 'AssignedBy named range not found' };
    }
    
    // Get all data from the range
    const allData = assignedByRange.getValues();
    
    // Find first empty cell and add the new entry
    let added = false;
    const updatedData = allData.map(row => {
      if (!added && (!row[0] || row[0].toString().trim() === '')) {
        added = true;
        return [assignedByName];
      }
      return row;
    });
    
    if (!added) {
      return { success: false, error: 'No space available in assigned by range' };
    }
    
    // Filter out non-empty values and sort
    const nonEmptyData = updatedData
      .filter(row => row[0] && row[0].toString().trim() !== '')
      .map(row => row[0].toString().trim());
    
    const sortedData = nonEmptyData.sort((a, b) => a.localeCompare(b));
    
    // Rebuild array to match original range size
    const sortedValues = [];
    for (let i = 0; i < allData.length; i++) {
      sortedValues.push(i < sortedData.length ? [sortedData[i]] : ['']);
    }
    
    // Write the sorted data back
    assignedByRange.setValues(sortedValues);
    
    return { 
      success: true, 
      message: 'Assigned By added and sorted successfully'
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// DELETE - Remove AssignedBy value
function deleteAssignedBy(params) {
  try {
    const assignedById = params.assignedById;
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const assignedByRange = ss.getRangeByName('AssignedBy');
    
    if (!assignedByRange) {
      return { success: false, error: 'AssignedBy named range not found' };
    }
    
    const rowIndex = parseInt(assignedById);
    
    if (isNaN(rowIndex) || rowIndex < 1 || rowIndex > assignedByRange.getNumRows()) {
      return { success: false, error: 'Invalid AssignedBy ID' };
    }
    
    assignedByRange.getCell(rowIndex, 1).clear();
    
    return { success: true, message: 'Assigned By deleted successfully' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// PUT - Update AssignedBy value
function updateAssignedBy(params) {
  try {
    const assignedById = params.id;
    const newName = params.name;
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const assignedByRange = ss.getRangeByName('AssignedBy');
    
    if (!assignedByRange) {
      return { success: false, error: 'AssignedBy named range not found' };
    }
    
    const rowIndex = parseInt(assignedById);
    
    if (isNaN(rowIndex) || rowIndex < 1 || rowIndex > assignedByRange.getNumRows()) {
      return { success: false, error: 'Invalid AssignedBy ID' };
    }
    
    assignedByRange.getCell(rowIndex, 1).setValue(newName);
    
    return { success: true, message: 'Assigned By updated successfully' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function getChanges(oldRow, newRow) {
  const changes = [];
  const columns = ['Unit Number', 'Resident Name', 'Email', 'Phone', 'Zone', 'Additional', 'Unit Primary Name', 'Unit Primary Email', 'Unit Primary Phone', 'Stage', 'Role Tags'];
  
  for (let i = 0; i < Math.min(oldRow.length, newRow.length); i++) {
    if (oldRow[i] !== newRow[i]) {
      changes.push({
        column: columns[i] || `Column ${i + 1}`,
        oldValue: oldRow[i],
        newValue: newRow[i]
      });
    }
  }
  
  return changes;
}

// GET - Read all roles from Roles named range
function getRoles() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const rolesRange = ss.getRangeByName('Roles');
    
    if (!rolesRange) {
      return { 
        success: false, 
        error: 'Roles named range not found',
        // Fallback to default roles if named range doesn't exist yet
        roles: ['Resident', 'Director', 'Management', 'Residents-Committee', 'Social-Committee', 'Chairperson', 'Treasurer', 'Secretary']
      };
    }
    
    const data = rolesRange.getValues().filter(row => row[0] && row[0].toString().trim() !== '');
    const rolesList = data.map((row, index) => ({
      id: index + 1,
      name: row[0]
    }));
    
    return { success: true, roles: rolesList };
  } catch (error) {
    return { 
      success: false, 
      error: error.toString(),
      roles: ['Resident', 'Director', 'Management', 'Residents-Committee', 'Social-Committee', 'Chairperson', 'Treasurer', 'Secretary']
    };
  }
}

// POST - Add new role to Roles named range
function addRole(roleName) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const rolesRange = ss.getRangeByName('Roles');
    
    if (!rolesRange) {
      return { success: false, error: 'Roles named range not found' };
    }
    
    const values = rolesRange.getValues();
    for (let i = 0; i < values.length; i++) {
      if (!values[i][0] || values[i][0].toString().trim() === '') {
        rolesRange.getCell(i + 1, 1).setValue(roleName);
        return { 
          success: true, 
          message: 'Role added successfully', 
          rowIndex: i + 1 
        };
      }
    }
    
    return { success: false, error: 'No empty cells available in Roles range' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// DELETE - Remove role from Roles named range
function deleteRole(params) {
  try {
    const roleId = params.roleId;
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const rolesRange = ss.getRangeByName('Roles');
    
    if (!rolesRange) {
      return { success: false, error: 'Roles named range not found' };
    }
    
    const rowIndex = parseInt(roleId);
    
    if (isNaN(rowIndex) || rowIndex < 1 || rowIndex > rolesRange.getNumRows()) {
      return { success: false, error: 'Invalid Role ID' };
    }
    
    rolesRange.getCell(rowIndex, 1).clear();
    
    return { success: true, message: 'Role deleted successfully' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

// PUT - Update existing role in Roles named range
function updateRole(params) {
  try {
    const roleId = params.id;
    const newName = params.name;
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const rolesRange = ss.getRangeByName('Roles');
    
    if (!rolesRange) {
      return { success: false, error: 'Roles named range not found' };
    }
    
    const rowIndex = parseInt(roleId);
    
    if (isNaN(rowIndex) || rowIndex < 1 || rowIndex > rolesRange.getNumRows()) {
      return { success: false, error: 'Invalid Role ID' };
    }
    
    rolesRange.getCell(rowIndex, 1).setValue(newName);
    
    return { success: true, message: 'Role updated successfully' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function getUserAccounts() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID);
    let userAccountsSheet = sheet.getSheetByName('UserAccounts');
    
    // Create UserAccounts sheet if it doesn't exist
    if (!userAccountsSheet) {
      userAccountsSheet = sheet.insertSheet('UserAccounts');
      
      // Set up headers
      const headers = ['Username', 'Password Hash', 'Full Name', 'Role', 'Status', 'Created', 'Last Login'];
      userAccountsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Add default users
      const defaultUsers = [
        ['admin', hashPassword('admin2024'), 'System Administrator', 'Administrator', 'Active', new Date(), ''],
        ['manager', hashPassword('manage2024'), 'Property Manager', 'Manager', 'Active', new Date(), ''],
        ['staff', hashPassword('staff2024'), 'Maintenance Staff', 'Staff', 'Active', new Date(), ''],
        ['committee', hashPassword('committee2024'), 'Residents Committee', 'Committee', 'Active', new Date(), '']
      ];
      
      userAccountsSheet.getRange(2, 1, defaultUsers.length, defaultUsers[0].length).setValues(defaultUsers);
    }
    
    const data = userAccountsSheet.getDataRange().getValues();
    const headers = data[0];
    const users = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      users.push({
        username: row[0] || '',
        fullName: row[2] || '',
        role: row[3] || '',
        status: row[4] || '',
        created: row[5] || '',
        lastLogin: row[6] || ''
      });
    }
    
    console.log(`✅ Retrieved ${users.length} user accounts`);
    
    return {
      success: true,
      users: users,
      count: users.length
    };
  } catch (error) {
    console.error('❌ Error getting user accounts:', error);
    return { success: false, error: error.toString() };
  }
}

function hashPassword(password) {
  // Simple hash for demo purposes
  return Utilities.base64Encode(password);
}

// ADD THESE FUNCTIONS TO YOUR BACKEND SCRIPT:

function debugNamedRanges() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const namedRanges = ss.getNamedRanges();
    
    // Get all named range info
    const allRanges = namedRanges.map(range => ({
      name: range.getName(),
      range: range.getRange().getA1Notation(),
      sheet: range.getRange().getSheet().getName(),
      scope: range.getRange().getSheet().getName() === ss.getName() ? 'Workbook' : 'Worksheet'
    }));
    
    // Test our specific ranges
    const categoriesRange = ss.getRangeByName('Categories');
    const subCategoriesRange = ss.getRangeByName('SubCategories');
    
    return {
      success: true,
      totalNamedRanges: namedRanges.length,
      allNamedRanges: allRanges,
      categoriesRangeExists: !!categoriesRange,
      subCategoriesRangeExists: !!subCategoriesRange,
      categoriesRangeInfo: categoriesRange ? {
        range: categoriesRange.getA1Notation(),
        sheet: categoriesRange.getSheet().getName()
      } : 'NULL - Not accessible via getRangeByName()',
      subCategoriesRangeInfo: subCategoriesRange ? {
        range: subCategoriesRange.getA1Notation(),
        sheet: subCategoriesRange.getSheet().getName()
      } : 'NULL - Not accessible via getRangeByName()'
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

function testRangeAccess() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Test multiple ways to access the range
    const namedRange = ss.getRangeByName('Categories');
    const directRange = ss.getRange('Categories!B114:B141');
    
    return {
      success: true,
      namedRangeResult: namedRange ? namedRange.getA1Notation() : 'NULL',
      directRangeResult: directRange ? directRange.getA1Notation() : 'NULL',
      message: namedRange ? 'Named range works!' : 'Named range returns null, using direct range'
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}



