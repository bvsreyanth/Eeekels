export const environment = {
    production: false,
    msalConfig: {
        auth: {
            clientId: '6a104909-0418-4d26-b65f-ca9d2e57189c',
            tenantName: 'eekelsai',
            policyNames: {
                signIn: 'B2C_1_Signin',
                resetPassword: 'B2C_1_Eekels_password_reset',
            },
        },
    },
    loginRequest: {
        scopes: [
            'https://eekelsai.onmicrosoft.com/2d54c2c6-3930-452b-8f78-89290abb2151/impersonate_user',
            'https://eekelsai.onmicrosoft.com/2d54c2c6-3930-452b-8f78-89290abb2151/user.read',
        ],
    },
    BaseUrl: 'https://eekelsmvp-be.azurewebsites.net/',
};
