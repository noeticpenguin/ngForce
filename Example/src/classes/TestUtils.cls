public with sharing class TestUtils {

    public static User getStandardTestUser() {
        String unique = String.valueOf(DateTime.now().getTime());
        Profile p = [SELECT Id FROM Profile WHERE Name='Standard User']; 
        User u = new User(Alias = 'standt', Email='standarduser55@testorg.com', 
        EmailEncodingKey='UTF-8', LastName='Testing', LanguageLocaleKey='en_US', 
        LocaleSidKey='en_US', ProfileId = p.Id, 
        TimeZoneSidKey='America/Los_Angeles', UserName='standarduser@'+ unique +'testorg.com');
        insert u;
        return u;
    }
    
    public static Account getAccount() {
        Account a = new Account();
        String unique = String.valueOf(DateTime.now().getTime());
        a.name = 'foo company ' + unique;
        insert a;
        return a;
    }

    public static LABJS_Mo_Tester_2__c getMoTester2() {
        LABJS_Mo_Tester_2__c mo2 = new LABJS_Mo_Tester_2__c();
        insert mo2;
        return mo2;
    }

}