// 
const GoogleSpreadsheet = require('google-spreadsheet')
const Promise = require('bluebird')
const _ = require('lodash');

let isConnected = false
let database = undefined
let workbook = undefined
let sheets = []
let currentSheet = undefined // Used after connecting

// ----- Helper Functions -----

let createTable = (tableName, headerTitles, callback) => {
  if(!isConnected) callback(Error("ERROR: Database is not connected."), {})
  database.addWorksheet({title: tableName, headers: headerTitles}, (err, table) => {
    err ? callback(err, {} ) : callback(null, table)
  })
}

let getTable = (tableName, callback ) => {
  if(!isConnected) callback(Error("ERROR: Database is not connected."), {})
  let sheet = sheets.find((sheet) => {
    return sheet.title === tableName
  }) || null
  if(sheet != null){
    callback(null, sheet)
  }else{
    callback(Error("ERROR: Table/Sheet does not exist."), {})
  }
}

let getTableHeaders = (sheet, callback) => {
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

exports.connect = ( sheetId , credentials ) => {
  return new Promise( (resolve, reject) => {
    let doc = new GoogleSpreadsheet(sheetId)
    doc.useServiceAccountAuth(credentials, () => {
      database = doc // assign overall GoogleSpreadsheet object as global module database variable
      doc.getInfo(function(err, workbookData) {
        if(err) ( console.log(err), reject(false) )
        isConnected =  true // change isConnected flag to true
        workbook =  workbookData // assign workbook object as a global module variable
        sheets = workbookData.worksheets
        console.log('>  📗   Google Sheets DB Connected! Workbook name: '+workbook.title+' by '+workbook.author.email)
        resolve(true)
      })
    })
  })
}

exports.isConnected = isConnected

exports.getAllTableTitles = () => {
  return new Promise( (resolve, reject) => {
    if(!isConnected) reject(Error("ERROR: Database is not connected."))
    let worksheets = workbook.worksheets.map((sheet) => {
      return sheet.title
    })
    resolve(worksheets)
  })
}

exports.getAllTableHeaderTitles = (tableName) => {
  return new Promise(function(resolve, reject) {
    getTable(tableName, (err, sheet) => {
      if(err) reject(err)
      getTableHeaders(sheet, (err, headers) => {
        err ? reject(err) : resolve(headers)
      })
    })
  })
}


// Sidenote: Example format of dataToInsert = { firstname: "John", lastname:"Doe", gender: "male"}
// ... If say 'lastname' is not present as a column in the DB, it will simply skip and not insert. No errors thrown.
exports.insert = ( tableName , dataToInsert ) => {
  return new Promise( (resolve, reject) => {
    if(tableName.length == 0) reject(Error("ERROR: Table Name must not be empty."))
    if(_.isEmpty(dataToInsert)) reject(Error("ERROR: Empty object not allowed to be inserted."))
    getTable(tableName, (err, sheet) => {
      if(err){ // Table does not exist, create table then insert data
        let tableTitles = []
        for(let key in dataToInsert){
          tableTitles.push(key)
        }
        createTable(tableName, tableTitles, (err, table) => {
          if(err) reject(err)
          table.addRow( dataToInsert , (err, row) => {
            err ? reject(err): resolve(row)
          })
        })
      }else{ // Table exists, insert data
        sheet.addRow( dataToInsert , (err, row) => {
          err ? reject(err): resolve(row)
        })
      }
    })
  })
}

exports.update = (tableName, dataToUpdate, {upsert = false}) => {
  return new Promise(function(resolve, reject) {
    getTable(tableName, (err, sheet) => {
      if(err) reject(err)
      sheet.getRows({ offset: 1 }, function( err, rows ){
        if(err) console.log(err)
        rows[1].test = 'new val';
        rows[1].save();
      })
    })
  })
}
