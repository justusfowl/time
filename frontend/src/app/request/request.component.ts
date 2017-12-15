import { Component, OnInit  } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {IMyDpOptions} from 'mydatepicker';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'app-root',
  templateUrl: './request.component.html',
  styleUrls: ['../app.component.css']
})

export class RequestComponent implements OnInit{
  public myDatePickerOptions: IMyDpOptions = {
    // other options...
    dateFormat: 'dd.mm.yyyy',
  };

  public formHomeVisit: FormGroup;
  public formAddEntry: FormGroup;
  public formVacation: FormGroup;

  constructor(private router: Router, private route: ActivatedRoute, private formBuilder: FormBuilder){

  }

  ngOnInit(){



    this.formHomeVisit = this.formBuilder.group({
        // Empty string or null means no initial value. Can be also specific date for
        // example: {date: {year: 2018, month: 10, day: 9}} which sets this date to initial
        // value.

        myDate: [null, Validators.required]
        // other controls are here...
    });

    this.formAddEntry = this.formBuilder.group({
        // Empty string or null means no initial value. Can be also specific date for
        // example: {date: {year: 2018, month: 10, day: 9}} which sets this date to initial
        // value.

        myDate: [null, Validators.required]
        // other controls are here...
    });

    this.formVacation = this.formBuilder.group({
        // Empty string or null means no initial value. Can be also specific date for
        // example: {date: {year: 2018, month: 10, day: 9}} which sets this date to initial
        // value.

        myDate: [null, Validators.required]
        // other controls are here...
    });
    
  }

  setDate(): void {
    // Set today date using the patchValue function
    let date = new Date();
    this.formHomeVisit.patchValue({myDate: {
    date: {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()}
    }});
}

clearDate(): void {
    // Clear the date using the patchValue function
    this.formHomeVisit.patchValue({myDate: null});
}

    

}