const ApimService = require('../src/services/apimService')

prepare = async () =>{
    const apim = new ApimService()
    
    const identity = await apim.signin(testEmail,testPassword)
    if (identity.authenticated){
        await apim.closeAccount(identity.id)
    }
}

testEmail = "test@test.com"
testPassword = "testPw"
testFirstName = "testFirstName"
testLastName = "testLastName"
testStripeSubscriptionId = "testStripeSubsName"
testSubscriptionName= "testSubscriptionName"