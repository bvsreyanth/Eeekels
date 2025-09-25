import { inject, Injectable } from '@angular/core';
import { AuthField, ConnectedLogSourceDto, CreateLogSourceResponse, LogSourceRefreshRequest, LogSourceRefreshResponse, LogSourceRequestDto, LogSourcesClient, RemoveLogSourceResponse } from './api.service';
import { map, Observable } from 'rxjs';

@Injectable({providedIn: 'root'})
export class LogSourcesFacade{
    private readonly apiClient = inject(LogSourcesClient);

    getConnectedLogSources(): Observable<ConnectedLogSourceDto[]> {
        return this.apiClient
            .connectedLogSources()
            .pipe(map(response => response.connectedLogSources ?? []));
    }

    deleteLogSource(id: string): Observable<RemoveLogSourceResponse> {
        return this.apiClient.delete(id).pipe(
            map(response => {
                return response;
            })
        );
    }

    addLogSource(
        displayName: string,
        provider: number,
        type: number,
        baseUrl: string,
        userTimeZone: string,
        auth: AuthField[] = []
    ): Observable<CreateLogSourceResponse> {
        console.log('Adding log source:');
        const request = new LogSourceRequestDto({
            displayName,
            provider,
            type,
            baseUrl,
            userTimeZone,
            auth: auth.map(field => new AuthField(field))
        });
        return this.apiClient.add(request);
    }
    refresh(body: LogSourceRefreshRequest): Observable<LogSourceRefreshResponse> {
        return this.apiClient.refresh(body);
    }

}
