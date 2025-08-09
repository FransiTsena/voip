import React from "react";

interface FormRowProps {
    label: string;
    tooltip?: string;
    children: React.ReactNode;
  }
  
  const FormRow: React.FC<FormRowProps> = React.memo(({ label, tooltip, children }) => (
    <div className="flex items-center border-b border-gray-200 py-4 last:border-b-0">
      <div className="w-1/3 pr-4 text-left text-gray-700 font-medium flex items-center justify-start">
        {label}
        {tooltip && (
          <span className="ml-2 text-gray-400 cursor-help" title={tooltip}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        )}
      </div>
      <div className="w-2/3 pl-4">
        {children}
      </div>
    </div>
  ));

  export default FormRow;