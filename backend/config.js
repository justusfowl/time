// config.js
// ========

require('dotenv').config();

let env = process.env.NODE_ENV || 'development'; 
let port = process.env.WEB_PORT || 3000;

module.exports = {
    env : env,
    webPort : port,
    database : {
            "host":  process.env.MYSQL_HOST, 
            "username" : process.env.MYSQL_USER, 
            "password": process.env.MYSQL_PASS, 
            "database": process.env.MYSQL_DB
        }, 
    secret : process.env.JWT_SECRET, 
    AD: {
        "url": 'ldap:\/\/' + process.env.LDAP_HOST, 
        "baseDN": 'dc=' + process.env.LDAP_TLDC + ',dc=' + process.env.LDAP_SLDC,
        "baseDNLogin": process.env.LDAP_BASEDN,
        "usergroup": 'TimeUser', 
        "admingroup" : 'TimeAdmin',
	    "timeplangroup" : 'TimePlanner'

    }, 
    tokenValidSeconds : parseInt(process.env.JWT_INVALID_SEC)
    };