'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import documentService, { DocumentDetails } from '../../../api/documentService';
import ValidationResults from '../../../components/ValidationResults';
import Header from '../../../components/Header';

type Props = {
  params: {
    id: string;
  };
};

export default function DocumentPage({ params }: Props) {
  const { id } = params;
  const router = useRouter();
  
  const [document, setDocument] = useState<DocumentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  // Fetch document data
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const data = await documentService.getDocumentDetails(id);
        setDocument(data);
        
        // If document is still processing, start polling
        if (data.processingStatus === 'processing' || data.processingStatus === 'pending') {
          setPolling(true);
        }
      } catch (err: any) {
        console.error('Error fetching document:', err);
        setError(err.response?.data?.message || 'Failed to load document details');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);
  
  // Polling for status updates if document is processing
  useEffect(() => {
    if (!polling) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const { status } = await documentService.checkStatus(id);
        
        if (status === 'completed' || status === 'failed') {
          // If processing is done, fetch full document details
          const data = await documentService.getDocumentDetails(id);
          setDocument(data);
          setPolling(false);
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Polling error:', err);
        setPolling(false);
        clearInterval(pollInterval);
      }
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(pollInterval);
  }, [polling, id]);
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await documentService.deleteDocument(id);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete document');
    }
  };
  
  const handleDownload = async () => {
    try {
      const blob = await documentService.downloadReport(id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `report-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Download error:', err);
      alert(err.response?.data?.message || 'Failed to download report');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="card p-12 text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 bg-blue-200 rounded-full mb-4"></div>
              <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
              <p className="text-gray-500">Loading document data...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="card p-6 bg-red-50 border border-red-200">
            <h2 className="text-xl text-red-700 font-medium mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
            <div className="mt-4">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="card p-6">
            <h2 className="text-xl font-medium mb-2">Document Not Found</h2>
            <p className="text-gray-600">The document you're looking for doesn't exist or has been deleted.</p>
            <div className="mt-4">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex mb-6 items-center">
            <Link href="/dashboard" className="mr-4 text-blue-600 hover:text-blue-800">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Document Analysis</h1>
          </div>
          
          <div className="card mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">{document.fileName}</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Uploaded on {new Date(document.uploadedAt).toLocaleDateString()} at {new Date(document.uploadedAt).toLocaleTimeString()}
                </p>
              </div>
              <div className="flex space-x-3">
                {document.processingStatus === 'completed' && (
                  <button 
                    className="btn-secondary text-sm"
                    onClick={handleDownload}
                  >
                    Download Report
                  </button>
                )}
                <button 
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              </div>
            </div>
            
            {document.processingStatus === 'processing' || document.processingStatus === 'pending' ? (
              <div className="mt-8 text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900">Analysis in Progress</h3>
                <p className="text-gray-500 mt-2">
                  This may take up to 30 seconds. The page will update automatically when complete.
                </p>
              </div>
            ) : document.processingStatus === 'failed' ? (
              <div className="mt-6 p-4 bg-red-50 rounded-md">
                <h3 className="text-lg font-medium text-red-800">Processing Failed</h3>
                <p className="text-red-700 mt-2">{document.processingError || 'An error occurred while processing the document.'}</p>
              </div>
            ) : (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">Status</div>
                    <div className="mt-1 flex items-center">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${document.overallStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {document.overallStatus ? 'Compliant' : 'Non-compliant'}
                      </span>
                    </div>
                  </div>
                  
                  {document.ruleResults && document.ruleResults.length > 0 && (
                    <>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-500">Compliance Rate</div>
                        <div className="mt-1 text-2xl font-semibold">
                          {Math.round((document.ruleResults.filter(r => r.passed).length / document.ruleResults.length) * 100)}%
                        </div>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${document.overallStatus ? 'bg-green-500' : 'bg-yellow-500'}`}
                            style={{ width: `${(document.ruleResults.filter(r => r.passed).length / document.ruleResults.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">File Type</div>
                    <div className="mt-1 font-medium">{document.fileType.toUpperCase()}</div>
                    <div className="mt-1 text-sm text-gray-500">{(document.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                  
                  {document.ruleResults && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-500">Rules Applied</div>
                      <div className="mt-1 font-medium">{document.ruleResults.length}</div>
                      <div className="mt-1 text-sm text-green-600">
                        {document.ruleResults.filter(r => r.passed).length} passed
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Rule Results */}
          {document.processingStatus === 'completed' && document.ruleResults && document.ruleResults.length > 0 && (
            <div className="card mb-6">
              <h3 className="text-lg font-medium mb-4">Validation Results</h3>
              <ValidationResults 
                ruleResults={document.ruleResults} 
                structureWarnings={document.structureWarnings}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 