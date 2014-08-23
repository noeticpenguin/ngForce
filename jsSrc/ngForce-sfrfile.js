/**
 * The sfrfile service allows binary data to be uploaded via the Salesforce REST API.
 *
 * Please see the following documentation for more information:
 * http://www.salesforce.com/us/developer/docs/api_rest/Content/dome_sobject_insert_update_blob.htm
 */
angular.module('ngForce').factory('sfrfile', function($q, $rootScope, $log, Restangular, MultipartRequest, RequestPart) {
    var sfrfile = Restangular.withConfig(function(RestangularConfigurer) {
        RestangularConfigurer.setDefaultHttpFields({
            cache: false,
            transformRequest: function(data) {
                return data;
            }
        });
        RestangularConfigurer.setBaseUrl('/services/data/v29.0/sobjects');
        RestangularConfigurer.setDefaultHeaders({
            'Authorization': 'Bearer ' + window.apiSid
        });
    }).setRestangularFields({
        id: "Id",
        selfLink: 'attributes.url'
    });

    /**
     * Insert an SObject with binary data.
     *
     * @param  sObjectName  'Document', 'Attachment', or 'ContentVersion'
     * @param  sObjectData  Object containing sObject fields and values
     * @param  filename     File name string
     * @param  fileBuffer   ArrayBuffer to be included in binary part of request
     */
    sfrfile.insert = function(sObjectName, sObjectData, filename, fileBuffer) {
        SObjectType = {
            'Document': {
                jsonPartName: 'entity_document',
                binaryPartName: 'Body'
            },
            'Attachment': {
                jsonPartName: 'entity_attachment',
                binaryPartName: 'Body'
            },
            'ContentVersion': {
                jsonPartName: 'entity_content',
                binaryPartName: 'VersionData'
            }
        };

        var mySObjectType = SObjectType[sObjectName];
        if (typeof mySObjectType === undefined) {
            throw new Error('Upload not supported for SObject type \'' + sObjectName + '\'');
        }

        var binaryNameAttr;
        var boundaryStr = 'boundary_string';
        var req = new MultipartRequest(boundaryStr);

        var sobjectDataPart = new RequestPart();
        sobjectDataPart.addHeader('Content-Disposition', 'form-data; name="' + mySObjectType.jsonPartName + '";');
        sobjectDataPart.addHeader('Content-Type', 'application/json');
        sobjectDataPart.setBody(sObjectData);
        req.addPart(sobjectDataPart);

        var filePart = new RequestPart();
        filePart.addHeader('Content-Type', 'application/octet-stream');
        filePart.addHeader('Content-Disposition', 'form-data; name="' + mySObjectType.binaryPartName + '"; filename="' + filename + '"');
        filePart.setBody(fileBuffer);
        req.addPart(filePart);

        var bufferView = (new Uint8Array(req.getBuffer()));

        return sfrfile
            .all(sObjectName)
            .post(
                bufferView,
                null, {
                    'Content-Type': 'multipart/form-data; boundary="' + boundaryStr + '"'
                })
            .then(function(response) {
                return response;
            });
    };
    return sfrfile;
});
