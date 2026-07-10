import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { mapBatchToCrm } from '../services/aiService.js';

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Endpoint 1: Accept CSV file, parse it, and return raw headers and rows.
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please upload a valid CSV file.' });
    }

    let csvContent = req.file.buffer.toString('utf-8');
    
    // Strip UTF-8 BOM if present
    if (csvContent.charCodeAt(0) === 0xFEFF) {
      csvContent = csvContent.slice(1);
    }

    // Parse the CSV
    const records = parse(csvContent, {
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true // Relax column count issues
    });

    if (records.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty.' });
    }

    const headers = records[0];
    const rawRows = records.slice(1);

    // Map rows to a structured format with row index (line number in CSV, which is index + 2)
    const rows = rawRows.map((cells, index) => ({
      rowIndex: index + 2,
      cells: cells
    }));

    return res.json({
      success: true,
      fileName: req.file.originalname,
      headers: headers,
      rows: rows
    });
  } catch (error) {
    console.error('CSV Parsing Error:', error);
    return res.status(500).json({ error: 'Failed to parse CSV file: ' + error.message });
  }
});

// Endpoint 2: Process a batch of rows using AI mapping
router.post('/process-batch', async (req, res) => {
  try {
    const { headers, rows } = req.body;

    if (!headers || !rows || !Array.isArray(headers) || !Array.isArray(rows)) {
      return res.status(400).json({ error: 'Invalid request body. Requires headers and rows.' });
    }

    if (rows.length === 0) {
      return res.json({ imported: [], skipped: [] });
    }

    // Call the AI Service to map the batch
    const aiRecords = await mapBatchToCrm(headers, rows);
    const aiRecordsList = Array.isArray(aiRecords) ? aiRecords : [];

    const imported = [];
    const skipped = [];

    // Valid CRM statuses
    const allowedStatuses = new Set([
      'GOOD_LEAD_FOLLOW_UP',
      'DID_NOT_CONNECT',
      'BAD_LEAD',
      'SALE_DONE'
    ]);

    // Valid data sources
    const allowedDataSources = new Set([
      'leads_on_demand',
      'meridian_tower',
      'eden_park',
      'varah_swamy',
      'sarjapur_plots'
    ]);

    // Process and normalize each record returned by AI
    rows.forEach((originalRow) => {
      // Find the mapped AI record corresponding to this original row index
      const mapped = aiRecordsList.find(r => Number(r.original_row_index) === originalRow.rowIndex);

      if (!mapped) {
        // If the AI missed this row, treat it as skipped/failed
        skipped.push({
          row: originalRow.rowIndex,
          name: originalRow.cells[0] || 'Unknown',
          reason: 'AI mapping failed to return this record'
        });
        return;
      }

      // 1. Check for email or mobile presence (skip rule)
      const email = (mapped.email || '').trim();
      const mobile = (mapped.mobile_without_country_code || '').trim();

      if (!email && !mobile) {
        skipped.push({
          row: originalRow.rowIndex,
          name: mapped.name || originalRow.cells[0] || 'Unknown',
          reason: 'Contains neither email nor mobile number'
        });
        return;
      }

      // 2. Normalize and validate date format
      let createdAt = (mapped.created_at || '').trim();
      if (!createdAt || isNaN(new Date(createdAt).getTime())) {
        // Default to current time formatted as YYYY-MM-DD HH:mm:ss
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        createdAt = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
      }

      // 3. Normalize crm_status
      let status = (mapped.crm_status || '').trim();
      if (!allowedStatuses.has(status)) {
        // Default based on keyword search or just GOOD_LEAD_FOLLOW_UP as fallback
        status = 'GOOD_LEAD_FOLLOW_UP';
      }

      // 4. Normalize data_source
      let dataSource = (mapped.data_source || '').trim();
      if (!allowedDataSources.has(dataSource)) {
        dataSource = ''; // If none match confidently, leave it blank
      }

      // 5. Clean name
      let name = (mapped.name || '').trim();
      if (!name) {
        // Fallback to email username or 'Unknown Lead'
        name = email ? email.split('@')[0] : 'Lead #' + originalRow.rowIndex;
      }

      // Format clean record
      const cleanRecord = {
        created_at: createdAt,
        name: name,
        email: email || '',
        country_code: (mapped.country_code || '').trim(),
        mobile_without_country_code: mobile,
        company: (mapped.company || '').trim(),
        city: (mapped.city || '').trim(),
        state: (mapped.state || '').trim(),
        country: (mapped.country || '').trim(),
        lead_owner: (mapped.lead_owner || '').trim(),
        crm_status: status,
        crm_note: (mapped.crm_note || '').trim(),
        data_source: dataSource,
        possession_time: (mapped.possession_time || '').trim(),
        description: (mapped.description || '').trim(),
        original_row_index: originalRow.rowIndex
      };

      imported.push(cleanRecord);
    });

    return res.json({
      success: true,
      imported: imported,
      skipped: skipped
    });
  } catch (error) {
    console.error('Batch processing error:', error);
    return res.status(500).json({ error: 'Failed to process batch with AI: ' + error.message });
  }
});

export default router;
