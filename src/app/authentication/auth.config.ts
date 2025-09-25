import {
    LogLevel,
    Configuration,
    BrowserCacheLocation,
} from '@azure/msal-browser';
import { environment } from '../../environments/environment';
const isIE =
  window.navigator.userAgent.indexOf('MSIE ') > -1 ||
  window.navigator.userAgent.indexOf('Trident/') > -1;

export const b2cPolicies = {
    names: {
        signIn: 'B2C_1_Signin'
    },
    authorities: {
        signIn: {
            authority:
      `https://${environment.msalConfig.auth.tenantName}.b2clogin.com/${environment.msalConfig.auth.tenantName}.onmicrosoft.com/${environment.msalConfig.auth.policyNames.signIn}`,
        }
    },
    authorityDomain: `${environment.msalConfig.auth.tenantName}.b2clogin.com`,
};

export const msalConfig: Configuration = {
    auth: {
        clientId: environment.msalConfig.auth.clientId,
        authority: b2cPolicies.authorities.signIn.authority,
        knownAuthorities: [b2cPolicies.authorityDomain],
        redirectUri: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: BrowserCacheLocation.SessionStorage,
        storeAuthStateInCookie: isIE,
    },
    system: {
        loggerOptions: {
            logLevel: LogLevel.Verbose,
            piiLoggingEnabled: false,
        },
    },
};

export const loginRequest = {
    scopes: environment.loginRequest.scopes,
};
