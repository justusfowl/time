import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { AuthenticationService } from '../_services/index';



import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    moduleId: module.id.toString(),
    templateUrl: 'login.component.html'
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

            console.log(this.userForm);

         }
        //private alertService: AlertService
    
    saveUser() {
        if (this.userForm.dirty && this.userForm.valid) {
            alert(`Name: ${this.userForm.value.username} Email: ${this.userForm.value.password}`);
        }
        }


    ngOnInit() {
        // reset login status
        this.authenticationService.logout();

        // get return url from route parameters or default to '/'
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    }

    login() {
        if (this.userForm.dirty && this.userForm.valid) {
            alert(`Name: ${this.userForm.value.username} Email: ${this.userForm.value.password}`);
        }
        
        this.loading = true;
        this.authenticationService.login(this.userForm.value.username, this.userForm.value.password)
            .subscribe(
                data => {
                    this.router.navigate([this.returnUrl]);
                    console.log("LOGIN DATA")
                },
                error => {
                    //this.alertService.error(error);
                    this.loading = false;
                    console.log("LOGIN ERROR")
                });
                
    }
}