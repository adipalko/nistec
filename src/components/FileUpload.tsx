import React, { useState, useRef } from 'react';
import { FileUploadProps, Station } from '../types';
import { parseFile } from '../utils/fileParser';
import { FileUp, AlertCircle, Check } from 'lucide-react';
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { trackFileUpload } from '../utils/analytics';

const FileUpload: React.FC<FileUploadProps> = ({ onFileProcessed, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const resetState = () => {
    setFileName(null);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadToFirebase = async (file: File, stations: Station[]) => {
    if (!currentUser) {
      throw new Error('You must be logged in to upload files');
    }

    try {
      // Create a safe filename by removing special characters and adding timestamp
      const timestamp = new Date().getTime();
      const safeFileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const fileRef = ref(storage, `uploads/${currentUser.uid}/${safeFileName}`);
      
      // Add metadata to the file
      const metadata = {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadedBy: currentUser.uid,
          uploadedAt: new Date().toISOString(),
          stations: JSON.stringify(stations)
        }
      };

      // Upload the file with metadata
      const snapshot = await uploadBytes(fileRef, file, metadata);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setSuccess(false);
    
    const validTypes = [
      'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (!validTypes.includes(file.type)) {
      setError(`Invalid file type: ${file.type}. Please upload a valid CSV or Excel file`);
      return;
    }
    
    setFileName(file.name);
    
    try {
      // Process the file first to get stations
      const stations = await parseFile(file);
      
      // Upload to Firebase Storage with station data
      const downloadURL = await uploadToFirebase(file, stations);
      console.log('File uploaded successfully:', downloadURL);
      
      // Update parent component
      onFileProcessed(stations);
      setSuccess(true);
      
      // Track file upload
      trackFileUpload(file.name);
    } catch (err) {
      console.error('File processing error:', err);
      setError((err as Error).message || 'Failed to process file. Please try again.');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative">
      <div 
        className={`
          border-2 border-dashed rounded-xl p-8 transition-all duration-300
          ${dragActive 
            ? 'border-blue-500 bg-blue-50/50' 
            : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
          onChange={handleChange}
          className="hidden"
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center justify-center py-6">
          <div className={`
            p-4 rounded-full mb-4
            ${dragActive ? 'bg-blue-100' : 'bg-gray-100'}
          `}>
            <FileUp 
              size={32} 
              className={dragActive ? 'text-blue-500' : 'text-gray-400'} 
            />
          </div>
          
          <p className="text-lg font-medium mb-2 text-gray-700">
            {fileName ? fileName : 'Drag and drop your file here'}
          </p>
          
          <p className="text-sm text-gray-500 mb-6">
            Upload a CSV or Excel file with one column titled 'Station Name'
          </p>
          
          <button 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 
                     transition-colors duration-200 font-medium shadow-md hover:shadow-lg"
            disabled={isProcessing}
          >
            Browse Files
          </button>
        </div>
      </div>
      
      {error && (
        <div className="flex items-center mt-4 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle size={16} className="mr-2 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {success && !error && (
        <div className="flex items-center mt-4 text-green-600 bg-green-50 p-3 rounded-lg">
          <Check size={16} className="mr-2 flex-shrink-0" />
          <p className="text-sm">File uploaded successfully</p>
        </div>
      )}
      
      {isProcessing && (
        <div className="flex items-center justify-center mt-4 text-blue-600">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-b-transparent"></div>
          <p className="ml-2 text-sm">Processing file...</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;