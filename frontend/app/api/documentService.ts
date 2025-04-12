import apiClient from './apiClient';

export interface DocumentListItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  overallStatus: boolean | null;
  rulesCount?: number;
  passedRules?: number;
}

export interface RuleResult {
  ruleId: string;
  description: string;
  passed: boolean;
  details: string[];
}

export interface DocumentDetails extends DocumentListItem {
  ruleResults: RuleResult[];
  structureWarnings: string[];
  processingError?: string;
  text?: string;
}

// Document service for handling document operations
const documentService = {
  /**
   * Upload a document for validation
   * @param file The file to upload
   */
  async uploadDocument(file: File): Promise<DocumentListItem> {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<DocumentListItem>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
  
  /**
   * Get a list of all documents for the current user
   */
  async getDocuments(): Promise<DocumentListItem[]> {
    const response = await apiClient.get<DocumentListItem[]>('/documents');
    return response.data;
  },
  
  /**
   * Get detailed information about a specific document
   * @param id Document ID
   */
  async getDocumentDetails(id: string): Promise<DocumentDetails> {
    const response = await apiClient.get<DocumentDetails>(`/documents/${id}`);
    return response.data;
  },
  
  /**
   * Delete a document
   * @param id Document ID
   */
  async deleteDocument(id: string): Promise<void> {
    await apiClient.delete(`/documents/${id}`);
  },
  
  /**
   * Download the validation report for a document
   * @param id Document ID
   */
  async downloadReport(id: string): Promise<Blob> {
    const response = await apiClient.get(`/documents/${id}/report`, {
      responseType: 'blob',
    });
    
    return response.data;
  },
  
  /**
   * Check the processing status of a document
   * @param id Document ID
   */
  async checkStatus(id: string): Promise<{ status: string }> {
    const response = await apiClient.get<{ status: string }>(`/documents/${id}/status`);
    return response.data;
  },
};

export default documentService; 