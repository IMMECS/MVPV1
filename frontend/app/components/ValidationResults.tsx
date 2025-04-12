'use client';

import { RuleResult } from '../api/documentService';

interface ValidationResultsProps {
  ruleResults: RuleResult[];
  structureWarnings?: string[];
  showDetailsByDefault?: boolean;
}

export default function ValidationResults({
  ruleResults,
  structureWarnings = [],
  showDetailsByDefault = false
}: ValidationResultsProps) {
  const passedRules = ruleResults.filter(rule => rule.passed).length;
  const totalRules = ruleResults.length;
  const passRate = Math.round((passedRules / totalRules) * 100);
  
  return (
    <div className="space-y-6">
      {/* Summary Banner */}
      <div className="flex justify-between p-4 bg-gray-50 rounded-lg items-center">
        <div>
          <h3 className="text-lg font-medium">Validation Summary</h3>
          <p className="text-sm text-gray-500">
            {passedRules} of {totalRules} rules passed ({passRate}%)
          </p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center mb-1">
            <div className="w-32 bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${passRate >= 90 ? 'bg-green-500' : passRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${passRate}%` }}
              ></div>
            </div>
            <span className="ml-2 text-md font-semibold">{passRate}%</span>
          </div>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full 
            ${passRate >= 90 ? 'bg-green-100 text-green-800' : 
              passRate >= 70 ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'}`}
          >
            {passRate >= 90 ? 'Compliant' : passRate >= 70 ? 'Partially Compliant' : 'Non-compliant'}
          </span>
        </div>
      </div>
      
      {/* Rules */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Rule Validation Results</h3>
        {ruleResults.map((rule) => (
          <details key={rule.ruleId} open={showDetailsByDefault}>
            <summary 
              className={`p-4 flex justify-between items-center cursor-pointer rounded-lg
                ${rule.passed ? 'bg-green-50' : 'bg-red-50'}`}
            >
              <div className="flex items-center">
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center
                    ${rule.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                >
                  {rule.passed ? '✓' : '✗'}
                </div>
                <span className="ml-3 font-medium">{rule.description}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">{rule.ruleId}</span>
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </summary>
            <div className="mt-2 px-4 py-3 bg-white border border-gray-100 rounded-b-lg">
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {rule.details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </div>
      
      {/* Structure Warnings */}
      {structureWarnings.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Document Structure Warnings</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
            <ul className="list-disc pl-5 text-sm text-yellow-800 space-y-1">
              {structureWarnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            These warnings do not affect compliance but may indicate issues with document structure.
          </p>
        </div>
      )}
    </div>
  );
} 