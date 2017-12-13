import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';


import { AppComponent }            from './app.component';

import { AccountComponent }   from './account/account.component';
import { PageNotFoundComponent }   from './notfound/notfound.component';


const appRoutes: Routes = [
  { path: '', component: AccountComponent},
  { path: 'account', component: AccountComponent },
  { path: '**', component: PageNotFoundComponent}
];

@NgModule({
  declarations: [
    AppComponent,
    AccountComponent,
    PageNotFoundComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes,{useHash:true})
  ],
  bootstrap: [AppComponent]
})

export class AppModule {};