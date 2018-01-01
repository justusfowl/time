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

    getUsername(){
        return localStorage.getItem('currentUserName');
    }

    getUserId(){
        return localStorage.getItem('currentUserId');
    }

    getIsAdmin(){
        if (localStorage.getItem('currentUserIsAdmin') == "true"){
            return true; 
        }else{
            return false; 
        } 
    }
    
    login(username: string, password: string) {



        var body = {"username" : username, "password": password};

        let headers = new Headers({ 'Content-Type': 'application/json'});
        let options = new RequestOptions({ headers: headers });
        
        console.log("login in auth service")
        
        return this.http.post('http://localhost:3000/api/auth/login', JSON.stringify(body), options)
            .map((response: Response) => {
                // login successful if there's a jwt token in the response
                let user = response.json();
                console.log(user);
                if (user && user.token) {
                    // store user details and jwt token in local storage to keep user logged in between page refreshes 

                    localStorage.setItem('currentUserToken', user.token);
                    localStorage.setItem('currentUserName', user.username);
                    localStorage.setItem('currentUserIsAdmin', user.adminGroup);
                    localStorage.setItem('currentUserId', user.userid);

                    $('#labelUsername').html(user.username);

                    // FOR DEV PURPOSES SET USER ID 

                    //var devUserId = "6";
                    //localStorage.setItem('currentUserId', devUserId);
                }
            });
    }

    logout() {
        // remove user from local storage to log user out
        localStorage.removeItem('currentUserToken');
        localStorage.removeItem('currentUserName');
        localStorage.removeItem('currentUserId');
        localStorage.removeItem('currentUserIsAdmin');

        $('#labelUsername').html("");
        console.log("logout")
    }
    
}
