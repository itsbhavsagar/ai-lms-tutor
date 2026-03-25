/**
 * PDF Processing Utilities
 * Handles extraction and text parsing from PDFs
 */

export async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const PDFParser = require("pdf2json");
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (err: any) => {
      reject(new Error(`PDF parse error: ${err.parserError}`));
    });

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      try {
        const text = pdfData.Pages.map((page: any) =>
          page.Texts.map((t: any) =>
            decodeURIComponent(t.R.map((r: any) => r.T).join("")),
          ).join(" "),
        ).join("\n\n");

        if (!text.trim()) {
          reject(new Error("No text extracted from PDF"));
          return;
        }

        resolve(text);
      } catch (error) {
        reject(new Error(`PDF processing error: ${error}`));
      }
    });

    try {
      pdfParser.parseBuffer(Buffer.from(buffer));
    } catch (error) {
      reject(new Error(`PDF buffer parsing failed: ${error}`));
    }
  });
}
