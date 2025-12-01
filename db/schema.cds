namespace com.propertydocgen;

entity Documents {
    key ID       : UUID;
        title    : String;
        pdfFile  : LargeString @Core.MediaType: 'application/pdf'; // Store base64 PDF content, exposed for download
        filename : String;
}
