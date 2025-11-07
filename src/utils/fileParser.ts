import * as XLSX from 'xlsx';

export const parseFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        
        if (!data) {
          reject(new Error('Failed to read file'));
          return;
        }
        
        // Parse Excel or CSV
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to array of objects using the first row as headers (including Hebrew)
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(rows);
      } catch (error) {
        reject(new Error('Failed to parse file. Please ensure it is a valid CSV or Excel file.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsBinaryString(file);
  });
};