// @flow
const GoogleSpreadsheet = require('google-spreadsheet')
const Promise = require('bluebird')
let isConnected: boolean = false
let payload: any = undefined
let sheets: Array<any> = []
let currentSheet: any = undefined // Used after connecting

// ----- Helper Functions -----

let getTable = (tableName: string, callback: (error: string | null, sheet: any ) => void ): void => {
  if(!isConnected) callback("ERROR: Database is not connected.", {})
  let sheet: any | null = sheets.find((sheet) => {
    return sheet.title === tableName
  }) || null
  if(sheet != null){
    callback(null, sheet)
  }else{
    callback("ERROR: Table/Sheet does not exist.", {})
  }
}

let getTableHeaders = (sheet: any, callback: (error: string | null, headersArray: Array<string> ) => void) => {
  sheet.getCells({
   'min-row': 1,
   'max-row': 1,
   'return-empty': false
 }, function(err, cells) {
   if(err) callback(err,[])
   let tableHeaders = cells.map(cell => cell._value.replace(/[^A-Za-z-]/g, "").toLowerCase())
   callback(null, tableHeaders)
 })
}

// ----- Module Exports -----

exports.connect = ( sheetId: string , credentials: any ): Promise => {
  return new Promise( (resolve, reject) => {
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

exports.listOutAllTables = (): Promise => {
  return new Promise( (resolve, reject) => {
    if(!isConnected) reject("ERROR: Database is not connected.")
    let worksheets = payload.worksheets.map((sheet) => {
      return sheet.title
    })
    resolve(worksheets)
  })
}

// Sidenote: Example format of dataToInsert = { firstname: "John", lastname:"Doe", gender: "male"}
// ... If say 'lastname' is not present as a column in the DB, it will simply skip and not insert. No errors thrown.
exports.insert = ( tableName: string , dataToInsert: {[string]: string} ): Promise => {
  return new Promise( (resolve, reject) => {
    getTable(tableName, (err, sheet) => {
      sheet.addRow( dataToInsert , (err, row) => {
        err ? reject(err): resolve(row)
      })
    })
  })
}

exports.getTableHeaders = (tableName: string): Promise => {
  return new Promise(function(resolve, reject) {
    getTable(tableName, (err, sheet) => {
      if(err) reject(err)
      getTableHeaders(sheet, (err, headers) => {
        if(err) reject(err)
        resolve(headers)
      })
    })
  })
}

exports.update = (tableName: string, dataToUpdate: any): Promise => {
  return new Promise(function(resolve, reject) {
    getTable(tableName, (err, sheet) => {
      if(err) reject(err)
      resolve(sheet)
      // sheet.getRows({ offset: 2 }, function( err, rows ){
      //   if(err) console.log(err)
      //   rows[1].test = 'new val';
      //   rows[1].save();
      // })
    })
  })
}
