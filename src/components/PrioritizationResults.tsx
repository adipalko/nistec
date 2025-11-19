import React, { useState } from 'react';
import { FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  // If it's a number, treat as Excel serial date
  if (!isNaN(Number(dateStr))) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const days = Number(dateStr);
    excelEpoch.setDate(excelEpoch.getDate() + days);
    return excelEpoch.toLocaleDateString('he-IL');
  }
  // Otherwise, try to parse as a normal date string
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('he-IL');
}

function formatTime(timeStr: any) {
  if (timeStr === undefined || timeStr === null || timeStr === '') return '';
  const str = String(timeStr);
  const num = parseFloat(str.replace(',', '.'));
  if (isNaN(num)) return str;

  let hours = 0;
  let minutes = 0;

  if (num <= 1 && num >= 0) {
    const totalHours = num * 24;
    hours = Math.floor(totalHours);
    minutes = Math.round((totalHours - hours) * 60);
  } else {
    hours = Math.floor(num);
    minutes = Math.round((num - hours) * 60);
  }

  const minStr = minutes.toString().padStart(2, '0');
  return `${hours}:${minStr}`;
}

const HIDDEN_COLUMNS = ['איש הנדסה', 'פעולה', 'צוות', 'תאור מוצר'];

interface PrioritizationResultsProps {
  stations: any[];
}

const getWorkCenter = (row: any) =>
  row['מרכז עבודה'] || row['Station Name'] || row['תחנה'] || row['תחנת עבודה'] || row['station'] || '';

const getTeam = (row: any) => row['צוות'] || '';

const getRemainingToExecute = (row: any): number | null => {
  const directKeys = [
    'יתרה לביצוע',
    'יתרה',
    'Remaining To Execute',
    'Remaining to Execute',
    'Balance To Complete',
    'Balance to Complete',
  ];

  for (const key of directKeys) {
    const val = row[key];
    if (val !== undefined && val !== null && val !== '') {
      const num = parseFloat(String(val).replace(/,/g, '').replace(/\s/g, ''));
      if (!isNaN(num)) return num;
    }
  }

  // Fallback: search for any key that includes the Hebrew phrase
  const dynamicKey = Object.keys(row).find(
    key =>
      key.includes('יתרה') && key.includes('ביצוע')
  );
  if (dynamicKey) {
    const val = row[dynamicKey];
    if (val !== undefined && val !== null && val !== '') {
      const num = parseFloat(String(val).replace(/,/g, '').replace(/\s/g, ''));
      if (!isNaN(num)) return num;
    }
  }

  return null;
};

const parseDateValue = (value: any): Date | null => {
  if (value === undefined || value === null || value === '') return null;
  const dateStr = String(value);
  if (!isNaN(Number(dateStr)) && dateStr.trim() !== '') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const days = Number(dateStr);
    const parsedDate = new Date(excelEpoch);
    parsedDate.setDate(parsedDate.getDate() + days);
    return parsedDate;
  }
  const dateParts = dateStr.split('.');
  if (dateParts.length === 3) {
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const year = parseInt(dateParts[2], 10);
    const parsedDate = new Date(year, month, day);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const getExpectedCompletionDate = (row: any): Date | null => {
  const expectedDateStr = row['מועד סיום צפוי'] || row['Expected Completion Date'] || '';
  return parseDateValue(expectedDateStr);
};

const sortStations = (rows: any[]) =>
  rows.slice().sort((a, b) => {
    const supplyDateA = getSupplyCompletionDateAsDate(a);
    const supplyDateB = getSupplyCompletionDateAsDate(b);

    if (supplyDateA && supplyDateB) {
      const diff = supplyDateA.getTime() - supplyDateB.getTime();
      if (diff !== 0) return diff;
    } else if (supplyDateA && !supplyDateB) return -1;
    else if (!supplyDateA && supplyDateB) return 1;

    const remainingA = getRemainingToExecute(a);
    const remainingB = getRemainingToExecute(b);

    if (remainingA !== null && remainingB === null) return -1;
    if (remainingA === null && remainingB !== null) return 1;
    if (remainingA !== null && remainingB !== null) {
      const diff = remainingA - remainingB;
      if (diff !== 0) return diff;
    }

    const prioA = getPriorityNumber(a['הערות מנהל פרויקט'] || a['Internal Priority']);
    const prioB = getPriorityNumber(b['הערות מנהל פרויקט'] || b['Internal Priority']);

    if (prioA !== null && prioB === null) return -1;
    if (prioA === null && prioB !== null) return 1;

    if (prioA !== null && prioB !== null) {
      if (prioA !== prioB) return prioA - prioB;
    }

    return 0;
  });

// Helper function to get supply completion date as Date object for sorting
const getSupplyCompletionDateAsDate = (row: any): Date | null => {
  // Get the quantity value
  const allKeys = Object.keys(row);
  const quantityKeys = allKeys.filter(key => 
    key.includes('כמות') && (key.includes('פק') || key.includes('פקיע') || key.includes('הפקיע'))
  );
  
  let quantityValue = '0';
  if (quantityKeys.length > 0) {
    for (const key of quantityKeys) {
      const value = row[key];
      if (value !== undefined && value !== null && value !== '' && value !== 0) {
        quantityValue = value;
        break;
      }
    }
    if (!quantityValue || quantityValue === '0') {
      quantityValue = row[quantityKeys[0]] || '0';
    }
  }
  
  const quantity = parseFloat(String(quantityValue).replace(/,/g, '').replace(/\s/g, ''));
  
  const expectedDate = getExpectedCompletionDate(row);
  if (!expectedDate) return null;
  
  // Calculate supply completion date
  let supplyDate: Date;
  if (isNaN(quantity) || quantity <= 30) {
    supplyDate = new Date(expectedDate);
  } else {
    supplyDate = new Date(expectedDate);
    supplyDate.setDate(supplyDate.getDate() + 28);
  }
  
  return supplyDate;
};

const calculateSupplyCompletionDate = (row: any): string => {
  // Get the quantity value - search all keys for quantity column
  // Try to find the exact column name from the actual row keys
  const allKeys = Object.keys(row);
  const quantityKeys = allKeys.filter(key => 
    key.includes('כמות') && (key.includes('פק') || key.includes('פקיע') || key.includes('הפקיע'))
  );
  
  // Use the first matching key that has a non-zero/non-empty value, or just use the first match
  let quantityValue = '0';
  let foundKey = '';
  
  if (quantityKeys.length > 0) {
    // Try each key and use the first one with a valid value
    for (const key of quantityKeys) {
      const value = row[key];
      if (value !== undefined && value !== null && value !== '' && value !== 0) {
        quantityValue = value;
        foundKey = key;
        break;
      }
    }
    // If no key had a value, just use the first key (might be 0, but that's okay)
    if (!foundKey) {
      quantityValue = row[quantityKeys[0]];
      foundKey = quantityKeys[0];
    }
  }
  
  const quantity = parseFloat(String(quantityValue).replace(/,/g, '').replace(/\s/g, ''));
  
  // Debug logging
  console.log('=== Supply Date Calculation Debug ===');
  console.log('All row keys:', Object.keys(row));
  console.log('Quantity matching keys:', quantityKeys);
  console.log('Found quantity key:', foundKey);
  console.log('Quantity value (raw):', quantityValue);
  console.log('Quantity value (parsed):', quantity);
  console.log('Is quantity > 30?', quantity > 30);
  
  const expectedDate = getExpectedCompletionDate(row);
  console.log('Expected date (raw):', row['מועד סיום צפוי'] || row['Expected Completion Date'] || '');
  
  if (!expectedDate) {
    console.log('No expected date found, returning empty');
    return '';
  }
  console.log('Parsed expected date:', expectedDate);
  
  // Calculate supply completion date
  let supplyDate: Date;
  if (isNaN(quantity) || quantity <= 30) {
    supplyDate = new Date(expectedDate);
    console.log('Quantity <= 30, using expected date:', supplyDate);
  } else {
    supplyDate = new Date(expectedDate);
    supplyDate.setDate(supplyDate.getDate() + 28);
    console.log('Quantity > 30, adding 28 days:', expectedDate, '->', supplyDate);
  }
  
  const result = supplyDate.toLocaleDateString('he-IL');
  console.log('Final result:', result);
  console.log('=== End Debug ===');
  
  return result;
};

const PrioritizationResults: React.FC<PrioritizationResultsProps> = ({ stations }) => {
  // Get all unique work centers
  const workCenters = Array.from(new Set(stations.map(getWorkCenter).filter(Boolean)));
  
  // Get TU teams if TU exists
  const tuStations = stations.filter(s => getWorkCenter(s) === 'TU');
  const tuTeams = Array.from(new Set(tuStations.map(getTeam).filter(Boolean)));

  // First level: work center selection
  const [selectedWorkCenter, setSelectedWorkCenter] = useState(workCenters[0] || '');
  
  // Second level: team selection (only for TU)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // When work center changes, reset team selection for non-TU centers
  React.useEffect(() => {
    if (selectedWorkCenter !== 'TU') {
      setSelectedTeam(null);
    } else if (tuTeams.length > 0 && selectedTeam === null) {
      // Auto-select first team when TU is selected
      setSelectedTeam(tuTeams[0]);
    }
  }, [selectedWorkCenter, tuTeams, selectedTeam]);

  // Prioritize and filter for the active tab
  const filteredStations = stations.filter((s) => {
    const matchesWorkCenter = getWorkCenter(s) === selectedWorkCenter;
    if (selectedWorkCenter === 'TU' && selectedTeam) {
      return matchesWorkCenter && getTeam(s) === selectedTeam;
    }
    return matchesWorkCenter;
  });

  const prioritized = sortStations(filteredStations);

  // Get all unique headers from the prioritized data
  const allHeaders = prioritized.length > 0 ? Object.keys(prioritized[0]) : [];
  const visibleHeaders = allHeaders.filter(h => !HIDDEN_COLUMNS.includes(h));

  const expectedCompletionIndex = visibleHeaders.indexOf('מועד סיום צפוי');

  const SUPPLY_COMPLETION_COLUMN = 'תאריך סיום אספקות';
  let headersWithCalculated: string[];
  if (visibleHeaders.includes(SUPPLY_COMPLETION_COLUMN)) {
    headersWithCalculated = visibleHeaders;
  } else if (expectedCompletionIndex !== -1) {
    headersWithCalculated = [
      ...visibleHeaders.slice(0, expectedCompletionIndex + 1),
      SUPPLY_COMPLETION_COLUMN,
      ...visibleHeaders.slice(expectedCompletionIndex + 1),
    ];
  } else {
    headersWithCalculated = [...visibleHeaders, SUPPLY_COMPLETION_COLUMN];
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Prioritized Results</h2>
          {prioritized.length > 0 && (
            <button
              className="text-blue-600 hover:text-blue-800 p-1"
              onClick={() => exportToExcel(stations, headersWithCalculated)}
              title="Download Excel"
            >
              <FileDown size={22} />
            </button>
          )}
        </div>
      </div>
      
      {/* First level: Work Center tabs */}
      <div className="flex gap-2 mb-4 justify-end">
        {workCenters.map((workCenter) => (
          <button
            key={workCenter}
            onClick={() => setSelectedWorkCenter(workCenter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
              ${selectedWorkCenter === workCenter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}`}
          >
            {workCenter}
          </button>
        ))}
      </div>
      
      {/* Second level: Team tabs (only for TU) */}
      {selectedWorkCenter === 'TU' && tuTeams.length > 0 && (
        <div className="flex gap-2 mb-4 justify-end">
          {tuTeams.map((team) => (
            <button
              key={team}
              onClick={() => setSelectedTeam(team)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                ${selectedTeam === team ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-green-100'}`}
            >
              {team}
            </button>
          ))}
        </div>
      )}
      {prioritized.length === 0 ? (
        <div className="text-gray-500 p-4">No stations found for this type.</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th key="rank" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              {headersWithCalculated.map((header) => (
                <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {prioritized.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {rowIndex + 1}
                  </div>
                </td>
                {headersWithCalculated.map((header) => (
                  <td key={header} className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {header === 'תאריך סיום אספקות'
                        ? calculateSupplyCompletionDate(row)
                        : header === 'מועד סיום צפוי' || header === 'Expected Completion Date'
                        ? formatDate(row[header])
                        : header.includes('זמן תקן')
                        ? formatTime(row[header])
                        : row[header]}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

function exportToExcel(data: any[], headers: string[]) {
  const SUPPLY_COMPLETION_COLUMN = 'תאריך סיום אספקות';
  const expectedCompletionIndex = headers.indexOf('מועד סיום צפוי');

  let exportHeaders: string[];
  if (headers.includes(SUPPLY_COMPLETION_COLUMN)) {
    exportHeaders = headers;
  } else if (expectedCompletionIndex !== -1) {
    exportHeaders = [
      ...headers.slice(0, expectedCompletionIndex + 1),
      SUPPLY_COMPLETION_COLUMN,
      ...headers.slice(expectedCompletionIndex + 1),
    ];
  } else {
    exportHeaders = [...headers, SUPPLY_COMPLETION_COLUMN];
  }

  const exportHeadersWithRank = ['#', ...exportHeaders];

  const getWorkCenterLocal = (row: any) =>
    row['מרכז עבודה'] || row['Station Name'] || row['תחנה'] || row['תחנת עבודה'] || row['station'] || '';
  const getTeamLocal = (row: any) => row['צוות'] || '';

  const tabGroups: { label: string; rows: any[] }[] = [];
  const workCenters = Array.from(new Set(data.map(getWorkCenterLocal).filter(Boolean)));

  workCenters.forEach((workCenter) => {
    if (workCenter === 'TU') {
      const tuStations = data.filter(s => getWorkCenterLocal(s) === 'TU');
      const teams = Array.from(new Set(tuStations.map(getTeamLocal).filter(Boolean)));
      if (teams.length > 0) {
        teams.forEach((team) => {
          tabGroups.push({
            label: `TU - ${team}`,
            rows: tuStations.filter(row => getTeamLocal(row) === team),
          });
        });
      } else {
        tabGroups.push({ label: 'TU', rows: tuStations });
      }
    } else {
      tabGroups.push({
        label: workCenter,
        rows: data.filter(row => getWorkCenterLocal(row) === workCenter),
      });
    }
  });

  const workbook = XLSX.utils.book_new();

  tabGroups.forEach((group) => {
    if (group.rows.length === 0) return;

    const sortedRows = sortStations(group.rows);
    const sheetData = [exportHeadersWithRank];

    sortedRows.forEach((row, rowIndex) => {
      sheetData.push(
        exportHeadersWithRank.map((header) => {
          if (header === '#') return rowIndex + 1;
          if (header === SUPPLY_COMPLETION_COLUMN) return calculateSupplyCompletionDate(row);
          if (header === 'מועד סיום צפוי' || header === 'Expected Completion Date') {
            const expectedDate = getExpectedCompletionDate(row);
            return expectedDate ? { v: expectedDate, t: 'd', z: 'dd.mm.yyyy' } : '';
          }
          return row[header] ?? '';
        }),
      );
    });

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    const sanitizedName = group.label
      .replace(/[\[\]\\\/\?\*\:]/g, '_')
      .substring(0, 31) || 'Sheet';

    XLSX.utils.book_append_sheet(workbook, worksheet, sanitizedName);
  });

  XLSX.writeFile(workbook, 'prioritized_results.xlsx', { cellDates: true });
}

function getPriorityNumber(val: string | undefined) {
  if (!val) return null;
  const match = val.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

export default PrioritizationResults; 