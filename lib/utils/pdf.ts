import PDFParser from "pdf2json";

type PdfTextRun = { T: string };
type PdfTextItem = { R: PdfTextRun[] };
type PdfPage = { Texts: PdfTextItem[] };
type PdfDocument = { Pages: PdfPage[] };
type PdfParserError = Error | { parserError: Error };

function pdfParseErrorMessage(err: PdfParserError): string {
  if ("parserError" in err) {
    return err.parserError.message;
  }
  return err.message;
}

function pageText(page: PdfPage): string {
  return page.Texts.map((t) =>
    decodeURIComponent(t.R.map((r) => r.T).join("")),
  ).join(" ");
}

export async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (err: PdfParserError) => {
      reject(new Error(`PDF parse error: ${pdfParseErrorMessage(err)}`));
    });

    pdfParser.on("pdfParser_dataReady", (pdfData: PdfDocument) => {
      try {
        const text = pdfData.Pages.map(pageText).join("\n\n");

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
