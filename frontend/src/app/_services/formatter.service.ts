import { Injectable } from '@angular/core';


@Injectable()
export class FormatterService {
    constructor(
    ) { }

    formatDateYear(inStr){
        return inStr.substring(0,4);;
    }

    formatDateDayMonth(inStr){
        var day = inStr.substring(6,8);
        var month = inStr.substring(4,6);
        return day + "." + month + ".";
    }
    
    formatNumberDecimals(num, digits){
        if (num != null){
            return num.toFixed(digits);
        }else{
            return "-"; 
        }
    }

    formatRefMonth (refMonth){

        return refMonth.substring(4,6) + "/" + refMonth.substring(0,4);
    }

    formatRefDate (refDate){
        
        return refDate.substring(6,8) + "." + refDate.substring(4,6) + "." + refDate.substring(0,4);
    }
}