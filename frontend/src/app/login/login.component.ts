import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { AuthenticationService } from '../_services/index';



import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    moduleId: module.id.toString(),
    templateUrl: 'login.component.html',
    styleUrls: ['../app.component.css']
}) 

export class LoginComponent implements OnInit {
    model: any = {};
    loading = false;
    returnUrl: string;

    userForm: any;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private authenticationService: AuthenticationService,
        private formBuilder: FormBuilder) {

            this.userForm = this.formBuilder.group({
                'username': ['', Validators.required],
                'password': ['', Validators.required]
              });


         }
        //private alertService: AlertService

    ngOnInit() {
        // reset login status
        this.authenticationService.logout();

        // get return url from route parameters or default to '/'
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    }

    login() {
        this.loading = true;
        this.authenticationService.login(this.userForm.value.username, this.userForm.value.password)
           
            .subscribe(
                data => {
                    this.router.navigate(["/record"]);
                    console.log(data);
                },
                error => {
                    //this.alertService.error(error);
                    this.loading = false;
                    console.log(error);
                    alert("Something went wrong with the login - please try again")
                });
    }
}