'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  label?: string;
}

export default function FileUploader({
  onFileSelected,
  acceptedFileTypes = ['.docx', '.pdf', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  label = 'Drop your file here, or click to select'
}: FileUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      const rejectionReasons = rejectedFiles[0].errors.map((e: any) => e.message).join(', ');
      setError(`File rejected: ${rejectionReasons}`);
      return;
    }
    
    if (acceptedFiles.length === 0) {
      return;
    }
    
    const file = acceptedFiles[0];
    
    // Additional validation
    if (maxFileSize && file.size > maxFileSize) {
      setError(`File is too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB.`);
      return;
    }
    
    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (
      acceptedFileTypes.length > 0 &&
      !acceptedFileTypes.some(type => 
        type.startsWith('.') 
          ? `.${fileExtension}` === type.toLowerCase() 
          : file.type === type
      )
    ) {
      setError(`Invalid file type. Accepted types: ${acceptedFileTypes.filter(t => t.startsWith('.')).join(', ')}`);
      return;
    }
    
    onFileSelected(file);
  }, [onFileSelected, maxFileSize, acceptedFileTypes]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      // Convert extensions to mime types for react-dropzone
      if (type === '.pdf') acc['application/pdf'] = [];
      else if (type === '.docx') acc['application/vnd.openxmlformats-officedocument.wordprocessingml.document'] = [];
      else if (!type.startsWith('.')) acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxFileSize,
    multiple: false
  });
  
  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDrop={() => setIsDragging(false)}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <svg
            className={`mx-auto h-12 w-12 ${isDragActive || isDragging ? 'text-blue-500' : 'text-gray-400'}`}
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          
          <p className="text-lg font-medium text-gray-700">{label}</p>
          
          <p className="text-sm text-gray-500">
            Accepted file types: {acceptedFileTypes
              .filter(t => t.startsWith('.'))
              .join(', ')} (Max size: {maxFileSize / (1024 * 1024)}MB)
          </p>
        </div>
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
} 