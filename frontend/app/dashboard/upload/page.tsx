'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FileUploader from '../../components/FileUploader';
import documentService from '../../api/documentService';
import Header from '../../components/Header';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Upload the file
      const result = await documentService.uploadDocument(file);
      
      // Redirect to the document page
      router.push(`/dashboard/documents/${result.id}`);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="card">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Upload a Document for Validation</h2>
              <p className="text-gray-600">
                Upload your .docx or .pdf file (max 10MB) to analyze its compliance with Swedish Company Law (ABL).
              </p>
            </div>

            <FileUploader 
              onFileSelected={handleFileSelected}
              maxFileSize={10 * 1024 * 1024} // 10MB
              acceptedFileTypes={['.docx', '.pdf']}
            />

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-lg font-medium">File Requirements</h3>
              <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
                <li>File must be in .docx or .pdf format</li>
                <li>Maximum file size is 10MB</li>
                <li>Document should be in Swedish or English</li>
                <li>Documents are automatically deleted after 24 hours</li>
              </ul>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <Link href="/dashboard" className="btn-secondary">
                Cancel
              </Link>
              <button
                type="button"
                className="btn-primary"
                onClick={handleUpload}
                disabled={isUploading || !file}
              >
                {isUploading ? 'Uploading...' : 'Upload and Analyze'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 