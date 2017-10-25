// 
const GoogleSpreadsheet = require('google-spreadsheet')
const Promise = require('bluebird')
let isConnected = false
let payload = undefined
let sheets = []
let currentSheet = undefined // Used after connecting

exports.connect = function ( sheetId , credentials ) {
  return new Promise(function(resolve, reject) {
    let doc = new GoogleSpreadsheet(sheetId)
    doc.useServiceAccountAuth(credentials, () => {
      doc.getInfo(function(err, payloadObject) {
        if(err){
          console.log(err)
          reject(false)
        }
        isConnected =  true // change isConnected flag to true
        payload =  payloadObject // assign workbook object as a global module variable
        sheets = payload.worksheets
        console.log('>  📗   Google Sheets DB Connected! Workbook name: '+payload.title+' by '+payload.author.email)
        resolve(true)
      })
    })
  })
}

exports.isConnected = isConnected

exports.listOutAllTables = () => {
  return new Promise(function(resolve, reject) {
    if(!isConnected) reject("Database is not connected.")
    let worksheets = payload.worksheets.map((sheet) => {
      return sheet.title
    })
    resolve(worksheets)
  })
}

exports.insert = function ( tableName , data ) {
  return new Promise(function(resolve, reject) {
    if(!isConnected) reject("Database is not connected.")
    let sheet = sheets.find((sheet) => {
      return sheet.title === tableName
    }) || null

    resolve(sheet)
    // sheet.addRow( data , (err, row) => {
    //   err ? ( console.log(err) , reject(err) ) : ( console.log(row) , resolve(row) )
    // })
  })
}
