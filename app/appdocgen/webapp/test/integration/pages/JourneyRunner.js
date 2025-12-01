sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"appdocgen/test/integration/pages/DocumentsList",
	"appdocgen/test/integration/pages/DocumentsObjectPage"
], function (JourneyRunner, DocumentsList, DocumentsObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('appdocgen') + '/test/flp.html#app-preview',
        pages: {
			onTheDocumentsList: DocumentsList,
			onTheDocumentsObjectPage: DocumentsObjectPage
        },
        async: true
    });

    return runner;
});

