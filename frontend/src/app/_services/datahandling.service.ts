import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions,ResponseContentType } from '@angular/http';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment as ENV } from '../../environments/environment';

import { UtilService } from '../_services/util.service';

import { ToastrService } from 'ngx-toastr';

@Injectable()
export class DataHandlingService { 
    constructor(
        private router: Router,
        private http: Http, 
        private util: UtilService,
        private toastr: ToastrService
    ) { }
    
    // dev URL
    // BaseURL = "http://localhost:3000";
    BaseURL = ENV.getBaseUrl()
    APIUrl = "/api/v" + ENV.apiVersion + "/";

    // example:
    // params can be one of:
    // however userid needs to be set
    //
    //  let params = {"userid": userId, "sortBy": "refdate", "sortDir" : "DESC", "top": 20,
    // "aggregation": "(difference with sum as totalHrsWorked)"};

    getUserInfo(params){
        try{
            return this.http.get(this.BaseURL + this.APIUrl + 'time/getUserInfo', this.checkParamsPrepareOptions(params))
                .pipe(map(res => this.util.hideLoader(res.json())));
        }
        catch(err){
            console.log(err.message)
        }
    }

    addActualTime(userid: Number, time: String, directionid: Number) {

        this.util.showLoader();

        let body = {"userid" : userid, "time": time, "directionid" : directionid }

        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"));
        headers.append('Cache-Control','no-cache');
        
        let options = new RequestOptions({ headers: headers });
        
        return this.http.post(this.BaseURL + this.APIUrl + 'time/addActualTime', JSON.stringify(body), options)
        .pipe(map((res: Response) => this.util.hideLoader(res.json())));
            
    }

    getTimePairs(params) {
        
        this.util.showLoader();

        // params example: {"userid": userId, "sortBy": "refdate", "sortDir" : "DESC", "top": this.topEntries}
        
        try{

            if (typeof(params) == "undefined"){
                throw new Error("No params are defined for the API call on gettimepairs");
            }

            if (!params.userid){
                throw new Error("No userid is defined for the API call on gettimepairs");
            }
            /*
            let headers = new Headers({'Content-Type': 'application/json'});          
            headers.append('x-access-token',localStorage.getItem("currentUserToken"));
            headers.append('Cache-Control','no-cache');
            
            let options = new RequestOptions({ headers: headers, params: params });
            */
            return this.http.get(this.BaseURL + this.APIUrl + 'time/getTimePairs', this.checkParamsPrepareOptions(params))
            .pipe(map(res => this.util.hideLoader(res.json())));

        }
        catch(err){
            console.log(err.message)
        }
        
    }

    getAccountBalance(params){
        
        //this.util.showLoader();

        try{
            
            if (typeof(params) == "undefined"){
                throw new Error("No params are defined for the API call on gettimepairs");
            }

            if (!params.userid){
                throw new Error("No userid is defined for the API call on gettimepairs");
            }
            
            /*
            let headers = new Headers({'Content-Type': 'application/json'});          
            headers.append('x-access-token',localStorage.getItem("currentUserToken"));
            headers.append('Cache-Control','no-cache');
            
            let options = new RequestOptions({ headers: headers, params: params });
            */


            return this.http.get(this.BaseURL + this.APIUrl + 'time/getAccountBalance', this.checkParamsPrepareOptions(params))
            .pipe(map(res => this.util.hideLoader(res.json())));

        }
        catch(err){
            console.log(err.message)
        }

    }

    getVacationInfo(params){
        
        this.util.showLoader();
        
        try{
            
            if (typeof(params) == "undefined"){
                throw new Error("No params are defined for the API call on gettimepairs");
            }

            if (!params.userid){
                throw new Error("No userid is defined for the API call on gettimepairs");
            }
            
            /*
            let headers = new Headers({'Content-Type': 'application/json'});          
            headers.append('x-access-token',localStorage.getItem("currentUserToken"));
            headers.append('Cache-Control','no-cache');
            
            let options = new RequestOptions({ headers: headers, params: params });
            
            */
            return this.http.get(this.BaseURL + this.APIUrl + 'time/getVacationInfo', this.checkParamsPrepareOptions(params))
            .pipe(map(res => this.util.hideLoader(res.json())));

        }
        catch(err){
            console.log(err.message)
        }

    }
    
    getRawBookings(params){
        
        this.util.showLoader();
        
        try{
            
            if (typeof(params) == "undefined"){
                throw new Error("No params are defined for the API call on gettimepairs");
            }

            if (!params.userid){
                throw new Error("No userid is defined for the API call on gettimepairs");
            }
            
            /*
            let headers = new Headers({'Content-Type': 'application/json'});          
            headers.append('x-access-token',localStorage.getItem("currentUserToken"));
            headers.append('Cache-Control','no-cache');
            
            let options = new RequestOptions({ headers: headers, params: params });
            
            */
            return this.http.get(this.BaseURL + this.APIUrl + 'time/getRawBookings', this.checkParamsPrepareOptions(params))
            .pipe(map(res => this.util.hideLoader(res.json())));

        }
        catch(err){
            console.log(err.message)
        }

    }

    getSingleBookings(params){
        
        this.util.showLoader();
        
        try{
            
            if (typeof(params) == "undefined"){
                throw new Error("No params are defined for the API call on gettimepairs");
            }

            if (!params.userid){
                throw new Error("No userid is defined for the API call on gettimepairs");
            }
            
            /*
            let headers = new Headers({'Content-Type': 'application/json'});          
            headers.append('x-access-token',localStorage.getItem("currentUserToken"));
            headers.append('Cache-Control','no-cache');
            
            let options = new RequestOptions({ headers: headers, params: params });
            */
            
            return this.http.get(this.BaseURL + this.APIUrl + 'time/getSingleBookings', this.checkParamsPrepareOptions(params))
            .pipe(map(res => this.util.hideLoader(res.json())));

        }
        catch(err){
            console.log(err.message)
        }

    }


    // requests area

    getTimeRequests(params){

        this.util.showLoader();

        try{
            
            if (typeof(params) == "undefined"){
                throw new Error("No params are defined for the API call on gettimepairs");
            }

            if (!params.userid){
                throw new Error("No userid is defined for the API call on gettimepairs");
            }
            
            /*
            let headers = new Headers({'Content-Type': 'application/json'});          
            headers.append('x-access-token',localStorage.getItem("currentUserToken"))
            
            let options = new RequestOptions({ headers: headers, params: params });
            */
            return this.http.get(this.BaseURL + this.APIUrl + 'time/getTimeRequests', this.checkParamsPrepareOptions(params))
                .pipe(map(res => this.util.hideLoader(res.json())));

        }
        catch(err){
            console.log(err.message)
        }

    }

    approveRequest(body) {
        
        this.util.showLoader();
        
        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"))
        
        let options = new RequestOptions({ headers: headers });
        
        return this.http.post(this.BaseURL + this.APIUrl + 'time/approveRequest', JSON.stringify(body), options)
            .pipe(map((response: Response) => {
                // login successful if there's a jwt token in the response
                let user = response.json();
                console.log(user);
            }));
            
    }

    approveVacRequest(body) {
        
        this.util.showLoader();
        
        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"))
        
        let options = new RequestOptions({ headers: headers });
        
        return this.http.post(this.BaseURL + this.APIUrl + 'time/approveVacRequest', JSON.stringify(body), options)
            .pipe(map((res: Response) => this.util.hideLoader(res.json())));
            
    }


    rejectRequest(body) {
        
        this.util.showLoader();
        
        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"))
        
        let options = new RequestOptions({ headers: headers });
        
        return this.http.post(this.BaseURL + this.APIUrl + 'time/rejectRequest', JSON.stringify(body), options)
            .pipe(map((res: Response) => this.util.hideLoader(res.json())));
            
    }

    rejectVacRequest(body) {
        
        this.util.showLoader();
        
        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"))
        
        let options = new RequestOptions({ headers: headers });
        
        return this.http.post(this.BaseURL + this.APIUrl + 'time/rejectVacRequest', JSON.stringify(body), options)
            .pipe(map((res: Response) => this.util.hideLoader(res.json())));
            
    }

    getVacRequests(params){
        
        this.util.showLoader();
        
        try{
            return this.http.get(this.BaseURL + this.APIUrl + 'time/getVacRequests', this.checkParamsPrepareOptions(params))
                .pipe(map(res => this.util.hideLoader(res.json())));
        }
        catch(err){
            console.log(err.message)
        }

    }



    addRequest(body) {
        
        this.util.showLoader();

        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"))
        
        let options = new RequestOptions({ headers: headers });
        
        return this.http.post(this.BaseURL + this.APIUrl + 'time/addRequest', JSON.stringify(body), options)
            .pipe(map((res: Response) => this.util.hideLoader(res.json())));
            
    }

    

    addVacRequest(body) {
        
        this.util.showLoader();
        
        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"))
        
        let options = new RequestOptions({ headers: headers });
        
        return this.http.post(this.BaseURL + this.APIUrl + 'time/addVacRequest', JSON.stringify(body), options)
            .pipe(map((res: Response) => this.util.hideLoader(res.json())));
            
    }

    getVacationValue(params){
        
        this.util.showLoader();

        try{
            return this.http.get(this.BaseURL + this.APIUrl + 'time/getVacationValue', this.checkParamsPrepareOptions(params))
                .pipe(map(res => this.util.hideLoader(res.json())));
        }
        catch(err){
            console.log(err.message)
        }
    }

    getWorkingdays(params){
        
        this.util.showLoader();

        try{
            return this.http.get(this.BaseURL + this.APIUrl + 'time/getWorkingdays', this.checkParamsPrepareOptions(params))
                .pipe(map(res => this.util.hideLoader(res.json())));
        }
        catch(err){
            console.log(err.message)
        }
    }

    addTimeModi(body) {
        
        this.util.showLoader();

        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"))
        
        let options = new RequestOptions({ headers: headers });
        
        return this.http.post(this.BaseURL + this.APIUrl + 'time/addTimeModi', JSON.stringify(body), options)
            .pipe(map((res: Response) => this.util.hideLoader(res.json())));
            
    }

    addSickness(body){
        this.util.showLoader();

        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"))
        
        let options = new RequestOptions({ headers: headers });
        
        return this.http.post(this.BaseURL + this.APIUrl + 'time/addSickness', JSON.stringify(body), options)
            .pipe(map((res: Response) => this.util.hideLoader(res.json())));
    }

    // Calender / Scheduler handling

    addPlantime(body) {
        
        this.util.showLoader();

        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"))
        
        let options = new RequestOptions({ headers: headers });
        
        return this.http.post(this.BaseURL + this.APIUrl + 'time/addPlantime', JSON.stringify(body), options)
            .pipe(map((res: Response) => this.util.hideLoader(res.json())));
            
    }

    getPlanActuals(params){
        
        this.util.showLoader();

        try{
            return this.http.get(this.BaseURL + this.APIUrl + 'time/getPlanActuals', this.checkParamsPrepareOptions(params))
                .pipe(map(res => this.util.hideLoader(res.json())));
        }
        catch(err){
            console.log(err.message)
        }
    }

    getPlantime(params){
        this.util.showLoader();

        try{
            return this.http.get(this.BaseURL + this.APIUrl + 'time/getPlantime', this.checkParamsPrepareOptions(params))
                .pipe(map(res => this.util.hideLoader(res.json())));
        }
        catch(err){
            console.log(err.message)
        }
    }

    updatePlantime(body) {
        this.util.showLoader();
        
        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"));
        
        let options = new RequestOptions({ headers: headers });
        
        return this.http.post(this.BaseURL + this.APIUrl + 'time/updatePlantime', JSON.stringify(body), options)
            .pipe(map((res: Response) => this.util.hideLoader(res.json())));
            
    }

    deletePlantime(body) {
        this.util.showLoader();
        
        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"));
        
        let options = new RequestOptions({ headers: headers });
        
        return this.http.post(this.BaseURL + this.APIUrl + 'time/deletePlantime', JSON.stringify(body), options)
            .pipe(map((res: Response) => this.util.hideLoader(res.json())));
            
    }

    // report section


    getReport(params){
        this.util.showLoader();

        if (typeof(params) == "undefined"){
            throw new Error("No params are defined for the API call on getReport");
        }

        if (!params.userid){
            throw new Error("No userid is defined for the API call on getReport");
        }
        
        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"));
        headers.append('Accept',"application/pdf");
        headers.append('Cache-Control','no-cache');
        
        let options = new RequestOptions({ headers: headers, params: params,responseType: ResponseContentType.Blob });

        try{
            return this.http.get(this.BaseURL + this.APIUrl + 'time/getReport', options ).pipe(map(
                (res) => {
                    return this.util.hideLoader(new Blob([res.blob()], { type: 'application/pdf' }))
                }));
        }
        catch(err){
            console.log(err.message)
        }
    }

    // basic handling

    checkParamsPrepareOptions(params){
        
        if (typeof(params) == "undefined"){
            console.warn("No params are defined for the API call");
        }

        if (!params.userid){
            console.warn("No userid is defined for the API call on gettimepairs");
        }
        
        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"));
        headers.append('Cache-Control','no-cache');
        headers.append('Cache-Control','no-store');
        headers.append('Expires','0');
        headers.append('Pragma','no-cache');
        
        let options = new RequestOptions({ headers: headers, params: params });

        return options;
    }
    
    filterItem(col, op, val1, val2 = null){

        return {"column": col, "op": op, "val1": val1, "val2": val2}; 


    }

    errorHandler(err){

        if (err.status == 403){
            this.router.navigate(["/login"]);
            
        }else{
            console.log(err);
            this.toastr.error('Fehler', err);
        }

        this.util.hideLoader(null);
    }

    infoHandler(msg, title){

        try{
            this.toastr.info(msg, title)
        }catch(err){
            console.log(err); 
            alert(msg);
        }
    }

    
}