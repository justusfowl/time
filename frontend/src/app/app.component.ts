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

  ngOnInit(){
      console.log("init");

      $(".nav a").on("click", function(){
          $(".nav").find(".active").removeClass("active");
          $(this).parent().addClass("active");
      });

     this.username = this.authorizationService.getUsername();
    
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

  clickLogout(){
    this.authorizationService.logout();
    this.router.navigate(["/login"]);
  }
}
