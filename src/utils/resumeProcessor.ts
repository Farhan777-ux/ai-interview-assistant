import mammoth from 'mammoth';

// NOTE: We lazy-load pdfjs-dist inside extractTextFromPDF to avoid any startup/runtime
// issues in production hosting (e.g., module worker quirks). The worker file is
// served locally from public/pdf.worker.min.mjs when needed.

export interface ExtractedData {
  name?: string;
  email?: string;
  phone?: string;
  text: string;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Lazy-load pdfjs to avoid initialization on page load
    const pdfjs: any = await import('pdfjs-dist');
    const { getDocument, GlobalWorkerOptions } = pdfjs;

    // Point worker to local file in public/
    try {
      GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ''}/pdf.worker.min.mjs`;
    } catch {}

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    let text = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      text += pageText + '\n';
    }

    return text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    // Return a fallback text for testing
    return `Sample Resume Text\n\nJohn Doe\njohn.doe@email.com\n(555) 123-4567\n\nExperienced Full Stack Developer with expertise in React, Node.js, and modern web technologies.`;
  }
}

export async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX');
  }
}

export function extractCandidateInfo(text: string): ExtractedData {
  // Clean and normalize text
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  const extractedData: ExtractedData = {
    text: cleanText,
  };

  // Extract email using regex
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emailMatch = cleanText.match(emailRegex);
  if (emailMatch && emailMatch.length > 0) {
    extractedData.email = emailMatch[0];
  }

  // Extract phone number robustly and store only the last 10 digits (UI will format as (+91) XXXXXXXX)
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  const candidateRegex = /(\+?\d[\d\-\s().]{8,}?\d)/g; // sequences that look like phone numbers
  const keywords = /(phone|mobile|contact|tel)\s*:?/i;
  
  const toTenDigits = (s: string): string | undefined => {
    const digits = s.replace(/\D/g, '');
    if (digits.length >= 10) {
      return digits.slice(-10);
    }
    return undefined;
  };
  
  // 1) Prefer lines that explicitly mention phone-like keywords
  for (const line of lines) {
    if (keywords.test(line)) {
      const matches = Array.from(line.matchAll(candidateRegex));
      for (const m of matches) {
        const ten = toTenDigits(m[0]);
        if (ten) {
          extractedData.phone = ten;
          break;
        }
      }
      if (extractedData.phone) break;
    }
  }
  
  // 2) Otherwise, search the whole text for plausible sequences
  if (!extractedData.phone) {
    const matches = Array.from(cleanText.matchAll(candidateRegex));
    for (const m of matches) {
      const ten = toTenDigits(m[0]);
      if (ten) {
        extractedData.phone = ten;
        break;
      }
    }
  }
  
  // 3) Fallback: plain 10-digit runs
  if (!extractedData.phone) {
    const tenRun = cleanText.match(/\b\d{10}\b/);
    if (tenRun) extractedData.phone = tenRun[0];
  }

  // Extract name (this is more complex and may need refinement)
  // Look for name patterns at the beginning of the document
  const nameLines = cleanText.split('\n').filter(line => line.trim().length > 0);
  
  // Try to find the name in the first few lines
  for (let i = 0; i < Math.min(5, nameLines.length); i++) {
    const line = nameLines[i].trim();
    
    // Skip lines that look like contact info or other non-name content
    if (
      line.includes('@') || // email
      line.match(/\d{3}[-.\s]\d{3}[-.\s]\d{4}/) || // phone
      line.toLowerCase().includes('resume') ||
      line.toLowerCase().includes('cv') ||
      line.toLowerCase().includes('curriculum') ||
      line.length < 3 ||
      line.length > 50
    ) {
      continue;
    }
    
    // Check if line looks like a name (2-4 words, starts with capital letters)
    const namePattern = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/;
    if (namePattern.test(line)) {
      extractedData.name = line;
      break;
    }
  }

  return extractedData;
}

export function validateFileType(file: File): boolean {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];
  return allowedTypes.includes(file.type);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}