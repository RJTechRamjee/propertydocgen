namespace com.propertydocgen;

entity Documents {
    key ID            : UUID;
        title         : String;
        pdfFile       : LargeBinary;
        mediaType     : String default 'application/pdf';
        filename      : String;
}
