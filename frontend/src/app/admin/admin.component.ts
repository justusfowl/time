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
                console.log(error);
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
              console.log(error);
          });
     
      }
    
      getVacRequests(){
        var filterArr = [this.dataHandlingService.filterItem("requeststatus", "eq", this.filterStatusVac)];

        var userId = this.authService.getUserId(); 
        let params = {"sortBy": "refdate", "sortDir" : "DESC", filters: filterArr, "all": true};
    
        this.dataHandlingService.getVacRequests(params).subscribe(
          data => {
              this.vacRequests = data;
              console.log(data); 
          },
          error => {
              console.log(error);
          });
    
      }

    approveRequest(row){

        var body = {"requestId" : row.requestid};
        this.dataHandlingService.approveRequest(body).subscribe(
            data => {
                console.log(data);
                this.getTimeRequests();
            },
            error => {
                console.log(error);
            });

    }

    rejectRequest(row){
        if (confirm('Anfrage ablehnen?')) {
            var body = {"requestId" : row.requestid};
            this.dataHandlingService.rejectRequest(body).subscribe(
                data => {
                    console.log(data);
                    this.getTimeRequests();
                },
                error => {
                    console.log(error);
                });
        } 
    }

    rejectVacRequest(row){
        if (confirm('Anfrage ablehnen?')) {
            var body = {"requestId" : row.requestid};
            this.dataHandlingService.rejectVacRequest(body).subscribe(
                data => {
                    console.log(data);
                    this.getVacRequests();
                },
                error => {
                    console.log(error);
                });
        } 
    }
    
    approveVacRequest(row){
        var body = {"requestId" : row.requestid};
        this.dataHandlingService.approveVacRequest(body).subscribe(
            data => {
                console.log(data);
                this.getVacRequests();
            },
            error => {
                console.log(error);
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