import React from 'react';
import { HeaderProps } from '../types';
import { Factory } from 'lucide-react';

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="py-8">
      <div className="flex items-start space-x-6">
        <div className="flex-shrink-0">
          <div className="p-3 bg-blue-50 rounded-xl">
            <Factory size={32} className="text-blue-600" />
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-lg text-gray-600 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;