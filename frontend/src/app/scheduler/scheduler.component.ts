
import { Component, OnInit, ViewChildren, ViewChild  } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService,  DataHandlingService, FormatterService, UtilService } from '../_services/index';
import { CalendarComponent } from "ap-angular2-fullcalendar";
import { IMultiSelectOption, IMultiSelectSettings  } from 'angular-2-dropdown-multiselect';

@Component({
  selector: 'app-root',
  templateUrl: './scheduler.component.html',
  styleUrls: ['../app.component.css']
})

export class SchedulerComponent implements OnInit{

  @ViewChild(CalendarComponent) myCalendar: CalendarComponent;

  constructor(
    private router: Router, 
    private route: ActivatedRoute, 
    private authService: AuthenticationService,
    private dataHandlingService : DataHandlingService, 
    private formatter : FormatterService, 
    private util: UtilService
    ){

    }
    
  planDate: any; 
  planTimeStart : any; 
  planTimeEnd: any; 

  planEvents : any;

  allUsers : any;
  selectedUser = null;

  isTimePlanner : boolean; 

  public selectDelete : boolean;
  selectId: any; 

  calendarOptions : Object;


  filters = []; 
  
  optionsModel: number[];
  myOptions: IMultiSelectOption[];
    // Settings configuration
  mySettings: IMultiSelectSettings = {
    dynamicTitleMaxItems: 7,
    displayAllSelectedText: true
  };

  selectedMode : number;
  modeOptions = [{id: 1, name: "Zeiten planen", selected: true},{id: 2, name: "Vergleich-Plan-Ist", selected: false}];


  onCalendarInit(initialized: boolean) {
    console.log('Calendar initialized');
  }

  ngOnInit(){

    this.util.setNavOnRoute("scheduler");

    this.getUserInfo();
    this.selectDelete = false;

    this.selectedMode = 1;

    this.isTimePlanner = this.authService.getIsTimePlanner();
    
    this.calendarOptions = {
      fixedWeekCount : false,
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'month,agendaWeek,agendaDay'
      },
      defaultView: 'agendaWeek',
      businessHours:  {
        start: '07:00', // a start time (10am in this example)
        end: '20:00', // an end time (6pm in this example)
  
        dow: [ 1, 2, 3, 4, 5 ]
        // days of week. an array of zero-based day of week integers (0=Sunday)
        // (Monday-Thursday in this example)
      },
      mintime: "05:00:00",
      slotDuration: "00:15:00",
      defaultDate: (new Date()).toISOString().substring(0,10),
      editable: this.isTimePlanner,
      eventLimit: true, // allow "more" link when too many events
      dayClick: this.handleCalenderClicked.bind(this),
      events: this.getPlantime.bind(this), 
      eventResize: this.updatePlantime.bind(this),
      eventDrop: this.updatePlantime.bind(this), 
      eventClick: this.eventClick.bind(this)
    }

  }

  handleModalAccept(){
    if (this.planDate != null && this.planTimeStart != null && this.planTimeEnd != null){
          this.addPlantime();
          $('#modalAddSlot').modal('hide');
    }else{
      alert("please fill in all fields")
    }
  }

  handleCalenderClicked(date, jsEvent, view) {

    $('#modalAddSlot').modal('show');
    var dateFormatted = date.format(); 
    this.planDate = dateFormatted.substring(0,10);
    this.planTimeStart = dateFormatted.substring(dateFormatted.indexOf("T")+1,dateFormatted.length);

    $('#planDateStr').html(this.planDate);
    $('#timeSlotFrom').val(this.planTimeStart);

  }

  handleModeSelect(event){
    var selectedMode = parseInt(event.target.value);
    this.selectedMode = selectedMode;
    this.setMode();
  }

  setMode(){

    if (this.selectedMode == 1){
      $('.filter').removeClass("hide");
      this.myCalendar.fullCalendar("refetchEvents");

    }else if (this.selectedMode == 2){
      $('.filter').addClass("hide");
      if (this.selectedUser != null || typeof(this.selectedUser) == "undefined"){
        this.myCalendar.fullCalendar("refetchEvents");
      }
    }else {
      console.log("Invalid mode")
    }
  }

  handleUserCompareSelect(event){

    if (this.selectedMode == 2){
      this.myCalendar.fullCalendar("refetchEvents");
    }

  }

  onChange() {
      var component = this;
      this.filters.length = 0;
      this.optionsModel.forEach(function(item){
        component.filters.push(component.dataHandlingService.filterItem("userid", "eq", item));
      });
      this.myCalendar.fullCalendar("refetchEvents");
  }

  
  eventClick(event, jsEvent, view){
    // allow item clicking only for future events and within mode = 1 for planning purposes
    if (event.end > new Date() && this.selectedMode == 1){
      $(".deleteItem").toggleClass("hide");
      this.selectId = event.id; 
      var itemSelected = $(jsEvent.target).parent();
      $(jsEvent.target).parent().addClass('slotSelected');
    }else{
      console.log("Deleting of items can only be done for future events.");
    }
  }

  addPlantime(){
    var body = {"userid" : this.selectedUser.userid}
    body["plantimeStart"] = this.planDate + " " + this.planTimeStart;
    body["plantimeEnd"] = this.planDate + " " + this.planTimeEnd;
    this.dataHandlingService.addPlantime(body).subscribe(
        data => {
          this.planDate = null; 
          this.planTimeEnd = null; 
          this.planTimeStart = null; 
          this.myCalendar.fullCalendar("refetchEvents");
        },
        error => {
          this.dataHandlingService.errorHandler(error);
        });

  }

  getPlantime(start, end, timezone, callback){

      if (this.selectedMode == 1){
        var userId = this.authService.getUserId(); 
        let params = {"userid": userId, "sortBy": "refdate", "sortDir" : "DESC", "startDate": start.format().substring(0,10) , 
        "endDate": end.format().substring(0,10), filters: this.filters};
    
        this.dataHandlingService.getPlantime(params).subscribe(
          data => {
              callback(data);
          },
          error => {
              this.dataHandlingService.errorHandler(error);
          });
      }
      else if (this.selectedMode == 2){

        let params = {"userid": this.selectedUser.userid, "sortBy": "refdate", "sortDir" : "DESC"};
    
        this.dataHandlingService.getPlanActuals(params).subscribe(
          data => {
            callback(data);
          },
          error => {
            this.dataHandlingService.errorHandler(error);
          });
      }
  };

  updatePlantime(event, delta, revertFunc){

    var planTimeId = parseInt(event.id); 
    var planTimeStart = event.start.format(); 
    var planTimeEnd = event.end.format(); 

    var body = {"planTimeId" : planTimeId}
    body["plantimeStart"] = planTimeStart;
    body["plantimeEnd"] = planTimeEnd;

    this.dataHandlingService.updatePlantime(body).subscribe(
        data => {
          return;
        },
        error => {
          this.dataHandlingService.errorHandler(error);
        });
  }

  deletePlantime(planTimeId){
    var body = {"planTimeId" : planTimeId};
    this.dataHandlingService.deletePlantime(body).subscribe(
        data => {
          this.selectId = null; 
          this.myCalendar.fullCalendar("refetchEvents");
        },
        error => {
          this.dataHandlingService.errorHandler(error);
        });
  }

  getUserInfo(){
    var userId = this.authService.getUserId(); 
    let params = {"userid": userId, "sortBy": "refdate", "sortDir" : "DESC", "all" : true};
    this.dataHandlingService.getUserInfo(params).subscribe(
      data => {
        this.allUsers = data; 
      },
      error => {
        this.dataHandlingService.errorHandler(error);
      });
  }

}