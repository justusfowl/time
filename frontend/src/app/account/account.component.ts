import { Component, OnInit  } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {IMyDpOptions} from 'mydatepicker';
import { AuthenticationService,  DataHandlingService, FormatterService, UtilService } from '../_services/index';


@Component({
  selector: 'app-root',
  templateUrl: './account.component.html',
  styleUrls: ['../app.component.css']
})

export class AccountComponent implements OnInit{

  public myDatePickerOptions: IMyDpOptions = {
    firstDayOfWeek: 'mo',
    dateFormat: 'yyyymmdd',
  };

  // Initialized to specific dates in ngOnInit
  public refDateFrom: any;
  public refDateTo: any;

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private authService: AuthenticationService,
    private dataHandlingService : DataHandlingService, 
    public formatter : FormatterService, 
    private util: UtilService
  
  ){
   
  }

  balance : any; 
  topEntries = 10; 
  vacHoursRemaining = 0; 
  weightedContractVacHrs = 0; 
  filteredDayBookings : any;
  allDayBookings: any; 
  dayBookingsRefDateFrom: Number;
  dayBookingsRefDateTo: Number;
  rawBookings: any; 
  hrsWorkedThisMonth : any; 
  timehrsPerMonthThisMonth : any; 

  ngOnInit(){

    this.util.setNavOnRoute("account");

    var today = new Date();
    var todayAMonthAgo = new Date(today.getTime() - 30*24*60*60*1000); 
    
    this.refDateFrom = { date: { year: todayAMonthAgo.getFullYear(), month: todayAMonthAgo.getUTCMonth()+1, day: todayAMonthAgo.getDate() } };
    this.refDateTo = { date: { year: today.getFullYear(), month: today.getUTCMonth()+1, day: today.getDate() } };

    this.dayBookingsRefDateFrom = parseFloat(todayAMonthAgo.getFullYear().toString() + (todayAMonthAgo.getUTCMonth()+1).toString().padStart(2,"0") + todayAMonthAgo.getDate().toString().padStart(2,"0")) ;
    this.dayBookingsRefDateTo = parseFloat(today.getFullYear().toString() + (today.getUTCMonth()+1).toString().padStart(2,"0") + today.getDate().toString().padStart(2,"0")) ;
    
    this.getAccountBalance();
    this.getVacationInfo();
    this.getSingleBookings();
    this.getRawBookings();
    
  }

  getRawBookings(){
    var userId = this.authService.getUserId(); 
    let params = {"userid": userId, "sortBy": "refdate", "sortDir" : "DESC", "top": this.topEntries};

    this.dataHandlingService.getRawBookings(params).subscribe(
      data => {
          this.rawBookings = data;
      },
      error => {
        this.dataHandlingService.errorHandler(error);
      });

  }

  getAccountBalance(){
    var userId = this.authService.getUserId(); 
    let params = {"userid": userId, "sortBy": "refmonth", "sortDir" : "DESC" };

    this.dataHandlingService.getAccountBalance(params).subscribe(
      data => {
          this.balance = data;
          
          var hrsWorked = 0;
          var auxHrs = 0;

          if (!isNaN(parseFloat(data[0].auxHrs))){
            auxHrs = parseFloat(data[0].auxHrs);
          }
          if (!isNaN(parseFloat(data[0].hrsWorked))){
            hrsWorked = parseFloat(data[0].hrsWorked);
          }

          this.hrsWorkedThisMonth = hrsWorked + auxHrs;
          this.timehrsPerMonthThisMonth = this.balance[0].timehrspermonth;
      },
      error => {
        this.dataHandlingService.errorHandler(error);
      });

  }

  getVacationInfo(){
    var userId = this.authService.getUserId(); 
    let params = {"userid": userId};

    this.dataHandlingService.getVacationInfo(params).subscribe(
      data => {
          console.log(data);
          this.getCurrentVacationBalance(data);
      },
      error => {
        this.dataHandlingService.errorHandler(error);
      });
  }

  getSingleBookings(){

    var userId = this.authService.getUserId(); 
    let params = {"userid": userId, "sortBy": "refdate", "sortDir" : "DESC" };

    this.dataHandlingService.getSingleBookings(params).subscribe(
      data => {
          this.allDayBookings = data;
          this.filterDayBookings();
      },
      error => {
        this.dataHandlingService.errorHandler(error);
      });
  }

  getCurrentVacationBalance(vacArr){
    var currVacBalance = 0;
    var refYearWeightedVacHrs = 0; 
    $.each( vacArr, function( index, value ){
      if (value.refyear == new Date().getFullYear()){

        var vacationHrsAvailable = 0; 

        if (typeof(value.weightedContractVacHrs) != "undefined"){
          vacationHrsAvailable = value.weightedContractVacHrs;
        
        }
        
        var vacationHrsTaken = 0; 

        if (typeof(value.totalHrsVacationTaken) != "undefined"){
          vacationHrsTaken = value.totalHrsVacationTaken;
        }

        currVacBalance += vacationHrsAvailable - vacationHrsTaken;

        refYearWeightedVacHrs = value.weightedContractVacHrs;
      } 
    });
    this.vacHoursRemaining = this.formatter.formatNumberDecimals(currVacBalance,2);
    this.weightedContractVacHrs = refYearWeightedVacHrs;
  }

  deleteRequest(row, element){

    $(element.target).prop("disabled",true);
    
    var actualtimeid = row.actualtimeid; 

    var userId = this.authService.getUserId(); 
    var body = {
            "userid" : userId, 
            "actualtimeid": actualtimeid, 
            "requestcatid" : 2, 
            "directionId" : row.directionid, 
            "actualtime": row.actualtime
          }

    this.dataHandlingService.addRequest(body).subscribe(
      data => {
        this.getRawBookings();
        alert("Ihre Löschanfrage wurde entgegengenommen.")
      },
      error => {
        this.dataHandlingService.errorHandler(error);
        alert("Ihre Löschanfrage wurde bereits entgegengenommen, bitte überprüfen Sie Ihre Übersicht der Anfragen.")
      });
  }

  calculateTotalBalance(){

    var totalBalance = 0; 

    $.each( this.balance, function( index, value ){
      if (value.year == new Date().getFullYear()){
        totalBalance += value.balance
      }
        
    });

    return this.formatter.formatNumberDecimals(totalBalance,2); 

  }

  filterDayBookings(){
    var filteredBookings = []; 
    var refDateFrom = this.dayBookingsRefDateFrom; 
    var refDateTo = this.dayBookingsRefDateTo; 

    $.each( this.allDayBookings, function( index, value ){
      if (parseInt(value.refdate) >= refDateFrom && parseInt(value.refdate) <= refDateTo){
        filteredBookings.push(value);
      }
        
    });

    this.filteredDayBookings = filteredBookings; 
  }

  handlePaginagingClick(){
    this.topEntries = this.topEntries + 5;
  }

  getYtdDisplay(){
    return new Date().getFullYear();
  }

  hideDeleteReqBtn(row){
    if (row.requestid == null){
      return true; 
    }else{
      return false; 
    }
  }

  onDateChanged(event, src) {
    if (src == "from"){
      this.dayBookingsRefDateFrom = parseInt(event.formatted);  
    }else if (src == "to"){
      this.dayBookingsRefDateTo = parseInt(event.formatted); 
    }else{
      throw "No source defined for the onDateChanged Event"
    }

    this.filterDayBookings();

    console.log('onDateChanged(): ', event.date, ' - jsdate: ', new Date(event.jsdate).toLocaleDateString(), ' - formatted: ', event.formatted, ' - epoc timestamp: ', event.epoc);
    
  }


}