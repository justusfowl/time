import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map'

@Injectable()
export class AuthenticationService {
    constructor(
        private http: Http
    ) { }

    public username : any
    
    login(username: string, password: string) {

        const body: URLSearchParams = new URLSearchParams(); 
        body.set('username', username); 
        body.set('password', password); 

        let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded'});
        let options = new RequestOptions({ headers: headers });
        
        console.log("login in auth service")
        
        return this.http.post('http://localhost:3000/api/auth/login', body.toString(), options)
            .map((response: Response) => {
                // login successful if there's a jwt token in the response
                let user = response.json();
                console.log(user);
                if (user && user.token) {
                    // store user details and jwt token in local storage to keep user logged in between page refreshes
                    localStorage.setItem('currentUserToken', user.token);
                    localStorage.setItem('currentUserName', user.username);
                    localStorage.setItem('currentUserId', user.userid);
                }
            });
    }

    logout() {
        // remove user from local storage to log user out
        localStorage.removeItem('currentUserToken');
        localStorage.removeItem('currentUserName');
        localStorage.removeItem('currentUserId');
    }
    
}