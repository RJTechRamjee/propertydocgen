const cds = require('@sap/cds');
const PDFDocument = require('pdfkit');

class DocumentGenerationService extends cds.ApplicationService {
    
    /**
     * Extracts the document ID from request params
     * @param {object} req - The CAP request object
     * @returns {string|null} The document ID or null
     */
    _getDocumentId(req) {
        return req.params[0]?.ID || req.params[0];
    }
    
    async init() {
        // Register the handler for the 'generateDocument' Action
        this.on('generateDocument', this.onGenerateDocument);
        
        return super.init();
    }
    
    /**
     * Handler method for the generateDocument action.
     * Generates a PDF if docType is 'PDF'.
     * @param {object} req - The CAP request object.
     * @returns {object} PDF filename and content as base64 string.
     */
    async onGenerateDocument(req) {
        
        const { docType, content, preview } = req.data;
        const { Documents } = cds.entities;
        
        // Get the ID of the bound entity from request params
        const documentId = this._getDocumentId(req);
        
        // Verify the document exists before proceeding
        const existingDoc = await cds.tx(req).run(
            SELECT.one.from(Documents).columns('ID').where({ ID: documentId })
        );
        
        if (!existingDoc) {
            return req.error(404, `Document with ID ${documentId} not found`);
        }

        if (docType === 'PDF') {
            const filename = `generated_doc_${Date.now()}.pdf`;
            const doc = new PDFDocument();
            const chunks = [];
            doc.on('data', (chunk) => {
                chunks.push(chunk);
            });
            const pdfBuffer = await new Promise((resolve, reject) => {
                doc.on('end', () => {
                    resolve(Buffer.concat(chunks));
                });
                doc.on('error', reject);
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
                if (preview) {
                    doc.save();
                    doc.fontSize(80)
                       .fillColor('red', 0.3)
                       .rotate(-45, { origin: [doc.page.width / 2, doc.page.height / 2] })
                       .text('PREVIEW', doc.page.width / 2 - 200, doc.page.height / 2 - 40, {
                           width: 400,
                           align: 'center'
                       });
                    doc.restore();
                }
                doc.end();
            });

            // Update the existing document with binary PDF content and mediaType
            await cds.tx(req).run(
                UPDATE(Documents).set({
                    pdfFile: pdfBuffer,
                    mediaType: 'application/pdf',
                    filename: filename
                }).where({ ID: documentId })
            );

            console.log(`Successfully generated PDF: ${filename}${preview ? ' (Preview Mode)' : ''}`);

            // Return the PDF content as base64 string along with filename
            return {
                filename: filename,
                content: pdfBuffer.toString('base64'),
                mimeType: 'application/pdf',
                size: pdfBuffer.length
            };

        } else if (docType === 'DOCX') {
            return `DOCX generation logic is not yet implemented.`;
        } else {
            req.error(400, `Unsupported document type: ${docType}`);
        }
    }
}

module.exports = DocumentGenerationService;