const cds = require('@sap/cds');
const PDFDocument = require('pdfkit'); //https://stackabuse.com/generating-pdf-files-in-node-js-with-pdfkit/
const fs = require('fs'); // To save the file (optional, for demonstration)
const path = require('path');

class DocumentGenerationService extends cds.ApplicationService {
    
    async init() {
        // Register the handler for the 'generateDocument' Action
        this.on('generateDocument', this.onGenerateDocument);
        
        return super.init();
    }
    
    /**
     * Handler method for the generateDocument action.
     * Generates a PDF if docType is 'PDF'.
     * Updates existing document file and returns base64-encoded PDF for download.
     * @param {object} req - The CAP request object.
     * @returns {string} JSON string with message and base64 PDF data.
     */
    async onGenerateDocument(req) {
        
        const { docType, content } = req.data;
        
        if (docType === 'PDF') {
            
            // 1. Define a fixed filename to update existing document (not insert new)
            const filename = 'generated_document.pdf';
            const filePath = path.join(process.cwd(), filename);

            // 2. Generate PDF and collect chunks for base64 encoding
            return new Promise((resolve, reject) => {
                const doc = new PDFDocument();
                const chunks = [];
                
                // Collect PDF data into buffer
                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(chunks);
                    const base64Pdf = pdfBuffer.toString('base64');
                    
                    // Also save to disk (updates existing file)
                    fs.writeFileSync(filePath, pdfBuffer);
                    console.log(`Successfully generated and updated PDF at: ${filePath}`);
                    
                    // Return JSON with message and downloadable PDF data
                    const result = {
                        message: `PDF document generated successfully and saved as '${filename}' with content length: ${content.length}.`,
                        filename: filename,
                        mimeType: 'application/pdf',
                        pdfBase64: base64Pdf
                    };
                    resolve(JSON.stringify(result));
                });
                doc.on('error', (err) => reject(err));

                // 3. Add the provided content to the PDF
                doc.fontSize(16)
                   .text('--- Generated Document ---', { align: 'center' })
                   .moveDown();

                doc.fontSize(12)
                   .text(`Document Type Requested: ${docType}`, { indent: 20 })
                   .text('----------------------------------------------------')
                   .moveDown();

                doc.text('Input Content:', { underline: true })
                   .moveDown(0.5);

                doc.text(content); 

                // 4. Finalize the PDF
                doc.end(); 
            });
            
        } else if (docType === 'DOCX') {
            // Keep the DOCX path for other requirements
            return `DOCX generation logic is not yet implemented.`;
        } else {
            req.error(400, `Unsupported document type: ${docType}`);
        }
    }
}

module.exports = DocumentGenerationService;