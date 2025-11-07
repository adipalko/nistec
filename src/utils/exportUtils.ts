import * as XLSX from 'xlsx';
import { Station } from '../types';

export const exportToExcel = (data: Station[], fileName: string = 'prioritized-stations'): void => {
  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  
  // Convert data to worksheet format
  const worksheetData = data.map(station => ({
    'Rank': station.rank,
    'Station Name': station.name,
    'Score': station.score?.toFixed(2) || 'N/A'
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Prioritized Stations');
  
  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};