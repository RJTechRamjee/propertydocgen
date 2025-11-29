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
     * @param {object} req - The CAP request object.
     * @returns {string} A confirmation message.
     */
    async onGenerateDocument(req) {
        
        const { docType, content } = req.data;
        
        if (docType === 'PDF') {
            
            // 1. Define the filename and path for the generated PDF
            const filename = `generated_doc_${Date.now()}.pdf`;
            const filePath = path.join(process.cwd(), filename); // Saves in the project root

            // 2. Create a new PDF document instance
            const doc = new PDFDocument();
            
            // 3. Pipe the document output to a writable stream (to save the file)
            // NOTE: In a real-world scenario, you might skip saving to disk and 
            // instead upload the buffer to a document management service (e.g., SAP DMS, S/4HANA, Azure Blob).
            doc.pipe(fs.createWriteStream(filePath));
            
            // 4. Add the provided content to the PDF
            doc.fontSize(16)
               .text('--- Generated Document ---', { align: 'center' })
               .moveDown(); // Add a line break

            doc.fontSize(12)
               .text(`Document Type Requested: ${docType}`, { indent: 20 })
               .text('----------------------------------------------------')
               .moveDown();

            doc.text('Input Content:', { underline: true })
               .moveDown(0.5);

            // Add the main content provided by the user
            doc.text(content); 

            // 5. Finalize the PDF and close the stream
            doc.end(); 

            console.log(`Successfully generated and saved PDF to: ${filePath}`);
            
            return `PDF document generated successfully and saved as '${filename}' with content length: ${content.length}.`;
            
        } else if (docType === 'DOCX') {
            // Keep the DOCX path for other requirements
            return `DOCX generation logic is not yet implemented.`;
        } else {
            req.error(400, `Unsupported document type: ${docType}`);
        }
    }
}

module.exports = DocumentGenerationService;