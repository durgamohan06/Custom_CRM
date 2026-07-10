'use client';

import React, { useState } from 'react';

interface ImportedLead {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
  original_row_index: number;
}

interface SkippedLead {
  row: number;
  name: string;
  reason: string;
}

interface ResultsDashboardProps {
  importedLeads: ImportedLead[];
  skippedLeads: SkippedLead[];
  onReset: () => void;
}

export default function ResultsDashboard({
  importedLeads,
  skippedLeads,
  onReset
}: ResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'imported' | 'skipped'>('imported');

  const totalProcessed = importedLeads.length + skippedLeads.length;
  const successRate = totalProcessed > 0 ? Math.round((importedLeads.length / totalProcessed) * 100) : 0;

  // Helper to trigger JSON download
  const downloadJSON = () => {
    const dataStr = JSON.stringify(importedLeads, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `groweasy_imported_leads_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to trigger CSV download
  const downloadCSV = () => {
    const headers = [
      'created_at',
      'name',
      'email',
      'country_code',
      'mobile_without_country_code',
      'company',
      'city',
      'state',
      'country',
      'lead_owner',
      'crm_status',
      'crm_note',
      'data_source',
      'possession_time',
      'description',
      'original_row_index'
    ];

    const csvRows = [
      headers.join(','), // Header row
      ...importedLeads.map(lead => {
        return headers.map(header => {
          const val = lead[header as keyof ImportedLead];
          // Escape quotes and wrap cell in double quotes if there are commas or quotes
          const strVal = val === undefined || val === null ? '' : String(val);
          const escaped = strVal.replace(/"/g, '""').replace(/\n/g, '\\n');
          return `"${escaped}"`;
        }).join(',');
      })
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `groweasy_imported_leads_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Format Status Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'GOOD_LEAD_FOLLOW_UP':
        return <span className="badge badge-success">Follow Up</span>;
      case 'DID_NOT_CONNECT':
        return <span className="badge badge-warning">No Connect</span>;
      case 'BAD_LEAD':
        return <span className="badge badge-danger">Bad Lead</span>;
      case 'SALE_DONE':
        return <span className="badge badge-success" style={{ background: '#3b82f6', color: 'white' }}>Won</span>;
      default:
        return <span className="badge badge-info">{status || 'Unknown'}</span>;
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Stats Cards Dashboard */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{totalProcessed}</div>
            <div className="stat-label">Total Leads Processed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{importedLeads.length}</div>
            <div className="stat-label">Successfully Mapped</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon danger">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{skippedLeads.length}</div>
            <div className="stat-label">Skipped (No Email/Phone)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 22 22 22" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{successRate}%</div>
            <div className="stat-label">Mapping Success Rate</div>
          </div>
        </div>
      </div>

      {/* Main Results Container */}
      <div className="glass-panel">
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
            <h2 style={{ fontFamily: 'var(--font-headers)', fontSize: '1.75rem' }}>Import Execution Results</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Verify the mappings generated by the AI and download your structured records.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={onReset}>
              Import Another File
            </button>
            
            {importedLeads.length > 0 && (
              <>
                <button className="btn btn-secondary" onClick={downloadJSON} title="Download mapping results in JSON format">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export JSON
                </button>
                <button className="btn btn-primary" onClick={downloadCSV} title="Download mapping results in CSV format">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export CSV
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Controls */}
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === 'imported' ? 'active' : ''}`}
            onClick={() => setActiveTab('imported')}
          >
            Successfully Mapped Leads ({importedLeads.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'skipped' ? 'active' : ''}`}
            onClick={() => setActiveTab('skipped')}
          >
            Skipped Records ({skippedLeads.length})
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'imported' ? (
          <div>
            {importedLeads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                No leads were successfully mapped from this CSV file.
              </div>
            ) : (
              <div className="table-outer-container">
                <div className="table-scroll-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Row #</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Country Code</th>
                        <th>Phone</th>
                        <th>Company</th>
                        <th>City</th>
                        <th>State</th>
                        <th>Country</th>
                        <th>Owner</th>
                        <th>Status</th>
                        <th>Source</th>
                        <th>Created At</th>
                        <th>Timeline</th>
                        <th>Notes</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importedLeads.map((lead, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{lead.original_row_index}</td>
                          <td style={{ fontWeight: 600 }} title={lead.name}>{lead.name}</td>
                          <td title={lead.email}>{lead.email || <em style={{ color: 'var(--text-muted)' }}>none</em>}</td>
                          <td>{lead.country_code || '-'}</td>
                          <td>{lead.mobile_without_country_code || <em style={{ color: 'var(--text-muted)' }}>none</em>}</td>
                          <td title={lead.company}>{lead.company || '-'}</td>
                          <td title={lead.city}>{lead.city || '-'}</td>
                          <td title={lead.state}>{lead.state || '-'}</td>
                          <td title={lead.country}>{lead.country || '-'}</td>
                          <td title={lead.lead_owner}>{lead.lead_owner || '-'}</td>
                          <td>{getStatusBadge(lead.crm_status)}</td>
                          <td>{lead.data_source ? <span className="badge badge-info">{lead.data_source}</span> : '-'}</td>
                          <td>{lead.created_at}</td>
                          <td title={lead.possession_time}>{lead.possession_time || '-'}</td>
                          <td title={lead.crm_note} style={{ maxWidth: '300px' }}>{lead.crm_note || '-'}</td>
                          <td title={lead.description} style={{ maxWidth: '300px' }}>{lead.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {skippedLeads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                No records were skipped! All leads met the import validation rules.
              </div>
            ) : (
              <div className="table-outer-container">
                <div className="table-scroll-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Row #</th>
                        <th>Name/Raw ID</th>
                        <th>Reason for Skipping</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skippedLeads.map((lead, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, color: 'var(--danger)' }}>{lead.row}</td>
                          <td style={{ fontWeight: 600 }}>{lead.name}</td>
                          <td>
                            <span className="badge badge-danger" style={{ textTransform: 'none' }}>
                              {lead.reason}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
