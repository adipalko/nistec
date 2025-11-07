import React, { useState } from 'react';
import { FileDown } from 'lucide-react';

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
  
  // Get expected completion date
  const expectedDateStr = row['מועד סיום צפוי'] || row['Expected Completion Date'] || '';
  if (!expectedDateStr) return null;
  
  // Parse the expected date
  let expectedDate: Date;
  const dateStr = String(expectedDateStr);
  if (!isNaN(Number(dateStr)) && dateStr.trim() !== '') {
    // Excel serial date
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const days = Number(dateStr);
    expectedDate = new Date(excelEpoch);
    expectedDate.setDate(expectedDate.getDate() + days);
  } else {
    // Try parsing as date string (handle DD.MM.YYYY format)
    const dateParts = dateStr.split('.');
    if (dateParts.length === 3) {
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const year = parseInt(dateParts[2], 10);
      expectedDate = new Date(year, month, day);
    } else {
      expectedDate = new Date(dateStr);
    }
  }
  
  if (isNaN(expectedDate.getTime())) return null;
  
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
  
  // Get expected completion date (מועד סיום צפוי)
  const expectedDateStr = row['מועד סיום צפוי'] || row['Expected Completion Date'] || '';
  console.log('Expected date (raw):', expectedDateStr);
  
  if (!expectedDateStr) {
    console.log('No expected date found, returning empty');
    return '';
  }
  
  // Parse the expected date (handle Excel serial numbers)
  let expectedDate: Date;
  const dateStr = String(expectedDateStr);
  if (!isNaN(Number(dateStr)) && dateStr.trim() !== '') {
    // Excel serial date
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const days = Number(dateStr);
    expectedDate = new Date(excelEpoch);
    expectedDate.setDate(expectedDate.getDate() + days);
    console.log('Parsed as Excel serial date:', expectedDate);
  } else {
    // Try parsing as date string (handle DD.MM.YYYY format)
    const dateParts = dateStr.split('.');
    if (dateParts.length === 3) {
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // Months are 0-indexed
      const year = parseInt(dateParts[2], 10);
      expectedDate = new Date(year, month, day);
      console.log('Parsed as DD.MM.YYYY:', { day, month: month + 1, year }, '->', expectedDate);
    } else {
      expectedDate = new Date(dateStr);
      console.log('Parsed as standard date string:', expectedDate);
    }
  }
  
  if (isNaN(expectedDate.getTime())) {
    console.log('Invalid date, returning empty');
    return '';
  }
  
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
  const prioritized = stations
    .filter((s) => {
      const matchesWorkCenter = getWorkCenter(s) === selectedWorkCenter;
      if (selectedWorkCenter === 'TU' && selectedTeam) {
        return matchesWorkCenter && getTeam(s) === selectedTeam;
      }
      return matchesWorkCenter;
    })
    .sort((a, b) => {
      // First priority: תאריך סיום אספקות (supply completion date)
      const supplyDateA = getSupplyCompletionDateAsDate(a);
      const supplyDateB = getSupplyCompletionDateAsDate(b);
      
      if (supplyDateA && supplyDateB) {
        const diff = supplyDateA.getTime() - supplyDateB.getTime();
        if (diff !== 0) return diff;
      } else if (supplyDateA && !supplyDateB) return -1;
      else if (!supplyDateA && supplyDateB) return 1;

      // Second priority: Internal priority (עדיפות)
      const prioA = getPriorityNumber(a['הערות מנהל פרויקט'] || a['Internal Priority']);
      const prioB = getPriorityNumber(b['הערות מנהל פרויקט'] || b['Internal Priority']);

      // Rows with priority come first
      if (prioA !== null && prioB === null) return -1;
      if (prioA === null && prioB !== null) return 1;

      // If both have priority, sort by priority number
      if (prioA !== null && prioB !== null) {
        if (prioA !== prioB) return prioA - prioB;
      }

      return 0;
    });

  // Get all unique headers from the prioritized data
  const allHeaders = prioritized.length > 0 ? Object.keys(prioritized[0]) : [];
  const visibleHeaders = allHeaders.filter(h => !HIDDEN_COLUMNS.includes(h));
  
  // Add the calculated column "תאריך סיום אספקות" to visible headers (if not already present)
  const SUPPLY_COMPLETION_COLUMN = 'תאריך סיום אספקות';
  const headersWithCalculated = visibleHeaders.includes(SUPPLY_COMPLETION_COLUMN) 
    ? visibleHeaders 
    : [...visibleHeaders, SUPPLY_COMPLETION_COLUMN];

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Prioritized Results</h2>
          {prioritized.length > 0 && (
            <button
              className="text-blue-600 hover:text-blue-800 p-1"
              onClick={() => exportToCSV(stations, allHeaders)}
              title="Download CSV"
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

function exportToCSV(data: any[], headers: string[]) {
  // Group by work center and team (same logic as tabs)
  const getWorkCenter = (row: any) =>
    row['מרכז עבודה'] || row['Station Name'] || row['תחנה'] || row['תחנת עבודה'] || row['station'] || '';
  const getTeam = (row: any) => row['צוות'] || '';
  
  const tabGroups: { label: string; workCenter: string; team?: string }[] = [];
  const workCenters = Array.from(new Set(data.map(getWorkCenter).filter(Boolean)));

  workCenters.forEach((workCenter) => {
    if (workCenter === 'TU') {
      // For TU, create tabs by team
      const tuStations = data.filter(s => getWorkCenter(s) === 'TU');
      const teams = Array.from(new Set(tuStations.map(getTeam).filter(Boolean)));
      if (teams.length > 0) {
        teams.forEach((team) => {
          tabGroups.push({ label: `TU - ${team}`, workCenter: 'TU', team });
        });
      } else {
        tabGroups.push({ label: 'TU', workCenter: 'TU' });
      }
    } else {
      // For other work centers, just show the work center
      tabGroups.push({ label: workCenter, workCenter });
    }
  });

  // Add calculated column to headers if not present
  const SUPPLY_COMPLETION_COLUMN = 'תאריך סיום אספקות';
  const exportHeaders = headers.includes(SUPPLY_COMPLETION_COLUMN) 
    ? headers 
    : [...headers, SUPPLY_COMPLETION_COLUMN];
  
  // Add rank column as first column
  const exportHeadersWithRank = ['#', ...exportHeaders];

  const csvRows = [exportHeadersWithRank.join(',')];

  tabGroups.forEach((group, idx) => {
    // Filter and sort for this group
    const groupData = data
      .filter((row) => {
        const matchesWorkCenter = getWorkCenter(row) === group.workCenter;
        if (group.workCenter === 'TU' && group.team) {
          return matchesWorkCenter && getTeam(row) === group.team;
        }
        return matchesWorkCenter;
      })
      .sort((a, b) => {
        // First priority: תאריך סיום אספקות (supply completion date)
        const supplyDateA = getSupplyCompletionDateAsDate(a);
        const supplyDateB = getSupplyCompletionDateAsDate(b);
        
        if (supplyDateA && supplyDateB) {
          const diff = supplyDateA.getTime() - supplyDateB.getTime();
          if (diff !== 0) return diff;
        } else if (supplyDateA && !supplyDateB) return -1;
        else if (!supplyDateA && supplyDateB) return 1;

        // Second priority: Internal priority (עדיפות)
        const prioA = getPriorityNumber(a['הערות מנהל פרויקט'] || a['Internal Priority']);
        const prioB = getPriorityNumber(b['הערות מנהל פרויקט'] || b['Internal Priority']);

        // Rows with priority come first
        if (prioA !== null && prioB === null) return -1;
        if (prioA === null && prioB !== null) return 1;

        // If both have priority, sort by priority number
        if (prioA !== null && prioB !== null) {
          if (prioA !== prioB) return prioA - prioB;
        }

        return 0;
      });
    
    // Add a blank row between groups (except before the first)
    if (idx > 0) csvRows.push('');
    // Add the group rows with rank numbers
    groupData.forEach((row, rowIndex) => {
      csvRows.push(exportHeadersWithRank.map(h => {
        if (h === '#') {
          return '"' + (rowIndex + 1) + '"';
        }
        if (h === SUPPLY_COMPLETION_COLUMN) {
          return '"' + calculateSupplyCompletionDate(row) + '"';
        }
        return '"' + (row[h] ?? '') + '"';
      }).join(','));
    });
  });

  const csvContent = csvRows.join('\n');
  // Add BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'prioritized_results.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function getPriorityNumber(val: string | undefined) {
  if (!val) return null;
  const match = val.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

export default PrioritizationResults; 