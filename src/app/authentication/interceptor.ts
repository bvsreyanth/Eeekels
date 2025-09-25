import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export const HttpInterceptors: HttpInterceptorFn = (req, next) => {
    const msalService = inject(MsalService);

    return msalService.acquireTokenSilent({ scopes: environment.loginRequest.scopes, account: msalService.instance.getAllAccounts()[0] })
        .pipe(
            switchMap((tokenResult) => {
                console.log(tokenResult.accessToken);
                const clonedRequest = req.clone({
                    setHeaders: {
                        Authorization: `Bearer ${tokenResult.accessToken}`,
                    },
                });
                return next(clonedRequest);
            }),
            catchError((error) => {
                console.error('Error acquiring initial token:', error);
                return next(req);
            })
        );
};
