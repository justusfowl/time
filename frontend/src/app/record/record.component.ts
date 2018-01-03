import { Component, OnInit, OnDestroy  } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';


import { AuthenticationService,  DataHandlingService, FormatterService, UtilService } from '../_services/index';

@Component({
  selector: 'app-root',
  templateUrl: './record.component.html',
  styleUrls: ['../app.component.css']
})

export class RecordComponent implements OnInit, OnDestroy{

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private authService: AuthenticationService,
    private dataHandlingService : DataHandlingService, 
    private formatter : FormatterService,
    private util: UtilService
  
  ){
   
  }

  currTime : any
  recordDir = 1;
  timePairs : any;
  topEntries = 2;
  updateInterval : any; 
  

  ngOnInit(){

    this.util.setNavOnRoute("record");

    $(".recordBtn").on("click", function(){
      $(".recordBtnGroup").find(".active").removeClass("active");
      $(this).addClass("active");
    });

   this.currTime = new Date();
   this.getPairBookings();
   this.updateInterval = setInterval(this.updateCurrTime.bind(this), 1000);

  }

  updateCurrTime(){
    this.currTime = new Date(); 
  }

  ngOnDestroy(){
    clearInterval(this.updateInterval);
  }

  dirBtnClick(event,i){
    let clickedDir = event.target.dataset.val; 
    this.recordDir = clickedDir;
  }

  recordBtnClick(event, i){
    this.addActualTime();
  }

  addActualTime(){
    let userId = this.authService.getUserId();
    let currDir = this.recordDir; 
    let currTime = this.util.formatDateToIsoWithTZ(this.currTime); 
    
    this.dataHandlingService.addActualTime(parseInt(userId), currTime, currDir).subscribe(
      data => {
          //this.router.navigate([this.returnUrl]);
          this.getPairBookings();
      },
      error => {
          this.dataHandlingService.errorHandler(error);
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
          this.dataHandlingService.errorHandler(error);
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