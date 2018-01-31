import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map'
import { DataHandlingService } from '../_services/datahandling.service';

@Injectable()
export class AuthenticationService {
    constructor(
        private http: Http,
        private dataHandlingService : DataHandlingService,
    ) { }

    public username : any; 
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
            .map((response: Response) => {
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

                    $('#labelUsername').html(user.username);

                    this.initiateActivityTime();

                    // FOR DEV PURPOSES SET USER ID 

                    //var devUserId = "6";
                    //localStorage.setItem('currentUserId', devUserId);
                }
            });
    }

    logout() {
        // remove user from local storage to log user out
        localStorage.removeItem('currentUserToken');
        localStorage.removeItem('currentUserName');
        localStorage.removeItem('currentUserId');
        localStorage.removeItem('currentUserIsAdmin');

        $('#labelUsername').html("");

        clearInterval(this.activityInterval);

        console.log("logout");
    }

    initiateActivityTime(){

        var logoffDate = new Date(); 

        //define the period after which auto-logout happens in minutes 
        logoffDate.setMinutes(logoffDate.getMinutes() + 3);
    
        this.logoffDate = logoffDate;
        
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
            if (confirm('Clicken Sie OK, wenn Sie weiterarbeiten wollen?')) {
                this.initiateActivityTime();
            } else {
                this.logoutTimer();
                
            }
            
        }
    
      }
    
  logoutTimer(){
    this.logout();
    window.location.replace("http://intranet.praxis.local");

  }
    
}
