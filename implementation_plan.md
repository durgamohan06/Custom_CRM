# AI-Powered CSV Importer

This plan outlines the architecture and implementation for the GrowEasy CSV Importer.

## User Review Required
> [!IMPORTANT]  
> 1. **AI Model Setup:** We plan to use the `Gemini` API via `@google/genai` for the AI extraction phase. You will need to provide a `GEMINI_API_KEY` in the `.env` file of the backend. Is this acceptable, or would you prefer a different provider (e.g. OpenAI/Claude)?
> 2. **Project Structure:** We will set up a monorepo-style folder structure with `frontend/` (Next.js) and `backend/` (Node.js + Express).
> 3. **Styling:** As per guidelines, we will avoid Tailwind CSS and use pure CSS for a premium, custom, and dynamic UI design.

## Proposed Architecture & Workflow

1. **Frontend (Next.js)**
   - **Upload Component:** Drag and drop file uploader.
   - **Preview Table:** Parse CSV locally on the frontend (e.g., using `papaparse`) to generate the preview table with sticky headers, both horizontal and vertical scrolling.
   - **Submission:** Upon confirming, the frontend sends the CSV file directly to the backend API via `multipart/form-data`.
   - **Results Table:** Displays the JSON response from the backend (Successfully parsed vs. Skipped).

2. **Backend (Node.js + Express)**
   - **API Endpoint (`POST /api/upload-csv`):** 
     - Accepts file uploads (using `multer`).
     - Parses the CSV into JSON records using `csv-parse`.
     - Chunks the records into smaller batches (e.g., 20-30 rows at a time) to fit into LLM context and maintain accuracy.
   - **AI Extraction Layer:**
     - A structured prompt will instruct the LLM to output JSON matching the `GrowEasy` CRM format.
     - The AI will apply the necessary business logic: filtering valid statuses (`GOOD_LEAD_FOLLOW_UP`, etc.), appending additional emails/phones to `crm_note`, validating data_sources, checking date validity, and skipping records without email and mobile.
   - **Response:** Returns `{ imported: [...], skipped: [...], totalImported: N, totalSkipped: M }`.

## Component Details

### `frontend/`
- **Upload UI:** Beautiful glassmorphism, animated drag-and-drop zone.
- **Data Table UI:** Responsive, scrollable tables for Preview and Final Results. Uses standard, robust HTML structure styled elegantly.

### `backend/`
- **Express Server:** Clean architecture with controllers, routes, and services.
- **`aiService.js`:** Responsible for building the prompt, communicating with Gemini, and sanitizing the output.
- **`csvParser.js`:** Responsible for streaming/batching the uploaded CSV.

## Verification Plan

### Automated/Local Tests
- I will run both the `frontend` and `backend` locally.
- I will upload different CSV structures (e.g., mismatched column headers, missing data) to ensure the preview and AI extraction work seamlessly.

### Manual Verification
- We will visually inspect the frontend to ensure it meets the standard for a premium, dynamic UI design with micro-animations.
