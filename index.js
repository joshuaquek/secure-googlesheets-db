const GoogleSpreadsheet = require('google-spreadsheet');
const Promise = require('bluebird');
let isConnected = false
let info =  undefined
let currentSheet = undefined // Used after connecting

exports.connect = function ( sheetId, credentials ) {
  return new Promise(function(resolve, reject) {
    let doc = new GoogleSpreadsheet(sheetId);
    doc.useServiceAccountAuth(credentials, () => {
      doc.getInfo(function(err, info) {
        err ? ( console.log(err), reject(false) )
        isConnected =  true
        info =  info
        console.log('>  📗   Google Sheets DB Connected! Workbook name: '+info.title+' by '+info.author.email);
        resolve(true)
      });
    })
  });
};

exports.isConnected = isConnected

exports.listOutAllTables = (columnNamesArray) => {
  return new Promise(function(resolve, reject) {
    isConnected ? reject("Database is not connected.")
    for( worksheet in info.worksheets ){

    }
  });
}
