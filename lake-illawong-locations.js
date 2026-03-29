/**
 * lake-illawong-locations.js
 * Lake Illawong Management Central System
 * 
 * Shared static location list for all submission forms.
 * Eliminates the need to fetch unit/location data from the backend
 * on every page load. Units are permanent and will not change.
 * 
 * If a new location is ever required, add it to the LOCATIONS array
 * and redeploy to Netlify. All forms will pick it up automatically.
 * 
 * Used by:
 *   - ResidentSubmissionForm.html
 *   - BulkSubmissionForm.html
 * 
 * NOT used by:
 *   - ZoneRepSubmissionForm.html (loads zone-filtered units from backend)
 * 
 * Version: 1.0
 * Date: March 2026
 */

const LAKE_ILLAWONG_LOCATIONS = [
    'Clubhouse',
    'Common Areas',
    'Unit 1',
    'Unit 2',
    'Unit 3',
    'Unit 4',
    'Unit 5',
    'Unit 6',
    'Unit 7',
    'Unit 8',
    'Unit 9',
    'Unit 10',
    'Unit 11',
    'Unit 12',
    'Unit 13',
    'Unit 14',
    'Unit 15',
    'Unit 16',
    'Unit 17',
    'Unit 18',
    'Unit 19',
    'Unit 20',
    'Unit 21',
    'Unit 22',
    'Unit 23',
    'Unit 24',
    'Unit 25',
    'Unit 26',
    'Unit 27',
    'Unit 28',
    'Unit 29',
    'Unit 30',
    'Unit 31',
    'Unit 32',
    'Unit 33',
    'Unit 34',
    'Unit 35',
    'Unit 36',
    'Unit 37',
    'Unit 38',
    'Unit 39',
    'Unit 40',
    'Unit 41',
    'Unit 42',
    'Unit 43',
    'Unit 44'
    
];
