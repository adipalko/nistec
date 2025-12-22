import React, { useEffect, useState } from 'react';
import { storage } from '../config/firebase';
import { ref, listAll, getDownloadURL, getMetadata, deleteObject } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { FileUp, Download, Trash2, AlertCircle, BarChart2 } from 'lucide-react';
import { Station } from '../types';
import PrioritizationResults from './PrioritizationResults';

interface FileMetadata {
  name: string;
  fullPath: string;
  downloadURL: string;
  uploadedAt: string;
  originalName: string;
  stations?: Station[];
}

interface UploadedFilesProps {
  onShowResults: (stations: any[]) => void;
}

const UploadedFiles: React.FC<UploadedFilesProps> = ({ onShowResults }) => {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const fetchFiles = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      // List all files in the user's uploads directory
      const uploadsRef = ref(storage, `uploads/${currentUser.uid}`);
      const result = await listAll(uploadsRef);

      // Get metadata and download URL for each file
      const filesData = await Promise.all(
        result.items.map(async (item) => {
          const metadata = await getMetadata(item);
          const downloadURL = await getDownloadURL(item);
          return {
            name: item.name,
            fullPath: item.fullPath,
            downloadURL,
            uploadedAt: metadata.customMetadata?.uploadedAt || new Date().toISOString(),
            originalName: metadata.customMetadata?.originalName || item.name,
            stations: metadata.customMetadata?.stations ? JSON.parse(metadata.customMetadata.stations) : []
          };
        })
      );

      // Sort files by upload date (newest first)
      filesData.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      setFiles(filesData);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load files. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [currentUser]);

  const handleDownload = async (file: FileMetadata) => {
    try {
      setDownloadError(null);
      
      // Get a fresh download URL in case the stored one expired
      const fileRef = ref(storage, file.fullPath);
      const freshDownloadURL = await getDownloadURL(fileRef);
      
      // Try to download using the fresh URL
      const response = await fetch(freshDownloadURL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (err) {
      console.error('Error downloading file:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setDownloadError(`Failed to download "${file.originalName}": ${errorMessage}`);
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setDownloadError(null);
      }, 5000);
    }
  };

  const handleDelete = async (file: FileMetadata) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      const fileRef = ref(storage, file.fullPath);
      await deleteObject(fileRef);
      setFiles(files.filter(f => f.fullPath !== file.fullPath));
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Failed to delete file. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-b-transparent border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-600">
        <AlertCircle className="mr-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <FileUp className="mx-auto h-12 w-12 mb-4" />
        <p>No files uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {downloadError && (
        <div className="mb-4 flex items-center p-4 text-red-600 bg-red-50 rounded-lg">
          <AlertCircle className="mr-2 flex-shrink-0" />
          <p className="text-sm">{downloadError}</p>
        </div>
      )}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                File Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Upload Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stations
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {files.map((file) => (
              <tr key={file.fullPath} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {file.originalName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {formatDate(file.uploadedAt)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">
                    {file.stations && file.stations.length > 0
                      ? Array.from(
                          new Set(
                            file.stations.map(
                              (s: any) =>
                                s["מרכז עבודה"] ||
                                s["Station Name"] ||
                                s["תחנה"] ||
                                s["תחנת עבודה"] ||
                                s["station"] ||
                                "Unknown"
                            )
                          )
                        ).join(', ')
                      : "No stations"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                  <button
                    onClick={() => handleDownload(file)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Download"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onShowResults(file.stations || [])}
                    className="text-green-600 hover:text-green-900"
                    title="View Results"
                  >
                    <BarChart2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(file)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UploadedFiles; 