import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddLogsources } from '../add-logsources/add-logsources';
import { ConnectedLogSourceDto, LogSourceProvider, LogSourceRefreshRequest } from '../services/api.service';
import { LogSourcesFacade } from '../services/api.sourcesfacade.service';
import { LogSourceProviderDisplayMap } from '../enums/enum';
import 'zone.js';
import { FormsModule } from '@angular/forms';


@Component({
    selector: 'app-logsources',
    imports: [CommonModule, AddLogsources,FormsModule],
    templateUrl: './logsources.html',
    styleUrl: './logsources.scss'
})
export class Logsources implements OnInit {
    protected logSources: ConnectedLogSourceDto[] = [];
    protected loading = false;
    LogSourceProviderDisplayMap = LogSourceProviderDisplayMap;
    protected refreshingMap: Record<string, boolean> = {};
    protected deletingMap: Record<string, boolean> = {};



    private readonly logSourcesFacade = inject(LogSourcesFacade);
     @ViewChild(AddLogsources)
         logsourceFormModal!: AddLogsources;

     ngOnInit(): void {
         this.loading = true;
         this.logSourcesFacade.getConnectedLogSources().subscribe({
             next: (sources) => {
                 this.logSources = sources;
                 this.loading = false;
             },
             error: (err) => {
                 console.error('Failed to load log sources:', err);
                 this.loading = false;
             }
         });
     }

     getProviderDisplay(provider: string): string {
         console.log(provider);
         if (provider === undefined || provider === null) return 'Unknown';
         const key = Number(provider) as LogSourceProvider;
         return LogSourceProviderDisplayMap[key] ?? 'Unknown';
     }

     openModal(): void {
         this.logsourceFormModal.openModal();
     }

     onDeleteLogSource(id: string): void {
         if (!confirm('Are you sure you want to delete this log source?')) return;
         this.logSourcesFacade.deleteLogSource(id).subscribe({
             next: () => {
                 this.logSources = this.logSources.filter(l => l.publicId !== id);
             },
             error: err => {
                 console.error('Failed to delete log source', err);
                 alert('Failed to delete log source. Try again.');
             },
             complete: () => {
                 this.deletingMap[id] = false;
             }
         });
     }


     onLogSourceAdded(): void {
         console.log('Log source added, refreshing list...');
         this.logSourcesFacade.getConnectedLogSources().subscribe({
             next: (sources) => {
                 this.logSources = sources;
                 this.loading = false;
             },
             error: (err) => {
                 console.error('Failed to load log sources:', err);
                 this.loading = false;
             }
         });
     }
     onModalClosed(): void {
         console.log('Log source modal closed.');
     }
     onRefreshLogSource(publicId: string): void {
         if (!publicId) return;

         this.refreshingMap[publicId] = true;

         const body = LogSourceRefreshRequest.fromJS({
             publicId: publicId,
             userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
         });

         this.logSourcesFacade.refresh(body).subscribe({
             next: () => {
                 this.logSourcesFacade.getConnectedLogSources().subscribe({
                     next: (sources) => {
                         this.logSources = sources;
                     },
                     error: (err) => {
                         console.error('Failed to refresh log sources:', err);
                     },
                     complete: () => {
                         this.refreshingMap[publicId] = false;
                     }
                 });
             },
             error: (err) => {
                 console.error('Refresh failed:', err);
                 this.refreshingMap[publicId] = false;
             }
         });
     }

}
