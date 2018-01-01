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

    formatUserCategoryId(catId){
        if (catId == 1){
            return "450€/Monat"
        }

        if (catId == 2){
            return "Flex. Teilzeit"
        }
    }

    formatUserRoleId(userRoleId){
        if (userRoleId == 1){
            return "Nutzer"
        }

        if (userRoleId == 2){
            return "Administrator"
        }
    }

    formatCatTimeId(catId){
        if (catId == 1){
            return "Krankheit"
        }

        if (catId == 2){
            return "Urlaub"
        }

        if (catId == 3){
            return "Feiertag"
        }

        if (catId == 4){
            return "Zeitenausgleich"
        }
    }

    formatReqCatId(reqCatId){
        if (reqCatId == 1){
            return "Zeitnachtrag"
        }

        if (reqCatId == 2){
            return "Löschantrag"
        }

        if (reqCatId == 3){
            return "Hausbesuch"
        }

    }

    formatReqStatusId(statusId){
        if (statusId == 0){
            return "Offen"
        }

        if (statusId == 1){
            return "Genehmigt"
        }

        if (statusId == 2){
            return "Abgelehnt"
        }

    }
}