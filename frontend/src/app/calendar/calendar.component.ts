import { Component, OnInit  } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './calendar.component.html',
  //styleUrls: ['../map.component.css']
})

export class CalendarComponent implements OnInit{

  constructor(private router: Router, private route: ActivatedRoute){

  }

  ngOnInit(){

  
  }

}