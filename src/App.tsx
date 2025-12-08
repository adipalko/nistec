import React, { useState } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import GenerateButton from './components/GenerateButton';
import ResultsTable from './components/ResultsTable';
import ExportButton from './components/ExportButton';
import Auth from './components/Auth';
import { Station } from './types';
import { prioritizeStations } from './utils/prioritization';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LogOut, ArrowLeft } from 'lucide-react';
import PrioritizationResults from './components/PrioritizationResults';
import UploadedFiles from './components/UploadedFiles';
import { trackLogout } from './utils/analytics';

const ProtectedApp: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [prioritizedStations, setPrioritizedStations] = useState<Station[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'files'>('files');
  const [showResultsPage, setShowResultsPage] = useState(false);
  const [resultsData, setResultsData] = useState<any[] | null>(null);

  const handleFileProcessed = (processedStations: any[]) => {
    setStations(processedStations);
    setResultsData(processedStations);
    setShowResultsPage(true);
    setActiveTab('files');
  };

  const handleGenerate = async () => {
    if (stations.length === 0) return;
    
    setIsGenerating(true);
    
    try {
      const results = await prioritizeStations(stations);
      setPrioritizedStations(results);
      setHasResults(true);
    } catch (error) {
      console.error('Error generating prioritization:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      trackLogout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  if (!currentUser) {
    return <Auth />;
  }

  if (showResultsPage && resultsData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <button
            onClick={() => setShowResultsPage(false)}
            className="mb-4"
            title="Back"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <ArrowLeft size={28} color="#2563eb" />
          </button>
          <PrioritizationResults stations={resultsData} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between mb-4">
            <Header 
              title="Nistec Station Prioritization Tool" 
              subtitle="Upload your station data and get a smart, ranked list in seconds"
            />
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <LogOut size={18} className="mr-2" />
              Sign Out
            </button>
          </div>
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('files')}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === 'files'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                My Files
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === 'upload'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Upload File
              </button>
            </nav>
          </div>

          {activeTab === 'files' && (
            <div className="bg-white rounded-lg shadow">
              <UploadedFiles onShowResults={(stations) => {
                setResultsData(stations);
                setShowResultsPage(true);
              }} />
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="bg-white rounded-lg shadow p-6">
              <FileUpload onFileProcessed={handleFileProcessed} isProcessing={isProcessingFile} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return currentUser ? <ProtectedApp /> : <Auth />;
};

const AppWithAuth: React.FC = () => {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};

export default AppWithAuth;