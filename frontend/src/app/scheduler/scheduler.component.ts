
import { Component, OnInit, ViewChildren, ViewChild  } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService,  DataHandlingService, FormatterService, UtilService } from '../_services/index';
import { CalendarComponent } from 'ng-fullcalendar';
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

  calendarMode: number; 

  events : any;

  onCalendarInit(initialized: boolean) {
    console.log('Calendar initialized');
  }

  ngOnInit(){

    this.util.setNavOnRoute("scheduler");

    this.getUserInfo();
    this.selectDelete = false;

    this.selectedMode = 1;

    this.isTimePlanner = this.authService.getIsTimePlanner();

    let de = new Date(); 
    let defaultDateTo = (new Date()).toISOString().substring(0,10);
    let defaultDateFrom = new Date(de.setDate(de.getDate() -7)).toISOString().substring(0,10);

    this.getPlantime(defaultDateFrom, defaultDateTo,null, this.setEventData.bind(this));
    
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
      minTime: "05:00:00",
      maxTime: "19:00:00",
      scrollTime: "06:30:00",
      slotDuration: "00:15:00",
      defaultDate: defaultDateTo,
      editable: this.isTimePlanner,
      selectable: true,
      selectHelper: true,
      eventLimit: true, // allow "more" link when too many events
      dayClick: this.handleCalenderClicked.bind(this),
      events: [], 
      eventResize: this.updatePlantime.bind(this),
      eventDrop: this.updatePlantime.bind(this), 
      eventClick: this.eventClick.bind(this)
    }

    $(".calendarModeBtn").on("click", function(){
      $(".btn-group").find(".active").removeClass("active");
      $(this).addClass("active");
    });

  }

  setEventData(data){
    this.events = data;
  }

  setCalendarMode(mode){

    this.selectedMode = mode;

    if (this.selectedMode == 1){
      var slotDuration = "00:15:00";
      var mintime = "06:00:00";
    }else if (this.selectedMode == 2){
      var slotDuration = "01:00:00";
      var mintime = "03:00:00";
    }else{
      var slotDuration = "00:30:00";
      var mintime = "00:00:00";
    }
    
    this.myCalendar.fullCalendar("option", {
      "mintime": mintime,
      "slotDuration": slotDuration
    });

    this.myCalendar.fullCalendar("render");
  }

  handleModalAccept(){
    if (this.planDate != null && this.planTimeStart != null && this.planTimeEnd != null){
          this.addPlantime();
          $('#modalAddSlot').modal('hide');
    }else{
      alert("please fill in all fields")
    }
  }

  handleCalenderClicked(date) {

    $('#modalAddSlot').modal('show');
    var dateFormatted = new Date(date.date._d).toISOString();
    this.planDate = dateFormatted.substring(0,10);
    this.planTimeStart = dateFormatted.substring(dateFormatted.indexOf("T")+1,dateFormatted.indexOf("."));

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
      this.refetchEvents(); 

    }else if (this.selectedMode == 2){
      $('.filter').addClass("hide");
      if (this.selectedUser != null || typeof(this.selectedUser) == "undefined"){
        this.refetchEvents(); 
      }
    }else {
      console.log("Invalid mode")
    }
  }

  handleUserCompareSelect(event){

    if (this.selectedMode == 2){
      this.refetchEvents();
    }

  }

  refetchEvents(){ 

    let view = this.myCalendar.fullCalendar("getView"); 

    let startDate = new Date(view.intervalStart._d).toISOString().substring(0,10);
    let endDate = new Date(view.intervalEnd._d).toISOString().substring(0,10);

    this.getPlantime(startDate, endDate, null, this.setEventData.bind(this));

  }

  onChange(evt) {
      var component = this;
      this.filters.length = 0;
      this.optionsModel.forEach(function(item){
        component.filters.push(component.dataHandlingService.filterItem("userid", "eq", item));
      });
      this.refetchEvents();
  }

  select(event) {

    let evt = event.detail; 

    var startDate = evt.start.format();
    var endDate = evt.end.format();

    this.planDate = startDate.substring(0,10);
    this.planTimeStart = startDate.substring(startDate.indexOf("T")+1,startDate.length);
    this.planTimeEnd = endDate.substring(endDate.indexOf("T")+1,endDate.length);

    $('#planDateStr').html(this.planDate);
    $('#timeSlotFrom').val(this.planTimeStart);

    $('#modalAddSlot').modal('show');
  }
  
  eventClick(event){

    let evtDate = new Date(event.detail.event.end.format());

    // allow item clicking only for future events and within mode = 1 for planning purposes
    if (evtDate > new Date()){

      if(this.selectedMode == 1){

        let clickedId = event.detail.event.id; 

        if (this.selectId != clickedId){
          $('.slotSelected').removeClass('slotSelected'); 
          this.selectId = clickedId; 
        }else{
          this.selectId = null;
        } 
        
        $(event.detail.jsEvent.target).parent().toggleClass('slotSelected');
      }else{
        console.log("Deleting of items can only be done within the respective mode.");
      }
     
    }else{
      alert("Deleting of items can only be done for future events.");
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
          this.refetchEvents();
        },
        error => {
          this.dataHandlingService.errorHandler(error);
        });
  }
  /**
   * 
   * @param start Starting date in ISO String format without time -> 2018-12-31
   * @param end Ending date in ISO String format without time -> 2018-12-31
   * @param timezone 
   * @param callback 
   */

  getPlantime(start, end, timezone, callback){

      if (this.selectedMode == 1){

        var userId = this.authService.getUserId();

        let params = { "userid": userId, "sortBy": "refdate", "sortDir" : "DESC", "startDate": start , "endDate": end, filters: this.filters};
    
        this.dataHandlingService.getPlantime(params).subscribe(
          data => { 
            callback(data);
          },
          error => {
            this.dataHandlingService.errorHandler(error);
          });

      }
      else if (this.selectedMode == 2){
        if (this.selectedUser.userid != null){
          let params = {"userid": this.selectedUser.userid, "sortBy": "refdate", "sortDir" : "DESC"};
    
          this.dataHandlingService.getPlanActuals(params).subscribe(
            data => {
              callback(data);
            },
            error => {
              this.dataHandlingService.errorHandler(error);
            });
        }else{
          alert("Bitte einen Nutzer auswählen für den Vergleich")
        }

      }
  };


  updatePlantime(evt){

    let event = evt.event;

    var planTimeId = parseInt(event.id); 
    var planTimeStart = event.start.format(); 
    var planTimeEnd = event.end.format(); 

    var body = {"planTimeId" : planTimeId}
    body["plantimeStart"] = planTimeStart;
    body["plantimeEnd"] = planTimeEnd;

    this.dataHandlingService.updatePlantime(body).subscribe(
        data => {
          console.log("plantTime Event with ID " + planTimeId + " has been updated successfully")
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
          this.refetchEvents();
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