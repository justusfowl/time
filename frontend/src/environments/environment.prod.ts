export const environment = {
  production: true,
  apiVersion : "01", 
  baseUrl: "", 
  baseProtocol : "http", 
  basePort : "",
  getBaseUrl : function(){
    if (this.baseUrl.length == 0){
      return ""; 
    }else{
      return this.baseProtocol + "://" + this.baseUrl + ":" + this.basePort;
    }
  }, 
  jwtExpirySeconds : 800, 
  appVersion: require('../../package.json').version
};
