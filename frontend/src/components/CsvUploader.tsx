'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';

interface CsvUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  error: string | null;
}

export default function CsvUploader({ onFileSelect, isLoading, error }: CsvUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        onFileSelect(file);
      } else {
        alert('Please upload a valid CSV file.');
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="glass-panel">
      <h2 style={{ marginBottom: '0.5rem', fontFamily: 'var(--font-headers)' }}>Upload Lead Spreadsheet</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Select or drag any CSV export (Google Ads, Facebook, Excel, CRM exports). Our AI will automatically map and clean your leads.
      </p>

      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && triggerFileInput()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv, text/csv"
          style={{ display: 'none' }}
        />

        <div className="upload-icon-container">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        {isLoading ? (
          <div>
            <h3 style={{ marginBottom: '0.25rem', color: 'var(--accent-primary)' }} className="pulse">
              Parsing Spreadsheet...
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Analyzing layout and rows</p>
          </div>
        ) : (
          <div>
            <h3 style={{ marginBottom: '0.25rem', fontFamily: 'var(--font-headers)' }}>
              Drag &amp; Drop your CSV file here
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              or click to browse files
            </p>
            <span className="badge badge-info">Supports UTF-8 CSV</span>
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div><strong>Error:</strong> {error}</div>
        </div>
      )}
    </div>
  );
}
