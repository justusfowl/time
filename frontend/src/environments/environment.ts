// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false, 
  apiVersion : "01", 
  baseUrl: "localhost", 
  baseProtocol : "http", 
  basePort : "3000",
  getBaseUrl : function(){
    if (this.baseUrl.length == 0){
      return ""; 
    }else{
      return this.baseProtocol + "://" + this.baseUrl + ":" + this.basePort;
    }
  }, 
  jwtExpirySeconds : 20000000, 
  appVersion: require('../../package.json').version
};
