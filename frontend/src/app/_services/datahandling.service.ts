import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions,ResponseContentType } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map'

import { UtilService } from '../_services/util.service';

@Injectable()
export class DataHandlingService {
    constructor(
        private http: Http, 
        private util: UtilService
    ) { }

    APIUrl = "http://localhost:3000/api/v01/";

    // example:
    // params can be one of:
    // however userid needs to be set
    //
    //  let params = {"userid": userId, "sortBy": "refdate", "sortDir" : "DESC", "top": 20,
    // "aggregation": "(difference with sum as totalHrsWorked)"};

    addActualTime(userid: Number, time: Date, directionid: Number) {

        let body = {"userid" : userid, "time": time, "directionid" : directionid }

        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"))
        
        let options = new RequestOptions({ headers: headers });
        
        console.log(headers)
        
        return this.http.post(this.APIUrl + 'time/addActualTime', JSON.stringify(body), options)
            .map((response: Response) => {
                // login successful if there's a jwt token in the response
                let user = response.json();
                console.log(user);
            });
            
    }

    getTimePairs(params) {

        // params example: {"userid": userId, "sortBy": "refdate", "sortDir" : "DESC", "top": this.topEntries}
        
        try{

            if (typeof(params) == "undefined"){
                throw new Error("No params are defined for the API call on gettimepairs");
            }

            if (!params.userid){
                throw new Error("No userid is defined for the API call on gettimepairs");
            }
           
            let headers = new Headers({'Content-Type': 'application/json'});          
            headers.append('x-access-token',localStorage.getItem("currentUserToken"))
            
            let options = new RequestOptions({ headers: headers, params: params });
            
            return this.http.get(this.APIUrl + 'time/getTimePairs', options)
                .map(res => res.json());

        }
        catch(err){
            console.log(err.message)
        }
        
    }

    getAccountBalance(params){

        try{
            
            if (typeof(params) == "undefined"){
                throw new Error("No params are defined for the API call on gettimepairs");
            }

            if (!params.userid){
                throw new Error("No userid is defined for the API call on gettimepairs");
            }
            
            let headers = new Headers({'Content-Type': 'application/json'});          
            headers.append('x-access-token',localStorage.getItem("currentUserToken"))
            
            let options = new RequestOptions({ headers: headers, params: params });
            
            return this.http.get(this.APIUrl + 'time/getAccountBalance', options)
                .map(res => res.json());

        }
        catch(err){
            console.log(err.message)
        }

    }

    getVacationInfo(params){
        
        try{
            
            if (typeof(params) == "undefined"){
                throw new Error("No params are defined for the API call on gettimepairs");
            }

            if (!params.userid){
                throw new Error("No userid is defined for the API call on gettimepairs");
            }
            
            let headers = new Headers({'Content-Type': 'application/json'});          
            headers.append('x-access-token',localStorage.getItem("currentUserToken"))
            
            let options = new RequestOptions({ headers: headers, params: params });
            
            return this.http.get(this.APIUrl + 'time/getVacationInfo', options)
                .map(res => res.json());

        }
        catch(err){
            console.log(err.message)
        }

    }
    
    getRawBookings(params){
        
        try{
            
            if (typeof(params) == "undefined"){
                throw new Error("No params are defined for the API call on gettimepairs");
            }

            if (!params.userid){
                throw new Error("No userid is defined for the API call on gettimepairs");
            }
            
            let headers = new Headers({'Content-Type': 'application/json'});          
            headers.append('x-access-token',localStorage.getItem("currentUserToken"))
            
            let options = new RequestOptions({ headers: headers, params: params });
            
            return this.http.get(this.APIUrl + 'time/getRawBookings', options)
                .map(res => res.json());

        }
        catch(err){
            console.log(err.message)
        }

    }

    getSingleBookings(params){
        
        try{
            
            if (typeof(params) == "undefined"){
                throw new Error("No params are defined for the API call on gettimepairs");
            }

            if (!params.userid){
                throw new Error("No userid is defined for the API call on gettimepairs");
            }
            
            let headers = new Headers({'Content-Type': 'application/json'});          
            headers.append('x-access-token',localStorage.getItem("currentUserToken"))
            
            let options = new RequestOptions({ headers: headers, params: params });
            
            return this.http.get(this.APIUrl + 'time/getSingleBookings', options)
                .map(res => res.json());

        }
        catch(err){
            console.log(err.message)
        }

    }


    // requests area

    getTimeRequests(params){
        
        try{
            
            if (typeof(params) == "undefined"){
                throw new Error("No params are defined for the API call on gettimepairs");
            }

            if (!params.userid){
                throw new Error("No userid is defined for the API call on gettimepairs");
            }
            
            let headers = new Headers({'Content-Type': 'application/json'});          
            headers.append('x-access-token',localStorage.getItem("currentUserToken"))
            
            let options = new RequestOptions({ headers: headers, params: params });
            
            return this.http.get(this.APIUrl + 'time/getTimeRequests', options)
                .map(res => res.json());

        }
        catch(err){
            console.log(err.message)
        }

    }

    approveRequest(body) {
        
        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"))
        
        let options = new RequestOptions({ headers: headers });
        
        return this.http.post(this.APIUrl + 'time/approveRequest', JSON.stringify(body), options)
            .map((response: Response) => {
                // login successful if there's a jwt token in the response
                let user = response.json();
                console.log(user);
            });
            
    }

    approveVacRequest(body) {
        
        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"))
        
        let options = new RequestOptions({ headers: headers });
        
        return this.http.post(this.APIUrl + 'time/approveVacRequest', JSON.stringify(body), options)
            .map((response: Response) => {
                // login successful if there's a jwt token in the response
                let user = response.json();
                console.log(user);
            });
            
    }


    rejectRequest(body) {
        
        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"))
        
        let options = new RequestOptions({ headers: headers });
        
        return this.http.post(this.APIUrl + 'time/rejectRequest', JSON.stringify(body), options)
            .map((response: Response) => {
                // login successful if there's a jwt token in the response
                let res = response.json();
                console.log(res);
            });
            
    }

    rejectVacRequest(body) {
        
        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"))
        
        let options = new RequestOptions({ headers: headers });
        
        return this.http.post(this.APIUrl + 'time/rejectVacRequest', JSON.stringify(body), options)
            .map((response: Response) => {
                // login successful if there's a jwt token in the response
                let res = response.json();
                console.log(res);
            });
            
    }

    getVacRequests(params){
        
        try{
            return this.http.get(this.APIUrl + 'time/getVacRequests', this.checkParamsPrepareOptions(params))
                .map(res => res.json());
        }
        catch(err){
            console.log(err.message)
        }

    }

    checkParamsPrepareOptions(params){

        if (typeof(params) == "undefined"){
            console.warn("No params are defined for the API call");
        }

        if (!params.userid){
            console.warn("No userid is defined for the API call on gettimepairs");
        }
        
        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"))
        
        let options = new RequestOptions({ headers: headers, params: params });

        return options;
    }

    addRequest(body) {

        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"))
        
        let options = new RequestOptions({ headers: headers });
        
        return this.http.post(this.APIUrl + 'time/addRequest', JSON.stringify(body), options)
            .map((response: Response) => {
                // login successful if there's a jwt token in the response
                let user = response.json();
                console.log(user);
            });
            
    }

    

    addVacRequest(body) {
        
        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"))
        
        let options = new RequestOptions({ headers: headers });
        
        return this.http.post(this.APIUrl + 'time/addVacRequest', JSON.stringify(body), options)
            .map((response: Response) => {
                // login successful if there's a jwt token in the response
                let user = response.json();
                console.log(user);
            });
            
    }

    getVacationValue(params){
        try{
            return this.http.get(this.APIUrl + 'time/getVacationValue', this.checkParamsPrepareOptions(params))
                .map(res => res.json());
        }
        catch(err){
            console.log(err.message)
        }
    }

    getWorkingdays(params){
        try{
            return this.http.get(this.APIUrl + 'time/getWorkingdays', this.checkParamsPrepareOptions(params))
                .map(res => res.json());
        }
        catch(err){
            console.log(err.message)
        }
    }


    // Calender / Scheduler handling


    addPlantime(body) {
        
        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"))
        
        let options = new RequestOptions({ headers: headers });
        
        return this.http.post(this.APIUrl + 'time/addPlantime', JSON.stringify(body), options)
            .map((response: Response) => {
                // login successful if there's a jwt token in the response
                let user = response.json();
                console.log(user);
            });
            
    }

    getPlanActuals(params){
        try{
            return this.http.get(this.APIUrl + 'time/getPlanActuals', this.checkParamsPrepareOptions(params))
                .map(res => res.json());
        }
        catch(err){
            console.log(err.message)
        }
    }

    getPlantime(params){
        try{
            return this.http.get(this.APIUrl + 'time/getPlantime', this.checkParamsPrepareOptions(params))
                .map(res => res.json());
        }
        catch(err){
            console.log(err.message)
        }
    }

    updatePlantime(body) {
        
        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"))
        
        let options = new RequestOptions({ headers: headers });
        
        return this.http.post(this.APIUrl + 'time/updatePlantime', JSON.stringify(body), options)
            .map((response: Response) => {
                // login successful if there's a jwt token in the response
                let user = response.json();
                console.log(user);
            });
            
    }

    deletePlantime(body) {
        
        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"))
        
        let options = new RequestOptions({ headers: headers });
        
        return this.http.post(this.APIUrl + 'time/deletePlantime', JSON.stringify(body), options)
            .map((response: Response) => {
                // login successful if there's a jwt token in the response
                let user = response.json();
                console.log(user);
            });
            
    }

    // report section


    getReport(params){

        if (typeof(params) == "undefined"){
            throw new Error("No params are defined for the API call on gettimepairs");
        }

        if (!params.userid){
            throw new Error("No userid is defined for the API call on gettimepairs");
        }
        
        let headers = new Headers({'Content-Type': 'application/json'});          
        headers.append('x-access-token',localStorage.getItem("currentUserToken"));
        headers.append('Accept',"application/pdf")
        
        let options = new RequestOptions({ headers: headers, params: params,responseType: ResponseContentType.Blob });



        try{
            return this.http.get(this.APIUrl + 'time/getReport', options ).map(
                (res) => {
                    return new Blob([res.blob()], { type: 'application/pdf' })
                });
        }
        catch(err){
            console.log(err.message)
        }
    }
    

    // basic handling


    getUserInfo(params){
        try{
            return this.http.get(this.APIUrl + 'time/getUserInfo', this.checkParamsPrepareOptions(params))
                .map(res => res.json());
        }
        catch(err){
            console.log(err.message)
        }
    }

    filterItem(col, op, val1, val2 = null){

        return {"column": col, "op": op, "val1": val1, "val2": val2}; 


    }

    

    


    
}