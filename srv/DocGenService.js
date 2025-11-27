const cds = require('@sap/cds');

// Define a class that extends the base ApplicationService
class DocumentGenerationService extends cds.ApplicationService {
    
    // The init() method is the standard place to define handlers
    async init() {
        
        // Use this.on() to register the handler for the 'generateDocument' Action
        this.on('generateDocument', this.onGenerateDocument);
        
        // Don't forget to call the super.init() to ensure
        // all standard service features are initialized
        return super.init();
    }
    
    /**
     * Handler method for the generateDocument action.
     * @param {object} req - The CAP request object.
     * @returns {string} The generated document message.
     */
    async onGenerateDocument(req) {
        
        // 1. Access the input parameters from the request object
        const { docType, content } = req.data;
        
        console.log(`Class Handler: Received request for ${docType}`);
        
        let resultMessage = '';
        
        // Example logic
        if (docType === 'PDF') {
            resultMessage = `PDF document class implementation generated with content length: ${content.length}`;
        } else if (docType === 'DOCX') {
            resultMessage = `DOCX document class implementation generated.`;
        } else {
            // Use req.error() for throwing a structured error
            req.error(400, `Unsupported document type: ${docType}`);
        }
        
        // 2. Return the result
        return resultMessage;
    }
}

// Export the class for CAP to load and instantiate
module.exports = DocumentGenerationService;