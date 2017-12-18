import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
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


    
}