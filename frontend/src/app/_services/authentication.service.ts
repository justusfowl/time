import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map'

@Injectable()
export class AuthenticationService {
    constructor(private http: Http) { }
    
    login(username: string, password: string) {

        const body: URLSearchParams = new URLSearchParams(); 
        body.set('username', username); 
        body.set('password', password); 

        let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded'});
        let options = new RequestOptions({ headers: headers });

        return this.http.post('http://localhost:3000/api/auth/login', body.toString(), options)
            .map((response: Response) => {
                // login successful if there's a jwt token in the response
                let user = response.json();
                if (user && user.token) {
                    // store user details and jwt token in local storage to keep user logged in between page refreshes
                    localStorage.setItem('currentUser', JSON.stringify(user));
                }
            });
            
    }

    logout() {
        // remove user from local storage to log user out
        localStorage.removeItem('currentUser');
    }
    
}