import { Component, OnInit  } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService,  DataHandlingService, FormatterService, UtilService } from '../_services/index';
import {IMyDpOptions,IMyDateModel} from 'mydatepicker';
import { environment as ENV } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';

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

    public appVersion : any;
    public environ : any;

    constructor(
        private router: Router, 
        private route: ActivatedRoute, 
        private authService: AuthenticationService,
        private dataHandlingService : DataHandlingService, 
        private formatter : FormatterService, 
        private util: UtilService,
        private toastr: ToastrService
        ){

            this.appVersion = ENV.appVersion;
            if (ENV.production){
                this.environ = "prod";
            }else{
                this.environ = "dev";
            }
    
        }

    allUsers : any;
    timeRequests : any;
    vacRequests : any;
    topEntries = 5;

    filterStatus = 0;
    filterStatusVac = 0; 

    //time modifications

    selectedUser : number;
    timeTimeModi: Number;
    timeTimeModiFrom: any; 
    timeTimeModiTo: any;

    selectedAuxTimeOption : number = 4;

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
               
                if (data.length > 0){
                    this.selectedUser = data[0].userId;
                }
               
            },
            error => {
                this.dataHandlingService.errorHandler(error);
            });
    }

    getTimeRequests(){

        var filterArr = [this.dataHandlingService.filterItem("requeststatus", "eq", this.filterStatus)];

        var userId = this.authService.getUserId(); 
        let params = {"userid": userId, filters: filterArr, "all": true};
    
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
                this.toastr.success('Zeitmodifikation', 'Anfrage bestätigt');
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
                    this.toastr.warning('Zeitmodifikation', 'Anfrage abgelehnt');
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
                    this.toastr.warning('Zeitmodifikation', 'Anfrage abgelehnt');
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
                this.toastr.success('Zeitmodifikation', 'Anfrage bestätigt');
                this.getVacRequests();
            },
            error => {
                this.dataHandlingService.errorHandler(error);
            });
    }

    addTimeModi(){

        try{

            var body; 

            if (this.selectedAuxTimeOption == 4){
                body = {
                    userid: this.ensureValue(this.selectedUser),
                    dateModiStart : this.ensureValue(this.timeTimeModiFrom.formatted),
                    dateModiEnd : this.ensureValue(this.timeTimeModiTo.formatted),
                    amtHrsModi : this.ensureValue(this.timeTimeModi)
                };
    
                this.dataHandlingService.addTimeModi(body).subscribe(
                    data => {
                        this.selectedUser = null;
                        this.timeTimeModi = null;
                        this.timeTimeModiFrom = null;
                        this.timeTimeModiTo = null;

                        this.toastr.success('Zeitmodifikation', 'Monatsausgleich erfolgreich');
                    },
                    error => {
                        this.dataHandlingService.errorHandler(error);
                    });
            }else if (this.selectedAuxTimeOption == 1){

                body = {
                    userid: this.ensureValue(this.selectedUser),
                    dateSicknessStart : this.ensureValue(this.timeTimeModiFrom.formatted),
                    dateSicknessEnd : this.ensureValue(this.timeTimeModiTo.formatted)
                };
    
                this.dataHandlingService.addSickness(body).subscribe(
                    data => {
                        this.selectedUser = null;
                        this.timeTimeModi = null;
                        this.timeTimeModiFrom = null;
                        this.timeTimeModiTo = null;

                        this.toastr.success('Zeitmodifikation', 'Krankheitseintrag erfolgreich');
                    },
                    error => {
                        this.dataHandlingService.errorHandler(error);
                    });
            }
           
                
        }catch(err){
            alert(err)
        }
    }

    ensureValue(val){
        if (val == null || typeof(val) == "undefined"){
            throw Error ("value null");
        }else{
            return val; 
        }
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