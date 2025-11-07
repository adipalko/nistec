import React from 'react';
import { GenerateButtonProps } from '../types';
import { Play, Loader } from 'lucide-react';

const GenerateButton: React.FC<GenerateButtonProps> = ({ 
  onGenerate, 
  disabled, 
  isProcessing 
}) => {
  return (
    <button
      onClick={onGenerate}
      disabled={disabled || isProcessing}
      className={`
        flex items-center justify-center
        px-8 py-4 rounded-xl font-medium text-lg
        transition-all duration-200 transform
        ${disabled || isProcessing 
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
          : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-lg hover:shadow-xl'
        }
      `}
    >
      {isProcessing ? (
        <>
          <Loader size={24} className="mr-3 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          <Play size={24} className="mr-3" />
          <span>Generate Prioritization</span>
        </>
      )}
    </button>
  );
};

export default GenerateButton;