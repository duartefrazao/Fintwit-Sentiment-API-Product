const jestConfig = require('../jest.config')
const ApimService = require('../src/services/apimService')

beforeAll(async () => {
    await prepare()
    apim = new ApimService();
})

test('Initiate a APIM Client', () => {
    apim.init();

    expect(apim).toBeDefined()
    expect(apim.apimClient).toBeDefined()
})


test('Sign Up new user', async () => {
    const new_user = await apim.signup(testEmail,testPassword,testFirstName,testLastName)

    expect(new_user).toBeDefined()
    expect(new_user.id).toBeDefined()
    
    const result = await apim.closeAccount(new_user.name)
    expect(result).toBeDefined()
})

test('Sign In user successful', async () => {
    await apim.signup(testEmail,testPassword,testFirstName,testLastName)

    const identity = await apim.signin(testEmail,testPassword)

    expect(identity).toBeDefined()
    expect(identity.authenticated).toBe(true)

    const result = await apim.closeAccount(identity.id)
    expect(result).toBeDefined()

})

test('Sign In user unsuccessful', async () => {
    new_user = await apim.signup(testEmail,testPassword,testFirstName,testLastName)

    const identity = await apim.signin(testEmail,testPassword + "incorrect")

    expect(identity).toBeDefined()
    expect(identity.authenticated).toBe(false)
    
    const result = await apim.closeAccount(new_user.name)
    expect(result).toBeDefined()
})

test('Create subscription', async () => {
    new_user = await apim.signup(testEmail,testPassword,testFirstName,testLastName)
    
    new_subscription = await apim.createSubscription(
        testStripeSubscriptionId,
        new_user.name,
        testSubscriptionName,"developer")
    

    expect(new_subscription.state).toBe("active")
    const result = await apim.closeAccount(new_user.name)

})

test('Delete subscription', async () => {
    new_user = await apim.signup(testEmail,testPassword,testFirstName,testLastName)
    
    await apim.createSubscription(
        testStripeSubscriptionId,
        new_user.name,
        testSubscriptionName,"developer")
    
    const new_subscription = await apim.getSubscription(testStripeSubscriptionId)
    expect(new_subscription).toBeDefined()
    expect(new_subscription.state).toBe("active")

    await apim.deleteSubscription(testStripeSubscriptionId)
    
    let deleted = false
    try{
        await apim.getSubscription(testStripeSubscriptionId)
    }catch(error){
        deleted = true
    }

    expect(deleted).toBe(true)
    
    const result = await apim.closeAccount(new_user.name)

})


