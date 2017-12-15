import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map'

@Injectable()
export class DataHandlingService {
    constructor(private http: Http) { }

    APIUrl = "http://localhost:3000/api/v01/";
    
    addActualTime(userid : number, time: string, directionid : number) {

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

    
}