'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import documentService, { DocumentListItem } from '../api/documentService';
import Header from '../components/Header';

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const data = await documentService.getDocuments();
        setDocuments(data);
      } catch (err: any) {
        console.error('Error fetching documents:', err);
        setError(err.response?.data?.message || 'Failed to load documents');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await documentService.deleteDocument(id);
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete document');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Your Documents</h2>
            <Link href="/dashboard/upload" className="btn-primary">
              Upload New Document
            </Link>
          </div>

          {loading ? (
            <div className="card p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : error ? (
            <div className="card p-6 bg-red-50 border border-red-200">
              <h3 className="text-lg font-medium text-red-800">Error</h3>
              <p className="text-red-600 mt-2">{error}</p>
              <button 
                className="mt-4 text-blue-600 hover:text-blue-800"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          ) : documents.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500 mb-4">You haven't uploaded any documents yet.</p>
              <Link href="/dashboard/upload" className="btn-primary">
                Upload Your First Document
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 card">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Compliance
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-md">
                            {doc.fileType === 'pdf' ? (
                              <span className="text-red-500 text-sm font-medium">PDF</span>
                            ) : (
                              <span className="text-blue-500 text-sm font-medium">DOCX</span>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{doc.fileName}</div>
                            <div className="text-sm text-gray-500">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(doc.uploadedAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {doc.processingStatus === 'completed' ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Completed
                          </span>
                        ) : doc.processingStatus === 'processing' ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Processing
                          </span>
                        ) : doc.processingStatus === 'pending' ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            Pending
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {doc.processingStatus === 'completed' ? (
                          <div>
                            {doc.rulesCount && doc.passedRules && (
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2.5">
                                  <div 
                                    className={`h-2.5 rounded-full ${doc.overallStatus ? 'bg-green-500' : 'bg-red-500'}`}
                                    style={{ width: `${(doc.passedRules / doc.rulesCount) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="ml-2 text-sm text-gray-600">
                                  {doc.passedRules}/{doc.rulesCount}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {doc.processingStatus === 'completed' ? (
                          <Link href={`/dashboard/documents/${doc.id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                            View Report
                          </Link>
                        ) : (
                          <span className="text-gray-400 mr-4">View Report</span>
                        )}
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDelete(doc.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 