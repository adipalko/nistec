import React from 'react';
import { ExportButtonProps } from '../types';
import { exportToExcel } from '../utils/exportUtils';
import { FileDown } from 'lucide-react';

const ExportButton: React.FC<ExportButtonProps> = ({ 
  data, 
  disabled, 
  fileName = 'prioritized-stations' 
}) => {
  const handleExport = () => {
    if (data.length > 0) {
      exportToExcel(data, fileName);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || data.length === 0}
      className={`
        flex items-center justify-center
        px-6 py-3 rounded-xl text-sm font-medium
        transition-all duration-200
        ${disabled || data.length === 0
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
          : 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
        }
      `}
    >
      <FileDown size={18} className="mr-2" />
      Export to Excel
    </button>
  );
};

export default ExportButton;