// @flow
const GoogleSpreadsheet = require('google-spreadsheet')
const Promise = require('bluebird')
let isConnected: boolean = false
let payload: any = undefined
let sheets: Array<any> = []
let currentSheet: any = undefined // Used after connecting

exports.connect = function ( sheetId: string , credentials: any ): void {
  return new Promise(function(resolve, reject) {
    let doc:GoogleSpreadsheet = new GoogleSpreadsheet(sheetId)
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

exports.listOutAllTables = (): void => {
  return new Promise(function(resolve, reject) {
    if(!isConnected) reject("Database is not connected.")
    let worksheets = payload.worksheets.map((sheet) => {
      return sheet.title
    })
    resolve(worksheets)
  })
}

exports.insert = function ( tableName: string , data: {[string]: string} ): void {
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
