import { Component, OnInit  } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';


import { AuthenticationService,  DataHandlingService, FormatterService } from '../_services/index';

@Component({
  selector: 'app-root',
  templateUrl: './record.component.html',
  styleUrls: ['../app.component.css']
})

export class RecordComponent implements OnInit{

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private authService: AuthenticationService,
    private dataHandlingService : DataHandlingService, 
    private formatter : FormatterService
  
  ){
   
  }

  currTime : any
  recordDir = 1;
  timePairs : any;
  topEntries = 2; 
  

  ngOnInit(){

    $(".recordBtn").on("click", function(){
      $(".recordBtnGroup").find(".active").removeClass("active");
      $(this).addClass("active");
    });

   this.currTime = new Date();

   this.getPairBookings();

  }

  dirBtnClick(event,i){
    let clickedDir = event.target.dataset.val; 
    console.log(clickedDir)
    this.recordDir = clickedDir; 
    console.log(this.authService.getUsername())
    
  }


  recordBtnClick(event, i){
    this.addActualTime();
  }

  addActualTime(){
    let userId = this.authService.getUserId();
    let currDir = this.recordDir; 
    let currTime = this.currTime; 
    
    this.dataHandlingService.addActualTime(parseInt(userId), currTime, currDir).subscribe(
      data => {
          //this.router.navigate([this.returnUrl]);
          console.log("success");
      },
      error => {
          //this.alertService.error(error);
          console.log(error);
      });
      
  }

  getPairBookings(){
    var userId = this.authService.getUserId(); 
    let params = {"userid": userId, "sortBy": "refdate", "sortDir" : "DESC", "top": this.topEntries};

    this.dataHandlingService.getTimePairs(params).subscribe(
      data => {
          //this.router.navigate([this.returnUrl]);
          this.timePairs = data
      },
      error => {
          //this.alertService.error(error);
          console.log(error);
      });

  }

  handlePaginagingClick(){
    this.topEntries = this.topEntries + 2;
    this.getPairBookings();
  }

  identifyMissingMatch(row){
    if (typeof(row.cometime) == "undefined" || typeof(row.gotime) == "undefined"){
      //return false; 
      return "×";
    }else{
      //return true;
      return "✔";
    }
  }

}