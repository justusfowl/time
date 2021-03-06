import { Component, OnInit  } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {IMyDpOptions} from 'mydatepicker';
import { AuthenticationService,  DataHandlingService, FormatterService, UtilService } from '../_services/index';

@Component({
  selector: 'app-root',
  templateUrl: './request.component.html',
  styleUrls: ['../app.component.css']
})

export class RequestComponent implements OnInit{

    public myDatePickerOptions: IMyDpOptions = {
        firstDayOfWeek: 'mo',
        dateFormat: 'yyyy-mm-dd',
    };

  constructor(
      private router: Router, 
      private route: ActivatedRoute, 
      private authService: AuthenticationService,
      private dataHandlingService : DataHandlingService, 
      public formatter : FormatterService, 
      private util: UtilService
    ){

  }

  timeRequests: any;
  vacRequests: any; 
  vacValue: any;
  vacDays: any; 
  topEntries = 5;

  // Home visit
  dateHomeVisit : any; 
  timeHomeVisitFrom: any; 
  timeHomeVisitTo: any; 

  // additional time stamp
  dateAdd: any; 
  timeAdd: any; 
  directionAdd: any; 

  // vacation
  dateVacStart: any; 
  dateVacEnd: any; 
  dateHours: any;

  // result of vacation
  vacTotalDurationHrs: any;


  ngOnInit(){

    this.util.setNavOnRoute("request");

    $(".recordBtn").on("click", function(){
        $(".btn-group").find(".active").removeClass("active");
        $(this).addClass("active");
      });

    this.getTimeRequests();
    this.getVacRequests();
    
    this.timeHomeVisitFrom = "14:00";
    this.timeHomeVisitTo = "16:00";

    this.timeAdd = "09:00";

    this.vacDays = [];
    
  } 

  getTimeRequests(){
    var userId = this.authService.getUserId(); 
    let params = {"userid": userId, "sortBy": "refdate", "sortDir" : "DESC"};

    this.dataHandlingService.getTimeRequests(params).subscribe(
      data => {
          this.timeRequests = data;
      },
      error => {
        this.dataHandlingService.errorHandler(error);
      });
 
  }

  getVacRequests(){
    var userId = this.authService.getUserId(); 
    let params = {"userid": userId, "sortBy": "refdate", "sortDir" : "DESC"};

    this.dataHandlingService.getVacRequests(params).subscribe(
      data => {
          this.vacRequests = data;
          console.log(data); 
      },
      error => {
        this.dataHandlingService.errorHandler(error);
      });

  }

  addRequest(requestcatid){

    var userId = this.authService.getUserId(); 
    var body = {"userid" : userId}

    if (requestcatid == 1){
        body["requestcatid"] = requestcatid;
        body["timeAdd"] = this.timeAdd; 
        body["dateAdd"] = this.dateAdd.formatted;
        body["directionAdd"] = this.directionAdd;

    }else if (requestcatid == 2){
        // requests for deletion are not handled in this pane but are executed upon within the account view
    }
    else if (requestcatid == 3){
        body["requestcatid"] = requestcatid;
        body["timeHomeVisitFrom"] = this.timeHomeVisitFrom;
        body["timeHomeVisitTo"] = this.timeHomeVisitTo;
        body["dateHomeVisit"] = this.dateHomeVisit.formatted;

    }else{
        console.log("requestcatid not implemented"); 
        return; 
    }

    this.dataHandlingService.addRequest(body).subscribe(
      data => {

        this.dataHandlingService.infoHandler("Antrag erstellt", "Anträge");

        this.dateHomeVisit = null;
        this.timeHomeVisitTo = null;
        this.timeHomeVisitFrom = null;

        this.timeAdd = null;
        this.dateAdd = null;

        this.getTimeRequests();

      },
      error => {
        this.dataHandlingService.errorHandler(error);
      });
  }

  addVacRequest(){
    
    var userId = this.authService.getUserId(); 
    var body = {"userid" : userId}
    body["dateVacStart"] = this.dateVacStart.formatted.replace(/-/g,"");
    body["dateVacEnd"] = this.dateVacEnd.formatted.replace(/-/g,"");

    this.dataHandlingService.addVacRequest(body).subscribe(
        data => {

          this.dataHandlingService.infoHandler("Urlaubsanfrage erstellt", "Urlaubsanträge");
          this.dateVacStart = ""; 
          this.dateVacEnd = ""; 
          this.getVacRequests();

        },
        error => {
            this.dataHandlingService.errorHandler(error);
        });
    }

  getVacationValue(){
    
    if (parseInt(this.dateVacEnd.formatted.replace(/-/g,"")) > parseInt(this.dateVacStart.formatted.replace(/-/g,""))){
    
      var userId = this.authService.getUserId(); 
      let params = {
          "userid": userId, 
          "sortBy": "refdate", 
          "sortDir" : "DESC",
          "dateVacStart": this.dateVacStart.formatted.replace(/-/g,""),
          "dateVacEnd": this.dateVacEnd.formatted.replace(/-/g,"") 
      };

      this.dataHandlingService.getVacationValue(params).subscribe(
        data => {

          this.vacValue = data.vacationValues; 
          this.vacDays = data.vacationOverview;

          this.getTotalVacHrs();

        },
        error => {
          this.dataHandlingService.errorHandler(error);
        });

    }else{
      alert("Bitte Enddatum größer als Startdatum wählen")
    }

  }
    
  handlePaginagingClick(){
    this.topEntries = this.topEntries + 5;
  }

  dirBtnClick(event){
    this.directionAdd = event.target.dataset.val; 
  }

  handleVacBtnCheck(){

    if (this.dateVacStart != undefined && this.dateVacEnd != undefined){

        this.getVacationValue();
    }else{
        alert("not ready, please select both start and end date.")
    }
   
  }

  showVacInfoModal(){

    $('#modalVacRequestInfo').modal('show');
  }

  getTotalVacHrs(){

    var totalHrs = 0; 

    for (var i=0; i<this.vacDays.length; i++){
        totalHrs += parseFloat(this.vacDays[i].avgHrsWorked)
    }

    this.vacTotalDurationHrs = totalHrs; 


  }


}