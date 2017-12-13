import { Component, OnInit  } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './account.component.html',
  //styleUrls: ['../map.component.css']
})

export class AccountComponent implements OnInit{

  constructor(private router: Router, private route: ActivatedRoute){

  }

  ngOnInit(){

  
  }

}