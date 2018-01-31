import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthenticationService } from 'app/_services/index';

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(
        private router: Router, 
        private authorizationService : AuthenticationService 
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        
        if (localStorage.getItem('currentUserToken')) {
            // logged in so return true

            this.authorizationService.initiateActivityTime();
            return true;
        }
        
        // not logged in so redirect to login page with the return url
        this.router.navigate(['/login']);
        return false;
    }
}