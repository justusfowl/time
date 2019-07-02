import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataHandlingService } from '../_services/datahandling.service';
import { environment as ENV } from '../../environments/environment';
import { Router } from '@angular/router';

@Injectable()
export class AuthenticationService {
    constructor(
        private http: Http,
        private router: Router,
        private dataHandlingService : DataHandlingService,
    ) { 

        if (localStorage.getItem('currentUserToken')) {
            // logged in so return true

            var expiresAt = parseInt(localStorage.getItem('expiresAt'));
            var now = new Date().getDate();

            var expiresInSec = (expiresAt-now)/1000;

            if (expiresInSec < 0){
                this.router.navigate(['/login']);
            }else{
                this.expiryPeriod = expiresInSec / 60; // expiryPeriod loaded in seconds and converted into minutes
                this.logoffDate = new Date(expiresAt);
                this.initiateActivityTime();
            }
            
        }else{
            this.expiryPeriod  = 0;
        }
       
    }

    public username : any; 
    public expiryPeriod : number;  // periode in minutes
    public activityInterval : any;
    public activityRemainingTime: any;
    public logonDate : any;
    public logoffDate: any;

    getUsername(){
        return localStorage.getItem('currentUserName');
    }

    getUserId(){
        return localStorage.getItem('currentUserId');
    }

    getIsAdmin(){
        if (localStorage.getItem('currentUserIsAdmin') == "true"){
            return true; 
        }else{
            return false; 
        } 
    }

    getIsTimePlanner(){
        if (localStorage.getItem('currentUserIsTimePlanner') == "true"){
            return true; 
        }else{
            return false; 
        } 
    }
    
    login(username: string, password: string) {

        var body = {"username" : username, "password": password};

        let headers = new Headers({ 'Content-Type': 'application/json'});
        let options = new RequestOptions({ headers: headers });
        
        console.log("login in auth service")
        
        return this.http.post(this.dataHandlingService.BaseURL + '/api/auth/login', JSON.stringify(body), options)
            .pipe(map((response: Response) => {
                // login successful if there's a jwt token in the response
                let user = response.json();
                console.log(user);
                if (user && user.token) {
                    // store user details and jwt token in local storage to keep user logged in between page refreshes 

                    localStorage.setItem('currentUserToken', user.token);
                    localStorage.setItem('currentUserName', user.username);
                    localStorage.setItem('currentUserIsAdmin', user.adminGroup);
                    localStorage.setItem('currentUserIsTimePlanner', user.timeplannerGroup);
                    localStorage.setItem('currentUserId', user.userid);

                    localStorage.setItem('expiresIn', user.expiresIn);

                    var now = new Date();
                    var expiresAt = new Date(now.getTime() + (user.expiresIn-5)*1000); // allow for 5 extra seconds as grace period during network transmission
                    var expiresAtString = expiresAt.getTime().toString();

                    this.logoffDate = new Date(expiresAt);

                    localStorage.setItem('expiresAt', expiresAtString);

                    this.expiryPeriod = user.expiresIn / 60; // expiryPeriod must be seconds

                    $('#labelUsername').html(user.username);

                    this.initiateActivityTime();

                }
            }));
    }

    logout() {
        // remove user from local storage to log user out
        localStorage.clear();

        $('#labelUsername').html("");

        clearInterval(this.activityInterval);

        console.log("logout");

        this.router.navigate(['/login']);
    }

    isLoggedOnAndTokenValid(){

        if (localStorage.getItem('currentUserToken')) {
            // logged in so return true

            var expiresAt = parseInt(localStorage.getItem('expiresAt'));
            var now = new Date().getTime(); 
    
            var expiresInSec = (expiresAt-now)/1000;

            if (expiresInSec < 0){
                return false;
            }else{
                return true;
            }


        }else{
            return false;
        }

    }

    initiateActivityTime(){
        
        if (this.activityInterval){
            clearInterval(this.activityInterval);
        };

        this.activityInterval = setInterval(this.updateActivityTime.bind(this), 1000);
    }

    updateActivityTime(){

        var now = new Date();
    
        function millisToMinutesAndSeconds(millis) {
          var minutes = Math.floor(millis / 60000);
          var seconds = parseFloat(((millis % 60000) / 1000).toFixed(0));
          return (seconds == 60 ? (minutes+1) + ":00" : minutes + ":" + (seconds < 10 ? "0" : "") + seconds);
        }
        var timeDiff = (this.logoffDate.getTime() - now.getTime()); 
    
        var displayTimeDiff = millisToMinutesAndSeconds(timeDiff);
    
        this.activityRemainingTime = displayTimeDiff;  
    
        if (timeDiff < 0 ){
            if (confirm('Clicken Sie OK, wenn Sie sich erneut einloggen und weiterarbeiten wollen?')) {
               this.logout();
            } else {
                this.logoutTimer();
            }
            
        }
    
      }
    
  logoutTimer(){
    this.logout();
    window.location.replace("https://intranet.praxis.local");

  }
    
}
