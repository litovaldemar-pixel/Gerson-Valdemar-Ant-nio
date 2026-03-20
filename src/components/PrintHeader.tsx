import React from 'react';
import { useAppContext } from '../context/AppContext';

const PrintHeader = () => {
  const { companyInfo } = useAppContext();

  if (!companyInfo) return null;

  return (
    <div className="hidden print:flex flex-col items-center justify-center w-full border-b-2 border-slate-800 pb-4 mb-8">
      <h1 className="text-3xl font-black font-headline text-slate-900 uppercase tracking-widest mb-2">
        {companyInfo.name}
      </h1>
      <div className="flex items-center gap-6 text-sm font-medium text-slate-700">
        {companyInfo.nuit && (
          <p>
            <span className="font-bold mr-1">NUIT:</span>
            {companyInfo.nuit}
          </p>
        )}
        {companyInfo.contact && (
          <p>
            <span className="font-bold mr-1">Contacto:</span>
            {companyInfo.contact}
          </p>
        )}
        {companyInfo.location && (
          <p>
            <span className="font-bold mr-1">Localização:</span>
            {companyInfo.location}
          </p>
        )}
      </div>
    </div>
  );
};

export default PrintHeader;