'use client';

import React from 'react';

interface PreviewTableProps {
  fileName: string;
  headers: string[];
  rows: Array<{ rowIndex: number; cells: string[] }>;
  onConfirm: () => void;
  onClear: () => void;
  isProcessing: boolean;
}

export default function PreviewTable({
  fileName,
  headers,
  rows,
  onConfirm,
  onClear,
  isProcessing
}: PreviewTableProps) {
  // Show up to 10 rows as preview to keep the UI clean, while notifying them of the total count.
  const PREVIEW_LIMIT = 10;
  const previewRows = rows.slice(0, PREVIEW_LIMIT);

  return (
    <div className="glass-panel" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <div>
          <span className="badge badge-info" style={{ marginBottom: '0.5rem' }}>File Loaded</span>
          <h2 style={{ fontFamily: 'var(--font-headers)', fontSize: '1.75rem' }}>{fileName}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Detected <strong>{headers.length}</strong> columns and <strong>{rows.length}</strong> total lead rows.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={onClear} disabled={isProcessing}>
            Clear
          </button>
          <button className="btn btn-primary" onClick={onConfirm} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <svg
                  className="pulse"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ marginRight: '0.25rem' }}
                >
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                  <line x1="2" y1="12" x2="6" y2="12" />
                  <line x1="18" y1="12" x2="22" y2="12" />
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Confirm Import
              </>
            )}
          </button>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-headers)', marginBottom: '0.5rem' }}>
          Data Preview <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(showing first {Math.min(PREVIEW_LIMIT, rows.length)} rows)</span>
        </h3>

        <div className="table-outer-container">
          <div className="table-scroll-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Row #</th>
                  {headers.map((header, idx) => (
                    <th key={idx}>{header || `Col ${idx + 1}`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => (
                  <tr key={row.rowIndex}>
                    <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{row.rowIndex}</td>
                    {headers.map((_, colIdx) => (
                      <td key={colIdx} title={row.cells[colIdx] || ''}>
                        {row.cells[colIdx] !== undefined ? row.cells[colIdx] : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {rows.length > PREVIEW_LIMIT && (
          <div
            style={{
              textAlign: 'center',
              padding: '0.75rem',
              backgroundColor: 'var(--bg-tertiary)',
              borderBottomLeftRadius: 'var(--border-radius-md)',
              borderBottomRightRadius: 'var(--border-radius-md)',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderTop: 'none'
            }}
          >
            And {rows.length - PREVIEW_LIMIT} more rows...
          </div>
        )}
      </div>
    </div>
  );
}
