import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'app/_services/index';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{

  constructor (private router: Router, 
              private authorizationService : AuthenticationService 
            ){

  }
  title = 'app';

  username : any;

  ngOnInit(){
      console.log("init")
      $(".nav a").on("click", function(){
        $(".nav").find(".active").removeClass("active");
        $(this).parent().addClass("active");
     });

     this.username = this.authorizationService.getUsername();

  }

  clickLogout(){
    this.authorizationService.logout();
  }
}
