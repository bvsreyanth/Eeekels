import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

@Component({
    selector: 'app-navbar',
    imports: [RouterModule,CommonModule],
    templateUrl: './navbar.html',
    styleUrl: './navbar.scss'
})
export class Navbar {
    msalService=inject(MsalService);
    dropdownOpen = false;

    onProfileClick(){
        this.dropdownOpen = !this.dropdownOpen;
    }

    logout(){
        this.msalService.logoutRedirect();
    }

 @HostListener('document:click', ['$event'])
    onOutsideClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.profile-dropdown')) {
            this.dropdownOpen = false;
        }
    }
}
