service DocGenService @(path:'/DocGenService') {

    action generateDocument(docType: String, content: String) returns String;

}
