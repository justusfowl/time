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
        dateFormat: 'yyyy-mm-dd',
    };

    constructor(
        private router: Router, 
        private route: ActivatedRoute, 
        private authService: AuthenticationService,
        private dataHandlingService : DataHandlingService, 
        private formatter : FormatterService, 
        private util: UtilService
        ){
    
        }

    dateRefMonthReport : any;
    allUsers : any;


    ngOnInit(){

        this.util.setNavOnRoute("statistics");
         
        this.getUserInfo();

        let d: Date = new Date();
       
        this.dateRefMonthReport = d.getFullYear().toString() + (d.getMonth() + 1).toString().padStart(2,"0");

    }

    onUserRowClick(user, mode){
        this.getReport(user, mode);
    }

    onDateChanged(event: IMyDateModel) {
        // event properties are: event.date, event.jsdate, event.formatted and event.epoc
        
        this.dateRefMonthReport = event.date.year.toString() + event.date.month.toString().padStart(2,"0");
        console.log(this.dateRefMonthReport); 
    }

    getReport(user, mode){
    
        let params = {
            "userid": user.userid,
            "sortBy": "refmonth",
            "sortDir" : "DESC", 
            filters: [
                this.dataHandlingService.filterItem("year", "eq", this.dateRefMonthReport.substring(0,4)),
                this.dataHandlingService.filterItem("refmonth", "le", this.dateRefMonthReport), ]
        };

        this.dataHandlingService.getReport(params).subscribe(
            (res) => {

                if (mode == 1){
                    FileSaver.saveAs(res, user.username + "_" + this.dateRefMonthReport + "_timereport.pdf"); 
                }else if (mode == 2){
                    var fileURL = URL.createObjectURL(res);
                    window.open(fileURL); 
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
}