namespace com.propertydocgen;

entity Documents {
    key ID            : UUID;
        title         : String;
        pdfFile       : LargeBinary @Core.MediaType: mediaType @Core.ContentDisposition.Filename: filename @Core.ContentDisposition.Type: 'attachment';
        mediaType     : String default 'application/pdf';
        filename      : String;
}
