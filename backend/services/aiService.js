import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Read API key and model config (allows GROQ_API_KEY or GEMINI_API_KEY for convenience)
const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || '';
const modelName = process.env.MODEL_NAME || 'llama-3.1-8b-instant';
const groq = new Groq({ apiKey });

const responseSchema = {
  type: "object",
  properties: {
    records: {
      type: "array",
      items: {
        type: "object",
        properties: {
          original_row_index: { 
            type: "integer",
            description: "The original 1-based row index in the uploaded CSV"
          },
          created_at: { 
            type: "string",
            description: "Lead creation date. Convert to ISO format or YYYY-MM-DD HH:MM:SS parseable by JS 'new Date()'. Empty string if none."
          },
          name: { 
            type: "string",
            description: "Full name of the lead. Empty string if none."
          },
          email: { 
            type: "string",
            description: "Primary email address. If multiple, use the first one. Empty string if none."
          },
          country_code: { 
            type: "string",
            description: "Country calling code, e.g. +91, +1. If extracted, keep the + prefix. Empty string if none."
          },
          mobile_without_country_code: { 
            type: "string",
            description: "Mobile number without country code, spaces, dashes, or brackets. Empty string if none."
          },
          company: { 
            type: "string",
            description: "Company name. Empty string if none."
          },
          city: { 
            type: "string",
            description: "City name. Empty string if none."
          },
          state: { 
            type: "string",
            description: "State name. Empty string if none."
          },
          country: { 
            type: "string",
            description: "Country name. Empty string if none."
          },
          lead_owner: { 
            type: "string",
            description: "Lead owner email or username. Empty string if none."
          },
          crm_status: { 
            type: "string",
            description: "Status of the lead. Must map to: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE. Empty string if not mapping to these."
          },
          crm_note: { 
            type: "string",
            description: "Consolidated notes. Append any extra email addresses, extra phone numbers, or notes from the row here. Empty string if none."
          },
          data_source: { 
            type: "string",
            description: "Must map to: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots. Empty string if no match."
          },
          possession_time: { 
            type: "string",
            description: "Property possession timeline or notes. Empty string if none."
          },
          description: { 
            type: "string",
            description: "Any extra description or raw row summary. Empty string if none."
          }
        },
        required: [
          "original_row_index",
          "created_at",
          "name",
          "email",
          "country_code",
          "mobile_without_country_code",
          "company",
          "city",
          "state",
          "country",
          "lead_owner",
          "crm_status",
          "crm_note",
          "data_source",
          "possession_time",
          "description"
        ],
        additionalProperties: false
      }
    }
  },
  required: ["records"],
  additionalProperties: false
};

/**
 * Sends a batch of rows to Groq to map them into the CRM structure.
 * @param {Array<string>} headers - The headers of the CSV file.
 * @param {Array<Object>} rows - An array of { rowIndex, cells } representing raw CSV rows.
 * @returns {Promise<Array<Object>>} - The mapped records.
 */
export async function mapBatchToCrm(headers, rows) {
  if (!apiKey) {
    throw new Error('Groq/Gemini API key is not configured. Please set GROQ_API_KEY or GEMINI_API_KEY in the backend .env file.');
  }

  const prompt = `
You are a CRM Data Extraction AI. You are helping to import contacts/leads from a raw CSV file into the GrowEasy CRM system.
The CSV column headers are:
${JSON.stringify(headers)}

Here is a batch of raw rows to map. Each row has an "original_row_index" and a "cells" array containing the values for each header in order.

Rows:
${JSON.stringify(rows.map(r => ({ original_row_index: r.rowIndex, cells: r.cells })), null, 2)}

Instructions for Mapping:
1. Identify names, emails, phones, and addresses.
2. Clean Phone Numbers:
   - Extract the country calling code (e.g. +91, +1) into "country_code". Keep the "+" prefix.
   - Clean the remaining digits (remove spaces, hyphens, brackets, leading zeros) and map to "mobile_without_country_code".
   - If a row has multiple phone numbers, extract the first one, and format any others as "[Additional Phone: <number>]" and append them to "crm_note".
3. Clean Emails:
   - Map the first valid email to "email".
   - If a row has multiple emails, format the others as "[Additional Email: <email>]" and append to "crm_note".
4. Handle Lead Status ("crm_status"):
   - Review columns containing status, tags, labels, or stage information.
   - You MUST map the status to exactly one of the following:
     * GOOD_LEAD_FOLLOW_UP (if warm, contacted, interested, follow-up, scheduled, etc.)
     * DID_NOT_CONNECT (if busy, wrong number, did not connect, left voicemail, no answer, etc.)
     * BAD_LEAD (if junk, fake, not interested, spam, bad, etc.)
     * SALE_DONE (if closed, won, sold, paid, completed, onboarding, etc.)
     * If there is no clear match or status info, leave it as an empty string ("").
5. Handle Data Source ("data_source"):
   - Check if there is any column or text referencing a project, campaign, or source.
   - Map strictly to one of: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots.
   - If none match confidently, leave it as an empty string ("").
6. Handle Dates ("created_at"):
   - Look for date columns. Parse and normalize the value into an ISO string or standard format (e.g. YYYY-MM-DD HH:MM:SS) that JS can parse with "new Date()".
   - If no date exists, leave it as an empty string.
7. Handle Notes ("crm_note"):
   - Put any notes, remarks, follow-up details, or unmapped columns here.
   - Make sure to append any extra emails or phone numbers that did not fit in the main fields.

Strict JSON format:
You MUST output JSON and fill every property in the schema. For any unmapped properties, use an empty string ("").
`;

  try {
    const response = await groq.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: 'You are a structured lead mapping assistant. You MUST respond with a valid JSON object containing a "records" array. Each record in the array MUST contain all standard CRM fields (original_row_index, created_at, name, email, country_code, mobile_without_country_code, company, city, state, country, lead_owner, crm_status, crm_note, data_source, possession_time, description). If a field cannot be mapped or has no value, set it to an empty string (""). Do not include any text outside the JSON object.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: {
        type: 'json_object'
      },
      temperature: 0.1
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from Groq API.');
    }

    let sanitizedContent = content.trim();
    if (sanitizedContent.startsWith('```')) {
      sanitizedContent = sanitizedContent
        .replace(/^```(?:json)?\n?/i, '')
        .replace(/```$/, '')
        .trim();
    }

    try {
      const data = JSON.parse(sanitizedContent);
      return data.records || [];
    } catch (parseError) {
      console.error('Failed to parse Groq response as JSON. Content was:', content);
      throw new Error('Failed to parse AI response as valid JSON: ' + parseError.message);
    }
  } catch (error) {
    console.error('Error during Groq API call:', error);
    throw error;
  }
}
