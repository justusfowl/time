import { Component, OnInit  } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './record.component.html',
  styleUrls: ['../app.component.css']
})

export class RecordComponent implements OnInit{

  constructor(private router: Router, private route: ActivatedRoute){

  }

  ngOnInit(){

  
  }

}