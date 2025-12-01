using {com.propertydocgen as db} from '../db/schema';

service DocumentGenerationService @(path: '/DocumentGenerationService') {
    entity Documents as
        projection on db.Documents {
            *
        }
        actions {
            // Define the action to generate a document
            action generateDocument(docType: String, content: String @mandatory, preview: Boolean @mandatory ) returns DocumentResult;
        };

    // Define the return type for the action
    type DocumentResult {
        filename : String;
        content  : LargeString; // Base64 encoded PDF content
        mimeType : String;
        size     : Integer;
    }
}
