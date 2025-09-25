import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './navbar/navbar';
import { SwUpdate } from '@angular/service-worker';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, Navbar],
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App {
    protected readonly title = signal('app_rules_setup');
    private updates = inject(SwUpdate);

    constructor() {
        if (this.updates.isEnabled) {
            this.updates.versionUpdates.subscribe(() => {
                const doReload = confirm('A new version of the app is available. Reload now?');
                if (doReload) {
                    window.location.reload();
                }
            });
        }
    }
}
