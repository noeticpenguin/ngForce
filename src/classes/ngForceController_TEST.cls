@isTest
public class ngForceController_TEST {
	private static String tooLongAccName = 'LOTS OF ' +
	                                       'CHARACTERS XXXXXXXXXXXXXXXXXXXXXXXX' +
	                                       'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' +
	                                       'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' +
	                                       'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' +
	                                       'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' +
	                                       'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' +
	                                       'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' +
	                                       'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' +
	                                       'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' +
	                                       'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' +
	                                       'XXXXXXXXXXXXXXXX';

	static private void assertError(String jsonResult, String expectedError, String method) {
		system.debug('##################' + jsonResult);
		List<Object> errorArray = (List<Object>)JSON.deserializeUntyped(jsonResult);

		System.assertNotEquals(null, errorArray,
		                       'error array missing from ' + method + ' result');
		System.assertNotEquals(0, errorArray.size(),
		                       'error array is empty in ' + method + ' result');

		Map<String, Object> error = (Map<String, Object>)errorArray[0];
		String errorCode = (String)error.get('errorCode');
		System.assertNotEquals(null, errorCode,
		                       'errorCode property missing from ' + method + ' result');
		System.assertEquals(expectedError, errorCode,
		                    'errorCode should be ' + expectedError + ' in ' + method + ' result');
	}

	static testMethod void testDescribe() {
		// Assume we have accounts
		String jsonResult = ngForceController.describe('Account');

		System.assertNotEquals(null, jsonResult,
		                       'ngForceController.describe returned null');

		Map<String, Object> result = (Map<String, Object>)JSON.deserializeUntyped(jsonResult);

		System.assertNotEquals(null, result.get('fields'),
		                       'fields property missing from ngForceController.describe result');

		// TODO - more assertions on describe results

		// Invalid object type
		// Hope there isn't a QXZXQZXZQXZQ object type!
		jsonResult = ngForceController.describe('QXZXQZXZQXZQ');
		assertError(jsonResult, 'NOT_FOUND', 'ngForceController.describe');
	}

	static private void assertRecord(Map<String, Object> record, String accName, String accNumber, String method) {
		Map<String, Object> attributes = (Map<String, Object>)record.get('attributes');
		System.assertNotEquals(null, attributes,
		                       'attributes property missing from ' + method + ' result');
		System.assertNotEquals(0, attributes.keySet().size(),
		                       'empty attributes object in ' + method + ' result');

		String type = (String)attributes.get('type');
		System.assertNotEquals(null, type,
		                       'type property missing from ' + method + ' result');
		System.assertEquals('Account', type,
		                    'Wrong type in ' + method + ' result');

		String url = (String)attributes.get('url');
		System.assertNotEquals(null, url,
		                       'url property missing from ' + method + ' result');

		Id id = (Id)record.get('Id');
		System.assertNotEquals(null, id,
		                       'Id property missing from ' + method + ' result');
		Account account = [SELECT Id, Name FROM Account WHERE Id = :id LIMIT 1];
		System.assertNotEquals(null, account,
		                       'Couldn\'t find account record identified by ' + method + ' result');
		System.assertEquals(accName, account.Name,
		                    'Account name doesn\'t match in ' + method + ' result');

		String name = (String)record.get('Name');
		System.assertNotEquals(null, name,
		                       'Name property missing from ' + method + ' result');
		System.assertEquals(accName, name,
		                    'Wrong account name in ' + method + ' result');

		String accountNumber = (String)record.get('AccountNumber');
		System.assertNotEquals(null, name,
		                       'AccountNumber property missing from ' + method + ' result');
		System.assertEquals(accNumber, accountNumber,
		                    'Wrong account number in ' + method + ' result');
	}

	static private Id testCreate(String accName, String accNumber, String fields) {
		// Assume we can create an account

		// Try with data in correct types
		String jsonResult = ngForceController.create('Account',
		                    '{"Name": "' + accName + '", ' +
		                    '"AccountNumber" : "' + accNumber + '",' +
		                    fields + '}');

		System.assertNotEquals(null, jsonResult,
		                       'ngForceController.create returned null');

		Map<String, Object> result = (Map<String, Object>)JSON.deserializeUntyped(jsonResult);

		Boolean success = (Boolean)result.get('success');
		System.assertNotEquals(null, success,
		                       'success property missing from ngForceController.create result');
		System.assertNotEquals(false, success,
		                       'success is false in ngForceController.create result');

		List<Object> errors = (List<Object>)result.get('errors');
		System.assertNotEquals(null, errors,
		                       'errors property missing from ngForceController.create result');
		System.assertEquals(0, errors.size(),
		                    'errors array is not empty in ngForceController.create result');

		Id id = (Id)result.get('id');
		System.assertNotEquals(null, id,
		                       'id property missing from ngForceController.create result');
		Account account = [SELECT Id, Name, AccountNumber FROM Account LIMIT 1];
		System.assertNotEquals(null, account,
		                       'Couldn\'t find account record created by ngForceController.create result');
		System.assertEquals(accName, account.Name,
		                    'Account name doesn\'t match in ngForceController.create result');
		System.assertEquals(accNumber, account.AccountNumber,
		                    'Account number doesn\'t match in ngForceController.create result');

		jsonResult = ngForceController.create('QXZXQZXZQXZQ', '{"Name": "' + accName + '"}');
		assertError(jsonResult, 'NOT_FOUND', 'ngForceController.create');

		jsonResult = ngForceController.create('Account', '{"Name" "' + accName + '"}');
		assertError(jsonResult, 'JSON_PARSER_ERROR', 'ngForceController.create');

		jsonResult = ngForceController.create('Account', '{"XQZXQZXQZXQZ" : "' + accName + '"}');
		assertError(jsonResult, 'INVALID_FIELD', 'ngForceController.create');

		jsonResult = ngForceController.create('Account', '{"Name" : "' + tooLongAccName + '"}');
		assertError(jsonResult, 'STRING_TOO_LONG', 'ngForceController.create');

		return id;
	}

	static private void testRetrieve(String accName, String accNumber, Id id) {
		String jsonResult = ngForceController.retrieve('Account', id, 'Name, AccountNumber');

		System.assertNotEquals(null, jsonResult,
		                       'ngForceController.retrieve returned null');

		Map<String, Object> result = (Map<String, Object>)JSON.deserializeUntyped(jsonResult);

		assertRecord(result, accName, accNumber, 'ngForceController.retrieve');

		// TODO - test negative paths for retrieve
	}

	static private void testQuery(String accName, String accNumber) {
		String jsonResult = ngForceController.query('SELECT Id, Name, AccountNumber FROM Account WHERE Name = \'' + accName + '\'');

		System.assertNotEquals(null, jsonResult,
		                       'ngForceController.query returned null');

		Map<String, Object> result = (Map<String, Object>)JSON.deserializeUntyped(jsonResult);

		List<Object> records = (List<Object>)result.get('records');
		System.assertNotEquals(null, records,
		                       'records property missing from ngForceController.query result');
		System.assertEquals(1, records.size(),
		                    'records array should have single record in ngForceController.query result');

		Map<String, Object> record = (Map<String, Object>)records[0];

		assertRecord(record, accName, accNumber, 'ngForceController.query');

		Integer totalSize = (Integer)result.get('totalSize');
		System.assertNotEquals(null, totalSize,
		                       'totalSize property missing from ngForceController.query result');
		System.assertEquals(1, totalSize,
		                    'totalSize should be 1 in ngForceController.query result');

		Boolean done = (Boolean)result.get('done');
		System.assertNotEquals(null, done,
		                       'done property missing from ngForceController.query result');
		System.assertEquals(true, done,
		                    'done should be true in ngForceController.query result');

		jsonResult = ngForceController.query('SSSSSS Id, Name FROM Account WHERE Name = \'' + accName + '\'');
		assertError(jsonResult, 'INVALID_QUERY', 'ngForceController.query');
	}

	static private void testSearch(String accName, String accNumber, Id id) {
		Id [] fixedSearchResults = new Id[1];
		fixedSearchResults[0] = id;
		Test.setFixedSearchResults(fixedSearchResults);
		String jsonResult = ngForceController.search('FIND {' + accName + '} IN ALL FIELDS RETURNING Account (Id, Name, AccountNumber)');

		System.assertNotEquals(null, jsonResult,
		                       'ngForceController.search returned null');

		List<Object> result = (List<Object>)JSON.deserializeUntyped(jsonResult);

		List<Object> records = (List<Object>)result[0];

		Map<String, Object> record = (Map<String, Object>)records[0];

		assertRecord(record, accName, accNumber, 'ngForceController.search');

		jsonResult = ngForceController.search('FFFF {' + accName + '} IN ALL FIELDS RETURNING Account (Id, Name)');
		assertError(jsonResult, 'INVALID_SEARCH', 'ngForceController.search');
	}

	static private void testUpdate(String accName, String accNumber, Id id, String fields) {
		String jsonResult = ngForceController.updat('Account', id, '{"Name":"' + accName + '", "AccountNumber":"' + accNumber + '"}');
		System.assertEquals(null, jsonResult,
		                    'Non-null result from ngForceController.updat');
		Account account = [SELECT Id, Name, AccountNumber FROM Account WHERE Id = :id LIMIT 1];
		System.assertNotEquals(null, account,
		                       'Couldn\'t find account record after ngForceController.updat');
		System.assertEquals(accName, account.Name,
		                    'Account name doesn\'t match after ngForceController.updat');
		System.assertEquals(accNumber, account.AccountNumber,
		                    'Account number doesn\'t match after ngForceController.updat');

		jsonResult = ngForceController.updat('QXZXQZXZQXZQ', id, '{"Name":"' + accName + '"}');
		assertError(jsonResult, 'NOT_FOUND', 'ngForceController.updat');

		jsonResult = ngForceController.updat('Account', id, '{"XQZXQZXQZXQZ" : "' + accName + '"}');
		assertError(jsonResult, 'INVALID_FIELD', 'ngForceController.updat');

	}

	static private void testUpsert(String accName, String accNumber, String id, String fields) {
		String jsonResult = ngForceController.upser('Account',
		                    'Id',
		                    (String)id,
		                    '{"Name":"' + accName + '", ' +
		                    '"AccountNumber":"' + accNumber + '",' +
		                    fields + '}');
		System.assertEquals(null, jsonResult,
		                    'Non-null result from ngForceController.upser');
		Account account = [SELECT Id, Name, AccountNumber FROM Account WHERE id = :id LIMIT 1];
		System.assertNotEquals(null, account,
		                       'Couldn\'t find account record after ngForceController.upser');
		System.assertEquals(accName, account.Name,
		                    'Account name doesn\'t match after ngForceController.upser');
		System.assertEquals(accNumber, account.AccountNumber,
		                    'Account number doesn\'t match after ngForceController.upser');
	}

	static private void testDelete(Id id) {
		String jsonResult = ngForceController.del('QXZXQZXZQXZQ', id);
		assertError(jsonResult, 'NOT_FOUND', 'ngForceController.del');

		jsonResult = ngForceController.del('Account', id);
		System.assertEquals(null, jsonResult,
		                    'Non-null result from ngForceController.del');
		List<Account> accounts = [SELECT Id, Name FROM Account WHERE Id = :id];
		System.assertEquals(0, accounts.size(),
		                    'Account record was not deleted by ngForceController.del');

		jsonResult = ngForceController.del('Account', id);
		assertError(jsonResult, 'ENTITY_IS_DELETED', 'ngForceController.del');
	}

	static testMethod void testGetObjType() {
		Account a = TestUtils.getAccount();
		String jsonResult = ngForceController.getObjType(a.id);
		System.assertNotEquals(null, jsonResult,
		                       'ngForceController.getObjType returned null');
		Map<String, Object> result = (Map<String, Object>)JSON.deserializeUntyped(jsonResult);
		System.assertEquals('Account', result.get('type'));
	}

	static testMethod void testGetPicklistValues() {
		String jsonResult = ngForceController.getPicklistValues('Opportunity', 'StageName');
		System.assertNotEquals(null, jsonResult);
		List<Object> result = (List<Object>)JSON.deserializeUntyped(jsonResult);
		System.assertNotEquals(null, result);
	}

	static testMethod void testBulkCreate() {
		Map<Integer, Account> js = new Map<Integer, Account>();
		String fields = '{"0":{"Name":"foo company 1368751413359"},"1":{"Name":"foo company 1368751413440"},"2":{"Name":"foo company 1368751413459"},"3":{"Name":"foo company 1368751413479"},"4":{"Name":"foo company 1368751413497"},"5":{"Name":"foo company 1368751413517"},"6":{"Name":"foo company 1368751413540"},"7":{"Name":"foo company 1368751413559"},"8":{"Name":"foo company 1368751413577"},"9":{"Name":"foo company 1368751413597"}}';
		String jsonResult = ngForceController.bulkCreate('Account', fields);
		Map<String, Object> result = (Map<String, Object>)JSON.deserializeUntyped(jsonResult);
		System.AssertNotEquals(result.get('id'), null);
		System.AssertEquals(result.get('success'), true);
	}

	// Test performing an update of SObjects from a JSON data array:
	static testMethod void testBulkUpdate() {
		Account acc1 = new Account(Name = 'Test name 1');
		Account acc2 = new Account(Name = 'Test name 2');
		insert new List<Account> { acc1, acc2 };

		String accsJson = '[{"Id": "' + acc1.Id + '", "Name": "Test new name 1" },' +
		                  '{"Id": "' + acc2.Id + '", "Name": "Test new name 2" }]';
		System.debug(accsJson);

		String res = ngForceController.bulkUpdate('Account', accsJson);
		System.debug('Return value: ' + res);

		acc1 = [
		         SELECT Id, Name
		         FROM Account
		         WHERE Id = :acc1.Id
		       ];
		System.assertEquals('Test new name 1', acc1.Name, 'Expecting Account name to be updated');

		acc2 = [
		         SELECT Id, Name
		         FROM Account
		         WHERE Id = :acc2.Id
		       ];
		System.assertEquals('Test new name 2', acc2.Name, 'Expecting Account name to be updated');
	}


	static testMethod void testCRUD() {
		String accName = 'Test1';
		String accNumber = '1234';

		// String field values
		Id id = testCreate(accName, accNumber, '"AnnualRevenue" : "10000.00",' +
		                   '"NumberOfEmployees" : "1000",' +
		                   '"Phone" : "(111) 222-3333"');
		testDelete(id);

		// Integer field values
		id = testCreate(accName, accNumber, '"AnnualRevenue" : 1000000,' +
		                '"NumberOfEmployees" : 1000,' +
		                '"Phone" : "(111) 222-3333"');
		testRetrieve(accName, accNumber, id);
		testQuery(accName, accNumber);
		testSearch(accName, accNumber, id);
		testUpdate(accName + '1', accNumber + '1', id, '"AnnualRevenue" : "1100000",' +
		           '"NumberOfEmployees" : "1100",' +
		           '"Phone" : "(112) 222-3333"');
		testUpdate(accName + '2', accNumber + '2', id, '"AnnualRevenue" : "2000000",' +
		           '"NumberOfEmployees" : "2000",' +
		           '"Phone" : "(222) 222-3333"');
		testUpsert(accName + '3', accNumber + '3', id, '"AnnualRevenue" : 3000000,' +
		           '"NumberOfEmployees" : 3000,' +
		           '"Phone" : "(333) 222-3333"');
		testUpsert(accName + '4', accNumber + '4', id, '"AnnualRevenue" : 4000000,' +
		           '"NumberOfEmployees" : 4000,' +
		           '"Phone" : "(444) 222-3333"');
		testDelete(id);
	}
}