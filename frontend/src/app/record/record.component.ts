import { Component, OnInit  } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';


import { DataHandlingService } from '../_services/index';

@Component({
  selector: 'app-root',
  templateUrl: './record.component.html',
  styleUrls: ['../app.component.css']
})

export class RecordComponent implements OnInit{

  constructor(
    private router: Router, 
    private route: ActivatedRoute, 
    private dataHandlingService : DataHandlingService
  
  ){
   
  }

  currTime : any
  recordDir : Number

  

  ngOnInit(){

    $(".recordBtn").on("click", function(){
      $(".recordBtnGroup").find(".active").removeClass("active");
      $(this).addClass("active");
   });

   this.currTime = new Date();

  }

  dirBtnClick(event,i){
    let clickedDir = event.target.dataset.val; 
    console.log(clickedDir)
    this.recordDir = clickedDir; 
    console.log(localStorage.getItem("currentUserName"))

    
    
  }
  recordBtnClick(event, i){
    this.addActualTime();
  }

  addActualTime(){
    let username = localStorage.getItem("currentUserName"); 
    let userId = localStorage.getItem("currentUserId");  // @TODO: localStorage.getItem("currentUserId")
    let currDir = this.recordDir; 
    let currTime = this.currTime; 
    console.log("ich bin hier")

    this.dataHandlingService.addActualTime(parseInt(userId), currTime, parseInt(currDir)).subscribe(
      data => {
          //this.router.navigate([this.returnUrl]);
          console.log(data);
          console.log("success");
      },
      error => {
          //this.alertService.error(error);
          console.log(error);
          console.log("error")
      });
  }

}