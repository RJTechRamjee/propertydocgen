using DocumentGenerationService as service from '../../srv/DocGenService';

// Annotate the pdfFile as a stream/media property
annotate service.Documents with {
    pdfFile @Core.MediaType: mediaType  @Core.ContentDisposition.Filename: filename  @Core.ContentDisposition.Type: 'attachment';
};

annotate service.Documents with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'Title',
                Value : title,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Filename',
                Value : filename,
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataFieldForAction',
            Label : 'Generate Document',
            Action : 'DocumentGenerationService.generateDocument',
        },
        {
            $Type : 'UI.DataField',
            Label : 'Title',
            Value : title,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Filename',
            Value : filename,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Download',
            Value : pdfFile,
        },
    ],
);