import { Component, OnInit  } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService,  DataHandlingService, FormatterService, UtilService } from '../_services/index';
import {IMyDpOptions,IMyDateModel} from 'mydatepicker';



@Component({
  selector: 'app-root',
  templateUrl: './admin.component.html',
  styleUrls: ['../app.component.css']
})

export class AdminComponent implements OnInit{

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

    allUsers : any;
    timeRequests : any;
    vacRequests : any;
    topEntries = 5;

    filterStatus = 0;
    filterStatusVac = 0; 

    ngOnInit(){

        this.util.setNavOnRoute("admin");

        this.getUserInfo();
        this.getTimeRequests();
        this.getVacRequests();
    }

    getUserInfo(){
        
        var userId = this.authService.getUserId(); 
        let params = {"userid": userId, "sortBy": "refdate", "sortDir" : "DESC", "all" : true};

        this.dataHandlingService.getUserInfo(params).subscribe(
            data => {
            this.allUsers = data;
            console.log(data);
            },
            error => {
                this.dataHandlingService.errorHandler(error);
            });
    }

    getTimeRequests(){

        var filterArr = [this.dataHandlingService.filterItem("requeststatus", "eq", this.filterStatus)];

        var userId = this.authService.getUserId(); 
        let params = {"userid": userId, "sortBy": "refdate", "sortDir" : "DESC", filters: filterArr, "all": true};
    
        this.dataHandlingService.getTimeRequests(params).subscribe(
          data => {
              this.timeRequests = data;
          },
          error => {
            this.dataHandlingService.errorHandler(error);
          });
     
      }
    
      getVacRequests(){
        var filterArr = [this.dataHandlingService.filterItem("requeststatus", "eq", this.filterStatusVac)];

        var userId = this.authService.getUserId(); 
        let params = {"sortBy": "refdate", "sortDir" : "DESC", filters: filterArr, "all": true};
    
        this.dataHandlingService.getVacRequests(params).subscribe(
          data => {
              this.vacRequests = data; 
          },
          error => {
                this.dataHandlingService.errorHandler(error);
          });
    
      }

    approveRequest(row){

        var body = {"requestId" : row.requestid};
        this.dataHandlingService.approveRequest(body).subscribe(
            data => {
                this.getTimeRequests();
            },
            error => {
                this.dataHandlingService.errorHandler(error);
            });

    }

    rejectRequest(row){
        if (confirm('Anfrage ablehnen?')) {
            var body = {"requestId" : row.requestid};
            this.dataHandlingService.rejectRequest(body).subscribe(
                data => {
                    this.getTimeRequests();
                },
                error => {
                    this.dataHandlingService.errorHandler(error);
                });
        } 
    }

    rejectVacRequest(row){
        if (confirm('Anfrage ablehnen?')) {
            var body = {"requestId" : row.requestid};
            this.dataHandlingService.rejectVacRequest(body).subscribe(
                data => {
                    this.getVacRequests();
                },
                error => {
                    this.dataHandlingService.errorHandler(error);
                });
        } 
    }
    
    approveVacRequest(row){
        var body = {"requestId" : row.requestid};
        this.dataHandlingService.approveVacRequest(body).subscribe(
            data => {
                this.getVacRequests();
            },
            error => {
                this.dataHandlingService.errorHandler(error);
            });
    }

    handleStatusSelect(event){
        this.filterStatus = parseInt(event.target.value)
        this.getTimeRequests();
    }

    handleVacStatusSelect(event){
        this.filterStatusVac = parseInt(event.target.value)
        this.getVacRequests();
    }

    handlePaginagingClick(){
        this.topEntries = this.topEntries + 5;
    }

    enableAction(row){
        if (row.requeststatus > 0){
            return false;
        }else{
            return true;
        }
    }


}