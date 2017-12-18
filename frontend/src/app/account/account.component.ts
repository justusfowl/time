import { Component, OnInit  } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { AuthenticationService,  DataHandlingService, FormatterService, UtilService } from '../_services/index';


@Component({
  selector: 'app-root',
  templateUrl: './account.component.html',
  styleUrls: ['../app.component.css']
})

export class AccountComponent implements OnInit{

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

  ngOnInit(){

    this.getAccountBalance();
    this.getVacationInfo();
  
  }

  getPairBookings(){
    var userId = this.authService.getUserId(); 
    let params = {"userid": userId, "sortBy": "refdate", "sortDir" : "DESC", "top": 20,
    "aggregation": "(difference with sum as totalHrsWorked)"};

    this.dataHandlingService.getTimePairs(params).subscribe(
      data => {
          alert("pair bookings nirgends verwendet bislang")
      },
      error => {
          //this.alertService.error(error);
          console.log(error);
      });

  }

  getAccountBalance(){
    var userId = this.authService.getUserId(); 
    let params = {"userid": userId, "sortBy": "refmonth", "sortDir" : "DESC" };

    this.dataHandlingService.getAccountBalance(params).subscribe(
      data => {
          //this.router.navigate([this.returnUrl]);
          this.balance = data;
      },
      error => {
          //this.alertService.error(error);
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

  handlePaginagingClick(){
    this.topEntries = this.topEntries + 5;
  }

  getYtdDisplay(){
    return new Date().getFullYear();
  }

}