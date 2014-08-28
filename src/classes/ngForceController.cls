global class ngForceController {

	/*
	* Modified Version of RemoteTKController
	*/

	public class picklistValues {
		String label {get; set;}
		String value {get; set;}
	}

	public class Select2Data {
		@TestVisible String id               {get; set;}
		@TestVisible String name             {get; set;}
		@TestVisible String searchName {get; set;}
	}

	public class QueryString {
		@TestVisible String selectClause {get; set;}
		@TestVisible String fromClause {get; set;}
	}

	private static String makeError(String message, String errorCode) {
		JSONGenerator gen = JSON.createGenerator(false);
		gen.writeStartArray();
		gen.writeStartObject();
		gen.writeStringField('message', message);
		gen.writeStringField('errorCode', errorCode);
		gen.writeEndObject();
		gen.writeEndArray();

		return gen.getAsString();
	}

	private static String writeFields(String objtype, SObject obj, String fields) {
		Map<String, Object> fieldMap = null;
		try {
			fieldMap = (Map<String, Object>)JSON.deserializeUntyped(fields);
			fieldMap.remove('attributes');
		} catch (JSONException je) {
			return makeError(je.getMessage(), 'JSON_PARSER_ERROR');
		}

		Schema.SObjectType targetType = Schema.getGlobalDescribe().get(objtype);

		Map<String, Schema.sObjectField> targetFields = targetType.getDescribe().fields.getMap();

		try {
			for (String key : fieldMap.keySet()) {
				if (targetFields.get(key) == null) {
					system.debug('[{"message":"Field ' + key + ' does not exist on object type ' + objtype + '","errorCode":"INVALID_FIELD"}]');
					return '[{"message":"Field ' + key + ' does not exist on object type ' + objtype + '","errorCode":"INVALID_FIELD"}]';
				}

				Object value = fieldMap.get(key);
				Schema.DisplayType valueType = targetFields.get(key).getDescribe().getType();

				if (value instanceof String && valueType != Schema.DisplayType.String) {
					// Coerce an incoming String to the correct type
					String svalue = (String)value;

					if (valueType == Schema.DisplayType.Date) {
						system.debug('doing ' + key + ' : ' + svalue);
						obj.put(key, Date.valueOf(svalue));
					} else if ( valueType == Schema.DisplayType.DateTime) {
						obj.put(key, DateTime.valueOf(svalue));
					} else if (valueType == Schema.DisplayType.Percent ||
					           valueType == Schema.DisplayType.Currency) {
						obj.put(key, svalue == '' ? null : Decimal.valueOf(svalue));
					} else if (valueType == Schema.DisplayType.Double) {
						obj.put(key, svalue == '' ? null : Double.valueOf(svalue));
					} else if (valueType == Schema.DisplayType.Integer) {
						obj.put(key, Integer.valueOf(svalue));
					} else if (valueType == Schema.DisplayType.Base64) {
						obj.put(key, EncodingUtil.base64Decode(svalue.split(',')[1]));
					} else {
						obj.put(key, svalue);
					}
				} else {
					// Just try putting the incoming value on the object
					obj.put(key, value);
				}
			}
		} catch (SObjectException soe) {
			system.debug(soe.getMessage() + 'INVALID_FIELD');
			return makeError(soe.getMessage(), 'INVALID_FIELD');
		}

		return null;
	}

	@remoteAction
	public static String describe(String objtype) {
		// Just enough to make the sample app work!
		Schema.SObjectType targetType = Schema.getGlobalDescribe().get(objtype);
		if (targetType == null) {
			return '[{"message":"The requested resource does not exist","errorCode":"NOT_FOUND"}]';
		}

		Schema.DescribeSObjectResult sobjResult = targetType.getDescribe();

		Map<String, Schema.SObjectField> fieldMap = sobjResult.fields.getMap();

		List<Object> fields = new List<Object>();
		for (String key : fieldMap.keySet()) {
			Schema.DescribeFieldResult descField = fieldMap.get(key).getDescribe();
			Map<String, Object> field = new Map<String, Object>();

			field.put('type', descField.getType().name().toLowerCase());
			field.put('name', descField.getName());
			field.put('label', descField.getLabel());
			List<String> references = new List<String>();
			for (Schema.sObjectType t : descField.getReferenceTo()) {
				references.add(t.getDescribe().getName());
			}
			if (!references.isEmpty()) {
				field.put('referenceTo', references);
			}

			fields.add(field);
		}

		Map<String, Object> result = new Map<String, Object>();
		result.put('fields', fields);

		return JSON.serialize(result);
	}

	/*
	 * These methods are available only after you have established a fieldset
	 * on an object.
	@remoteAction
	public static String describeFieldSet(String objtype, String fieldSetName) {
	Schema.SObjectType token = Schema.getGlobalDescribe().get(objtype);
	Schema.DescribeSObjectResult dr = token.getDescribe();
	Map<String, Schema.FieldSet> FsMap = dr.fieldSets.getMap();
	return JSON.serialize(FsMap.get(FieldSetName).getFields());
	}

	@remoteAction
	public static String describeField(String objtype, String fieldName) {
	Schema.SObjectType token = Schema.getGlobalDescribe().get(objtype);
	Schema.DescribeSObjectResult dr = token.getDescribe();
	Schema.DescribeFieldResult fieldDescribe = dr.fields.getMap().get(fieldName).getDescribe();
	return JSON.serialize(fieldDescribe);
	}

	@remoteAction
	public static String soqlFromFieldSet(String objtype, String fieldSetName) {
	Schema.SObjectType token = Schema.getGlobalDescribe().get(objtype);
	Schema.DescribeSObjectResult dr = token.getDescribe();
	Map<String, Schema.FieldSet> FsMap = dr.fieldSets.getMap();
	String selectClause = 'SELECT Id';
	Set<Schema.FieldSetMember> querySet = new Set<Schema.FieldSetMember>();
	querySet.addAll(FsMap.get(FieldSetName).getFields());
	for (Schema.FieldSetMember f : querySet) {
	  selectClause += ', ' + f.getFieldPath();
	}
	String fromClause = ' FROM ' + dr.getName();
	QueryString qs = new QueryString();
	qs.selectClause = selectClause;
	qs.fromClause = fromClause;
	return JSON.serialize(qs);
	}

	@remoteAction
	public static String queryFromFieldSet(String id, String fieldSetName) {
	Id objId = (id) Id;
	Schema.SObjectType token = objId.getSObjectType();
	Schema.DescribeSObjectResult dr = token.getDescribe();
	Map<String, Schema.FieldSet> FsMap = dr.fieldSets.getMap();
	String queryString = 'SELECT Id';
	List<Schema.FieldSetMember> querySet = new List<Schema.FieldSetMember>();
	querySet = FsMap.get(FieldSetName).getFields();
	for (Schema.FieldSetMember f : querySet) {
	  queryString += ', ' + f.getFieldPath();
	}
	queryString += ' FROM ' + dr.getName() + ' WHERE id = \'' + objId + '\' LIMIT 1';
	system.debug(queryString);
	return JSON.serialize(database.Query(queryString));
	}
	*/
	@remoteAction
	public static String getPicklistValues(String objtype, String fieldName) {
		Schema.SObjectType token = Schema.getGlobalDescribe().get(objtype);
		Schema.DescribeSObjectResult dr = token.getDescribe();
		Map<String, Schema.SObjectField> field_map = dr.fields.getMap();
		List<Schema.PicklistEntry> pickListValues = field_map.get(fieldName).getDescribe().getPickListValues();
		List<pickListValues> options = new List<picklistValues>();
		for (Schema.PicklistEntry plv : pickListValues) {
			pickListValues pv = new pickListValues();
			pv.label = plv.getLabel();
			pv.value = plv.getValue();
			options.add(pv);
		}
		return JSON.serialize(options);
	}

	@remoteAction
	public static String getQueryResultsAsSelect2Data(String soql) {
		List<sObject> records;
		try {
			records = Database.query(soql);
			system.debug('somehow passed ' + records);
		} catch (QueryException qe) {
			system.debug('caught query exception');
			return makeError(qe.getMessage(), 'INVALID_QUERY');
		} catch (Exception e) {
			system.debug('caught exception');
			return makeError(e.getMessage(), 'INVALID_QUERY');
		}
		List<Select2Data> sData = new List<Select2Data>();
		for (sObject r : records) {
			Select2Data s = new Select2Data();
			s.id = r.id;
			s.name = (String) r.get('Name');
			//s.searchName = (String) r.get('SearchName__c');
			sData.add(s);
		}
		return JSON.serialize(sData);
	}

	@remoteAction
	public static String sObjectKlone(String iId) {
		Id id = (id) iId;
		sObjectType type = id.getSObjectType();
		Schema.DescribeSObjectResult dr = type.getDescribe();
		map<String, Schema.SObjectField> fieldMap = dr.fields.getMap();
		String qs = 'SELECT Id';
		Set<string> querySet = new Set<string>();
		querySet.addAll(fieldMap.keySet());
		querySet.remove('id');
		for (String f : querySet) {
			qs += ', ' + f;
		}
		qs += ' FROM ' + dr.getName() + ' WHERE id = \'' + id + '\' LIMIT 1';
		sObject toClone = Database.query(qs);
		sObject cloned = toClone.clone(false, true, false, false);
		String results;
		try {
			upsert cloned;
			results = cloned.id;
		} catch (DMLException e) {
			system.debug(e);
			results = e.getMessage();
		}
		return JSON.serialize(results);
	}

	@remoteAction
	public static String getObjType(String Id) {
		Id objId = (id) Id;
		Schema.SObjectType token = objId.getSObjectType();
		Schema.DescribeSObjectResult dr = token.getDescribe();
		String objName = dr.getName();
		Map<String, String> retObj = new Map<String, String>();
		retObj.put('type', objName);
		return JSON.serialize(retObj);
	}

	@remoteAction
	public static String create(String objtype, String fields) {
		Schema.SObjectType targetType = Schema.getGlobalDescribe().get(objtype);
		if (targetType == null) {
			return '[{"message":"The requested resource does not exist","errorCode":"NOT_FOUND"}]';
		}

		Map<String, Schema.sObjectField> targetFields = targetType.getDescribe().fields.getMap();

		SObject obj = targetType.newSObject();

		Map<String, Object> fieldMap = null;

		String error = writeFields(objType, obj, fields);
		if (error != null) {
			return error;
		}

		try {
			insert obj;
		} catch (DMLException dmle) {
			String fieldNames = '';
			for (String field : dmle.getDmlFieldNames(0)) {
				if (fieldNames.length() > 0) {
					fieldNames += ',';
				}
				fieldNames += '"' + field + '"';
			}
			return '[{"fields":[' + fieldNames + '],"message":"' + dmle.getDmlMessage(0) + '","errorCode":"' + dmle.getDmlType(0).name() + '"}]';
		}

		Map<String, Object> result = new Map<String, Object>();
		result.put('id', obj.id);
		result.put('errors', new List<String>());
		result.put('success', true);

		return JSON.serialize(result);
	}

	@remoteAction
	public static String bulkCreate(String objtype, String fields) {
		Schema.SObjectType targetType = Schema.getGlobalDescribe().get(objtype);
		Map<String, Schema.sObjectField> targetFields = targetType.getDescribe().fields.getMap();
		if (targetType == null) {
			return '[{"message":"The requested resource does not exist","errorCode":"NOT_FOUND"}]';
		}

		List<sObject> objs = new List<sObject>();

		Map<String, Object> incomingFieldJsonObject = null;
		try {
			incomingFieldJsonObject = (Map<String, Object>)JSON.deserializeUntyped(fields);
		} catch (JSONException je) {
			return '[{"message":"' + je.getMessage() + '","errorCode":"JSON_PARSER_ERROR"}]';
		}

		try {
			for (String row : incomingFieldJsonObject.keySet()) {
				Map<String, Object> current = (Map<String, Object>) incomingFieldJsonObject.get(row);
				SObject obj = targetType.newSObject();
				for (String property : current.keySet()) {
					if (targetFields.get(property).getDescribe().getType() == Schema.DisplayType.Date) {
						obj.put(property, Date.valueOf((String)current.get(property)));
					} else if ( targetFields.get(property).getDescribe().getType() == Schema.DisplayType.DateTime) {
						obj.put(property, DateTime.valueOf((String)current.get(property)));
					} else if (targetFields.get(property).getDescribe().getType() == Schema.DisplayType.Percent ||
					           targetFields.get(property).getDescribe().getType() == Schema.DisplayType.Currency) {
						obj.put(property, String.valueOf(current.get(property)) == '' ? null : Decimal.valueOf((String)current.get(property)));
					} else if (targetFields.get(property).getDescribe().getType() == Schema.DisplayType.Double) {
						obj.put(property, String.valueOf(current.get(property)) == '' ? null : Double.valueOf(current.get(property)));
					} else if (targetFields.get(property).getDescribe().getType() == Schema.DisplayType.Integer) {
						obj.put(property, Integer.valueOf(current.get(property)));
					} else {
						obj.put(property, current.get(property));
					}
				}
				objs.add(obj);
			}
		} catch (SObjectException soe) {
			return '[{"message":"' + soe.getMessage() + '","errorCode":"INVALID_FIELD"}]';
		}

		try {
			insert objs;
		} catch (DMLException dmle) {
			String fieldNames = '';
			for (String field : dmle.getDmlFieldNames(0)) {
				if (fieldNames.length() > 0) {
					fieldNames += ',';
				}
				fieldNames += '"' + field + '"';
			}
			return '[{"fields":[' + fieldNames + '],"message":"' + dmle.getDmlMessage(0) + '","errorCode":"' + dmle.getDmlType(0).name() + '"}]';
		}

		List<Id> rids = new List<Id>();
		for (sObject o : objs) {
			rids.add(o.Id);
		}

		Map<String, Object> result = new Map<String, Object>();
		result.put('id', rids);
		result.put('errors', new List<String>());
		result.put('success', true);

		return JSON.serialize(result);
	}

	/**
	 * Perform a bulk update operation for a JSON array of SObjects.
	 * @param  objtype    SObject name e.g. "Account"
	 * @param  jsonObjArr Array of SObject field data that should include the ID
	 * @return JSON array of the records that have successfully been updated.
	 */
	@remoteAction public static String bulkUpdate(String objtype, String jsonObjArr) {
		Type listType = Type.forName('List<' + objType + '>');
		if (listType == null) {
			return makeError('The requested resource does not exist', 'NOT_FOUND');
		}

		List<SObject> objs;
		try {
			objs = (List<SObject>)JSON.deserialize(jsonObjArr, listType);
		} catch (JSONException je) {
			return makeError('Unable to deserialize the JSON data array', 'INVALID_JSON');
		}

		try {
			update objs;
		} catch (DMLException dmle) {
			return makeError(dmle.getMessage(), 'DML_ERROR');
		}

		List<Id> rids = new List<Id>();
		for (sObject o : objs) {
			rids.add(o.Id);
		}

		Map<String, Object> result = new Map<String, Object>();
		result.put('id', rids);
		result.put('errors', new List<String>());
		result.put('success', true);

		return JSON.serialize(result);
	}

	@remoteAction
	public static String retrieve(String objtype, String id, String fieldlist) {
		Boolean containsId = false;
		for (String field : fieldlist.split(',')) {
			if (field.equalsIgnoreCase('id')) {
				containsId = true;
				break;
			}
		}

		if (!containsId) {
			fieldlist = 'Id,' + fieldlist;
		}

		String soql = 'SELECT ' + fieldlist + ' FROM ' + objtype + ' WHERE Id = \'' + id + '\'';
		List<sObject> records;
		try {
			records = Database.query(soql);
		} catch (QueryException qe) {
			return '[{"message":"' + qe.getMessage() + '","errorCode":"INVALID_QUERY"}]';
		}

		return JSON.serialize(records[0]);
	}

	@remoteAction
	public static String upser(String objtype, String externalIdField, String externalId, String fields) {
		Schema.SObjectType targetType = Schema.getGlobalDescribe().get(objtype);

		SObject obj = targetType.newSObject();
		obj.put(externalIdField, externalId);

		Map<String, Object> fieldMap =
		  (Map<String, Object>)JSON.deserializeUntyped(fields);
		for (String key : fieldMap.keySet()) {
			obj.put(key, fieldMap.get(key));
		}

		Schema.SObjectField sobjField = targetType.getDescribe().fields.getMap().get(externalIdField);

		Database.Upsert(obj, sobjField);

		return null;
	}

	@remoteAction
	public static String updat(String objtype, String id, String fields) {
		Schema.SObjectType targetType = Schema.getGlobalDescribe().get(objtype);
		if (targetType == null) {
			return '[{"message":"The requested resource does not exist","errorCode":"NOT_FOUND"}]';
		}

		SObject obj = targetType.newSObject(id);

		Map<String, Object> fieldMap = null;

		String error = writeFields(objType, obj, fields);
		if (error != null) {
			return error;
		}

		try {
			update obj;
		} catch (DMLException dmle) {
			String fieldNames = '';
			for (String field : dmle.getDmlFieldNames(0)) {
				if (fieldNames.length() > 0) {
					fieldNames += ',';
				}
				fieldNames += '"' + field + '"';
			}
			system.debug('[{"fields":[' + fieldNames + '],"message":"' + dmle.getDmlMessage(0) + '","errorCode":"' + dmle.getDmlType(0).name() + '"}]');
			return '[{"fields":[' + fieldNames + '],"message":"' + dmle.getDmlMessage(0) + '","errorCode":"' + dmle.getDmlType(0).name() + '"}]';
		}

		return null;
	}

	@remoteAction
	public static String del(String objtype, String id) {
		Schema.SObjectType targetType = Schema.getGlobalDescribe().get(objtype);
		if (targetType == null) {
			return '[{"message":"The requested resource does not exist","errorCode":"NOT_FOUND"}]';
		}

		SObject obj = targetType.newSObject(id);

		try {
			delete obj;
		} catch (DMLException dmle) {
			String fieldNames = '';
			for (String field : dmle.getDmlFieldNames(0)) {
				if (fieldNames.length() > 0) {
					fieldNames += ',';
				}
				fieldNames += '"' + field + '"';
			}
			return '[{"fields":[' + fieldNames + '],"message":"' + dmle.getDmlMessage(0) + '","errorCode":"' + dmle.getDmlType(0).name() + '"}]';
		}

		return null;
	}

	@remoteAction
	public static String query(String soql) {
		List<sObject> records;
		try {
			records = Database.query(soql);
		} catch (QueryException qe) {
			return '[{"message":"' + qe.getMessage() + '","errorCode":"INVALID_QUERY"}]';
		}

		Map<String, Object> result = new Map<String, Object>();
		result.put('records', records);
		result.put('totalSize', records.size());
		result.put('done', true);

		return JSON.serialize(result);
	}

	@remoteAction
	public static String search(String sosl) {
		system.debug('$$$$$$$$$' + sosl);
		List<List<SObject>> result;
		try {
			result = Search.query(sosl);
		} catch (SearchException se) {
			return '[{"message":"' + se.getMessage() + '","errorCode":"INVALID_SEARCH"}]';
		} catch (Exception e) {
			system.debug('$$$$$$$$$$$' + e.getCause());
			return '[{"message":"' + e.getMessage() + '","errorCode":"INVALID_SEARCH"}]';
		}

		return JSON.serialize(result);
	}

}