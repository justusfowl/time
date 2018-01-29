import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'app/_services/index';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{

  constructor (
              private router: Router, 
              private authorizationService : AuthenticationService 
            ){
  }

  title = 'Time';

  username : any;
  activityInterval : any;
  activityRemainingTime: any;
  logonDate : any;
  logoffDate: any;

  ngOnInit(){
      console.log("init");

      $(".nav a").on("click", function(){
          $(".nav").find(".active").removeClass("active");
          $(this).parent().addClass("active");
      });

     this.username = this.authorizationService.getUsername();

     var logoffDate = new Date();
     logoffDate.setMinutes(logoffDate.getMinutes() + 3);

     this.logoffDate = logoffDate;
     
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

      this.logoutTimer();
    }

  }

  checkIfAuth(){
    // return false if authenticated so that nav is not hidden
    if (this.authorizationService.getUsername() != null){
      return false; 
    }else{
      return true; 
    }
  }

  checkIfAdmin(){
    // return false if authenticated so that nav is not hidden
    if (this.authorizationService.getIsAdmin()){
      return false; 
    }else{
      return true; 
    }
  }

  logoutTimer(){

    window.location.replace("http://intranet.praxis.local");

  }

  clickLogout(){
    this.authorizationService.logout();
    this.router.navigate(["/login"]);
  }
}
