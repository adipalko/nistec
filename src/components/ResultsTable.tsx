import React, { useState } from 'react';
import { ResultsTableProps } from '../types';
import { Award, Star, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 5;

const ResultsTable: React.FC<ResultsTableProps> = ({ stations, isLoading }) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  if (isLoading) {
    return (
      <div className="animate-pulse bg-white rounded-2xl shadow-lg overflow-hidden p-6">
        <div className="h-10 bg-gray-200 rounded-lg mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="grid grid-cols-3 gap-4">
              <div className="h-8 bg-gray-200 rounded-lg col-span-1"></div>
              <div className="h-8 bg-gray-200 rounded-lg col-span-1"></div>
              <div className="h-8 bg-gray-200 rounded-lg col-span-1"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stations || stations.length === 0) {
    return null;
  }

  const totalPages = Math.ceil(stations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentStations = stations.slice(startIndex, endIndex);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Award className="text-white" size={24} />
            <h2 className="text-xl font-bold text-white">Prioritized Stations</h2>
          </div>
          <div className="text-sm text-blue-100">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Station Name
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentStations.map((station) => (
              <tr 
                key={station.name} 
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {station.rank === 1 && (
                      <Star className="mr-2 text-yellow-400" size={18} fill="currentColor" />
                    )}
                    <span className={`text-sm ${station.rank === 1 ? 'font-bold' : ''}`}>
                      {station.rank}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {station.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {station.score ? station.score.toFixed(2) : 'N/A'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className={`
                relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg
                transition-colors duration-200
                ${currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow'
                }
              `}
            >
              <ChevronLeft size={16} className="mr-1" />
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className={`
                relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg
                transition-colors duration-200
                ${currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow'
                }
              `}
            >
              Next
              <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsTable;