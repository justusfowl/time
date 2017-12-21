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
    private formatter : FormatterService, 
    private util: UtilService
  
  ){
   
  }

  balance : any; 
  topEntries = 10; 
  vacHoursRemaining = 0; 
  filteredDayBookings : any;
  allDayBookings: any; 
  dayBookingsRefDateFrom: Number;
  dayBookingsRefDateTo: Number;
  rawBookings: any; 
  hrsWorkedThisMonth : any; 
  timehrsPerMonthThisMonth : any; 

  ngOnInit(){

    var today = new Date();
    var todayAMonthAgo = new Date(today.getTime() - 30*24*60*60*1000); 
    
    this.refDateFrom = { date: { year: todayAMonthAgo.getFullYear(), month: todayAMonthAgo.getUTCMonth()+1, day: todayAMonthAgo.getDate() } };
    this.refDateTo = { date: { year: today.getFullYear(), month: today.getUTCMonth()+1, day: today.getDate() } };

    this.dayBookingsRefDateFrom = parseFloat(todayAMonthAgo.getFullYear().toString() + (todayAMonthAgo.getUTCMonth()+1).toString() + todayAMonthAgo.getDate().toString()) ;
    this.dayBookingsRefDateTo = parseFloat(today.getFullYear().toString() + (today.getUTCMonth()+1).toString() + today.getDate().toString()) ;
    
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
          console.log(error);
      });

  }

  getAccountBalance(){
    var userId = this.authService.getUserId(); 
    let params = {"userid": userId, "sortBy": "refmonth", "sortDir" : "DESC" };

    this.dataHandlingService.getAccountBalance(params).subscribe(
      data => {
          this.balance = data;
          this.hrsWorkedThisMonth = this.balance[0].hrsWorked; 
          this.timehrsPerMonthThisMonth = this.balance[0].timehrspermonth;
      },
      error => {
          console.log(error);
      });

  }

  getVacationInfo(){
    var userId = this.authService.getUserId(); 
    let params = {"userid": userId};

    this.dataHandlingService.getVacationInfo(params).subscribe(
      data => {
          this.getCurrentVacationBalance(data);
      },
      error => {
          console.log(error);
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
          console.log(error);
      });
  }

  getCurrentVacationBalance(vacArr){
    var currVacBalance = 0; 
    $.each( vacArr, function( index, value ){
      if (value.refyear == new Date().getFullYear()){
        currVacBalance += value.weightedContractVacHrs - value.totalHrsVacationTaken;
      } 
    });
    this.vacHoursRemaining = this.formatter.formatNumberDecimals(currVacBalance,2);
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