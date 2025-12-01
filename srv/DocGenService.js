const cds = require('@sap/cds');
const PDFDocument = require('pdfkit');
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
     * @returns {object} PDF filename and content as base64 string.
     */
    async onGenerateDocument(req) {
        
        const { docType, content, preview } = req.data;
        const { Documents } = cds.entities;

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

            // Store the PDF in the Documents entity
            const inserted = await cds.tx(req).run(
                INSERT.into(Documents).entries({
                    title: 'Generated PDF',
                    pdfFile: pdfBuffer.toString('base64'),
                    filename: filename
                })
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