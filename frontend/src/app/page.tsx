'use client';

import React, { useState, useEffect } from 'react';
import CsvUploader from '../components/CsvUploader';
import PreviewTable from '../components/PreviewTable';
import ResultsDashboard from '../components/ResultsDashboard';

export default function Home() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('dark'); // Default to beautiful dark mode!

  // Data states
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Array<{ rowIndex: number; cells: string[] }>>([]);
  
  // UI Flow states
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [processingState, setProcessingState] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Results states
  const [importedLeads, setImportedLeads] = useState<any[]>([]);
  const [skippedLeads, setSkippedLeads] = useState<any[]>([]);
  const [importComplete, setImportComplete] = useState<boolean>(false);

  // Set initial theme attributes on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('groweasy-theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  // Handle theme toggling
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('groweasy-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Upload file and parse CSV columns & rows (Step 1 -> Step 2)
  const handleFileSelect = async (file: File) => {
    setIsParsing(true);
    setError(null);
    setFileName(file.name);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to parse CSV file.');
      }

      const data = await response.json();
      setHeaders(data.headers);
      setRows(data.rows);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to read the file. Ensure it is a valid CSV spreadsheet.');
      setFileName('');
    } finally {
      setIsParsing(false);
    }
  };

  // Helper function for batch fetch with retry (3 attempts) & exponential backoff
  const processBatchWithRetry = async (
    batchData: { headers: string[]; rows: any[] },
    attempt = 1,
    maxAttempts = 3,
    delay = 1500
  ): Promise<any> => {
    try {
      const response = await fetch('http://localhost:5000/api/process-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchData)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      return await response.json();
    } catch (err: any) {
      if (attempt < maxAttempts) {
        setProcessingState(
          `Batch mapping failed. Retrying attempt ${attempt + 1}/${maxAttempts} in ${delay / 1000}s...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return processBatchWithRetry(batchData, attempt + 1, maxAttempts, delay * 2);
      }
      throw err;
    }
  };

  // Batch process all rows using AI (Step 3 -> Step 4)
  const handleConfirmImport = async () => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    const batchSize = 15;
    const totalRows = rows.length;
    const allImported: any[] = [];
    const allSkipped: any[] = [];

    try {
      for (let i = 0; i < totalRows; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const batchIndex = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(totalRows / batchSize);

        setProcessingState(`AI analyzing batch ${batchIndex} of ${totalBatches}...`);

        const result = await processBatchWithRetry({
          headers: headers,
          rows: batch
        });

        if (result.imported) allImported.push(...result.imported);
        if (result.skipped) allSkipped.push(...result.skipped);

        // Update progress percentage
        const processedRows = i + batch.length;
        setProgress(Math.round((processedRows / totalRows) * 100));
      }

      setImportedLeads(allImported);
      setSkippedLeads(allSkipped);
      setImportComplete(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during AI processing. Please check your backend connection.');
    } finally {
      setIsProcessing(false);
      setProcessingState('');
    }
  };

  // Reset back to file uploader view
  const handleReset = () => {
    setFileName('');
    setHeaders([]);
    setRows([]);
    setError(null);
    setImportComplete(false);
    setImportedLeads([]);
    setSkippedLeads([]);
    setProgress(0);
  };

  return (
    <div className="app-container">
      {/* App Navigation Header */}
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-icon">GE</div>
          <div>
            <h1 className="logo-text">GrowEasy</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
              CRM INTEL INTELLIGENCE
            </p>
          </div>
          <span className="logo-sub">Importer v2</span>
        </div>

        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label="Toggle Dark Mode"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? (
            // Moon icon
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            // Sun icon
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {error && !headers.length && (
          <div
            className="glass-panel"
            style={{
              borderColor: 'var(--danger)',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <h3 style={{ marginBottom: '0.25rem', fontFamily: 'var(--font-headers)' }}>Connection Error</h3>
              <p style={{ fontSize: '0.9rem' }}>{error}</p>
            </div>
          </div>
        )}

        {/* Importer Steps Flow */}
        {!fileName && (
          <CsvUploader onFileSelect={handleFileSelect} isLoading={isParsing} error={error} />
        )}

        {fileName && !importComplete && (
          <>
            <PreviewTable
              fileName={fileName}
              headers={headers}
              rows={rows}
              onConfirm={handleConfirmImport}
              onClear={handleReset}
              isProcessing={isProcessing}
            />

            {/* AI Batch Processing State Overlay */}
            {isProcessing && (
              <div className="glass-panel progress-panel" style={{ borderLeftWidth: '5px', borderLeftColor: 'var(--accent-primary)' }}>
                <div className="progress-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg className="pulse" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="3">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    <span style={{ fontFamily: 'var(--font-headers)', fontSize: '1.1rem' }}>Processing with AI Mappings</span>
                  </div>
                  <div style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{progress}%</div>
                </div>

                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <span>{processingState}</span>
                  <span>{progress}% Completed</span>
                </div>
              </div>
            )}
            
            {error && isProcessing && (
              <div
                className="glass-panel"
                style={{
                  borderColor: 'var(--danger)',
                  backgroundColor: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="12 2 2 22 22 22" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <p style={{ fontSize: '0.9rem' }}>{error}</p>
              </div>
            )}
          </>
        )}

        {importComplete && (
          <ResultsDashboard
            importedLeads={importedLeads}
            skippedLeads={skippedLeads}
            onReset={handleReset}
          />
        )}
      </main>

      {/* App Footer */}
      <footer style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', borderTop: '1px solid var(--border-color)', marginTop: '2rem' }}>
        <p>&copy; {new Date().getFullYear()} GrowEasy CRM Systems. All rights reserved.</p>
        <p style={{ marginTop: '0.25rem' }}>Powered by Groq Llama 3.3 and Next.js</p>
      </footer>
    </div>
  );
}
