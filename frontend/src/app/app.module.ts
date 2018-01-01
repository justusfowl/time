import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule  }    from '@angular/forms';
import { HttpModule } from '@angular/http';
import { AppComponent }            from './app.component';

import { MyDatePickerModule } from 'mydatepicker';
import {CalendarModule} from "ap-angular2-fullcalendar";
import { MultiselectDropdownModule } from 'angular-2-dropdown-multiselect';

import { LoginComponent  }   from './login/index';
import { RecordComponent }   from './record/record.component';
import { RequestComponent }   from './request/request.component';
import { AccountComponent }   from './account/account.component';
import { SchedulerComponent }   from './scheduler/scheduler.component';
import { AdminComponent }   from './admin/admin.component';
import { PageNotFoundComponent }   from './notfound/notfound.component';
import { StatComponent }   from './stat/stat.component';



import { AuthenticationService, DataHandlingService, FormatterService, UtilService } from './_services/index';

import { AuthGuard } from './_guards/index';

//import {enableProdMode} from '@angular/core';


const appRoutes: Routes = [
  { path: '', component: RecordComponent, canActivate: [AuthGuard]},
  { path: 'record', component: RecordComponent, canActivate: [AuthGuard]},
  { path: 'request', component: RequestComponent, canActivate: [AuthGuard]},
  { path: 'scheduler', component: SchedulerComponent, canActivate: [AuthGuard]},
  { path: 'statistics', component: StatComponent, canActivate: [AuthGuard]},
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard]},
  { path: 'account', component: AccountComponent, canActivate: [AuthGuard]},
  
  { path: 'login', component: LoginComponent},
  { path: '**', component: PageNotFoundComponent}
];
 
//enableProdMode();

@NgModule({
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes,{useHash:true}), 
    HttpModule, 
    FormsModule, 
    ReactiveFormsModule,
    MyDatePickerModule, 
    CalendarModule,
    MultiselectDropdownModule
  ],
  declarations: [
    AppComponent,
    RecordComponent,
    RequestComponent,
    SchedulerComponent,
    StatComponent,
    AdminComponent,
    
    LoginComponent,
    AccountComponent,

    PageNotFoundComponent
  ],
  providers: [
    AuthGuard,
    AuthenticationService,
    DataHandlingService, 
    FormatterService, 
    UtilService
  ],
  
  bootstrap: [AppComponent]
})



export class AppModule {};