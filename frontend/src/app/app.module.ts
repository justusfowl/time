import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule  }    from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent }            from './app.component';

import { LoginComponent  }   from './login/index';
import { AccountComponent }   from './account/account.component';
import { PageNotFoundComponent }   from './notfound/notfound.component';

import { AuthenticationService } from './_services/index';

import { AuthGuard } from './_guards/index';

const appRoutes: Routes = [
  { path: '', component: AccountComponent, canActivate: [AuthGuard]},
  { path: 'login', component: LoginComponent},
  { path: 'account', component: AccountComponent },
  { path: '**', component: PageNotFoundComponent}
];

@NgModule({
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes,{useHash:true}), 
    HttpModule, 
    FormsModule, 
    ReactiveFormsModule 
  ],
  declarations: [
    AppComponent,
    LoginComponent,
    AccountComponent,
    PageNotFoundComponent
  ],
  providers: [
    AuthGuard,
    AuthenticationService
  ],
  
  bootstrap: [AppComponent]
})

export class AppModule {};