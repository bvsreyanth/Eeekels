import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { Assistant } from './assistant/assistant';
import { Logsources } from './logsources/logsources';
import { MsalGuard } from '@azure/msal-angular';

export const routes: Routes = [
    {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [MsalGuard],
    },
    {
        path: 'assistant',
        component: Assistant,
        canActivate: [MsalGuard],
    },
    {
        path: 'logsources',
        component: Logsources,
        canActivate: [MsalGuard],
    },
    {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full',
    },
];
