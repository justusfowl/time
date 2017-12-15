import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule  }    from '@angular/forms';
import { HttpModule } from '@angular/http';
import { MyDatePickerModule } from 'mydatepicker';

import { AppComponent }            from './app.component';

import { LoginComponent  }   from './login/index';
import { RecordComponent }   from './record/record.component';
import { RequestComponent }   from './request/request.component';
import { AccountComponent }   from './account/account.component';
import { CalendarComponent }   from './calendar/calendar.component';
import { PageNotFoundComponent }   from './notfound/notfound.component';

import { AuthenticationService, DataHandlingService } from './_services/index';

import { AuthGuard } from './_guards/index';


const appRoutes: Routes = [
  { path: '', component: RecordComponent, canActivate: [AuthGuard]},
  { path: 'record', component: RecordComponent},
  { path: 'request', component: RequestComponent},
  { path: 'calendar', component: CalendarComponent},
  { path: 'login', component: LoginComponent},
  { path: 'account', component: AccountComponent},

  { path: '**', component: PageNotFoundComponent}
];

@NgModule({
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes,{useHash:true}), 
    HttpModule, 
    FormsModule, 
    ReactiveFormsModule,
    MyDatePickerModule
  ],
  declarations: [
    AppComponent,
    RecordComponent,
    RequestComponent,
    CalendarComponent,

    LoginComponent,
    AccountComponent,

    PageNotFoundComponent
  ],
  providers: [
    AuthGuard,
    AuthenticationService, 
    DataHandlingService
  ],
  
  bootstrap: [AppComponent]
})

export class AppModule {};