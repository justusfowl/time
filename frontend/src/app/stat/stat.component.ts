import { Component, OnInit  } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService,  DataHandlingService, FormatterService, UtilService } from '../_services/index';
import * as FileSaver from 'file-saver';
import {IMyDpOptions,IMyDateModel} from 'mydatepicker';



@Component({
  selector: 'app-root',
  templateUrl: './stat.component.html',
  styleUrls: ['../app.component.css']
})

export class StatComponent implements OnInit{

    public myDatePickerOptions: IMyDpOptions = {
        firstDayOfWeek: 'mo',
        dateFormat: 'yyyymmdd',
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

    dateRefMonthReport : any;
    allUsers : any;
    selectedUser: any; 

    refDateFrom: any; 
    refDateTo: any;

    allDayBookings: any;
    filteredDayBookings: any;
    filteredDayBookingsTotals: any;
    
    dayBookingsRefDateFrom: any;  
    dayBookingsRefDateTo: any; 

    topEntries : any;

    ngOnInit(){

        this.util.setNavOnRoute("statistics");
         
        this.getUserInfo();

        let d: Date = new Date();
       
        this.dateRefMonthReport = d.getFullYear().toString() + (d.getMonth() + 1).toString().padStart(2,"0");

            
        var today = new Date();
        var todayAMonthAgo = new Date(today.getTime() - 30*24*60*60*1000); 

        this.refDateFrom = { date: { year: todayAMonthAgo.getFullYear(), month: todayAMonthAgo.getUTCMonth()+1, day: todayAMonthAgo.getDate() } };
        this.refDateTo = { date: { year: today.getFullYear(), month: today.getUTCMonth()+1, day: today.getDate() } };
    
        this.dayBookingsRefDateFrom = parseFloat(todayAMonthAgo.getFullYear().toString() + (todayAMonthAgo.getUTCMonth()+1).toString().padStart(2,"0") + todayAMonthAgo.getDate().toString().padStart(2,"0")) ;
        this.dayBookingsRefDateTo = parseFloat(today.getFullYear().toString() + (today.getUTCMonth()+1).toString().padStart(2,"0") + today.getDate().toString().padStart(2,"0")) ;
    
        this.topEntries = 5;

        this.filteredDayBookingsTotals = {
            "hrsWorked": 0, 
            "vacation": 0, 
            "holidaytime":0, 
            "sickness" : 0, 
            "auxAddTime": 0
        };
        
    }

    onUserRowClick(user, mode){
        this.getReport(user, mode, true);
    }

    onDateChanged(event: IMyDateModel) {
        // event properties are: event.date, event.jsdate, event.formatted and event.epoc
        
        this.dateRefMonthReport = event.date.year.toString() + event.date.month.toString().padStart(2,"0");
        console.log(this.dateRefMonthReport); 
    }

    handleUserSelect(selUser){

        console.log(this.selectedUser);
        this.getSingleBookings();
    }

    onDateAccountChanged(event, src) {
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

    handlePaginagingClick(){
        this.topEntries = this.topEntries + 5;
    }

    getReport(user, mode, flagIsPDF=false){
    
        let params = {
            "userid": user.userid,
            "sortBy": "refmonth",
            "sortDir" : "DESC", 
            filters: [
                this.dataHandlingService.filterItem("year", "eq", this.dateRefMonthReport.substring(0,4)),
                this.dataHandlingService.filterItem("refmonth", "le", this.dateRefMonthReport)
            ]
        };

        if (flagIsPDF){
            params["flagIsPDF"] = true
        }

        this.dataHandlingService.getReport(params).subscribe(
            (res) => {
                if (flagIsPDF){
                    if (mode == 1){
                        FileSaver.saveAs(res, user.username + "_" + this.dateRefMonthReport + "_timereport.pdf"); 
                    }else if (mode == 2){
                        var fileURL = URL.createObjectURL(res);
                        window.open(fileURL); 
                    }
                }
                
            },
            error => {
              this.dataHandlingService.errorHandler(error);
            }
        );
    }

    getUserInfo(){
        
        var userId = this.authService.getUserId(); 
        let params = {"userid": userId, "sortBy": "refdate", "sortDir" : "DESC", "all" : true};

        this.dataHandlingService.getUserInfo(params).subscribe(
            data => {
            this.allUsers = data; 
            },
            error => {
                console.log(error);
            });
    }

    getSingleBookings(){

        var userId = this.selectedUser; 
        let params = {"userid": userId, "sortBy": "refdate", "sortDir" : "DESC" };
    
        this.dataHandlingService.getSingleBookings(params).subscribe(
          data => {
              console.log(data);
              this.allDayBookings = data;
              this.filterDayBookings();
          },
          error => {
            this.dataHandlingService.errorHandler(error);
          });
      }

      getSingleBookingRowClass(row){

        if (
            isNaN(this.formatter.formatNumberDecimals(row.hrsWorked,2)) &&
            isNaN(this.formatter.formatNumberDecimals(row.sickness,2)) &&
            isNaN(this.formatter.formatNumberDecimals(row.vacation,2)) &&
            isNaN(this.formatter.formatNumberDecimals(row.holidaytime,2)) &&
            isNaN(this.formatter.formatNumberDecimals(row.auxAddTime,2))   
        ){
            return true; 
        }else{
            return false; 
        }

      }

      filterDayBookings(){
        var filteredBookings = []; 
        var refDateFrom = this.dayBookingsRefDateFrom; 
        var refDateTo = this.dayBookingsRefDateTo; 

        var totals = {
            "hrsWorked": 0, 
            "vacation": 0, 
            "holidaytime":0, 
            "sickness" : 0, 
            "auxAddTime": 0
        };
    
        $.each( this.allDayBookings, function( index, value ){
          if (parseInt(value.refdate) >= refDateFrom && parseInt(value.refdate) <= refDateTo){
            filteredBookings.push(value);

            if (value.hrsWorked){
                totals.hrsWorked += parseFloat(value.hrsWorked)
            }

            if (value.vacation){
                totals.vacation += parseFloat(value.vacation)
            }

            if (value.holidaytime){
                totals.holidaytime += parseFloat(value.holidaytime)
            }

            if (value.sickness){
                totals.sickness += parseFloat(value.sickness)
            }

            if (value.auxAddTime){
                totals.auxAddTime += parseFloat(value.auxAddTime)
            }


          }
            
        }); 

        console.log(JSON.stringify(filteredBookings));
        console.log(totals);
    
        this.filteredDayBookings = filteredBookings; 
        this.filteredDayBookingsTotals = totals;
      }

}