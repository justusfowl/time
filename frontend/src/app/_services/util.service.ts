import { Injectable } from '@angular/core';


@Injectable()
export class UtilService {
    constructor(
    ) { }

    showLoader(){
        $('.loaderContainer').removeClass("hide");
        //console.log("SHOW LOADER")
    }

    hideLoader(res){
        $('.loaderContainer').addClass("hide");
        //console.log("HIDE LOADER")
        return res;
    }

    setNavOnRoute(route){
        $(".nav").find(".active").removeClass("active");
        $("#nav_"+route).addClass("active");
    }

    formatDateToIsoWithTZ(date){

        var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
        var localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);

        return localISOTime; 
    }
}