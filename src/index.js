// @flow
const GoogleSpreadsheet = require('google-spreadsheet')
const Promise = require('bluebird')
const _ = require('lodash');

let isConnected: boolean = false
let database: GoogleSpreadsheet = undefined
let workbook: any = undefined
let sheets: Array<any> = []
let currentSheet: any = undefined // Used after connecting

// ----- Helper Functions -----

let createTable = (tableName: string, headerTitles: Array<string>, callback: (error: Error | null, table: any ) => void) => {
  if(!isConnected) callback(Error("ERROR: Database is not connected."), {})
  database.addWorksheet({title: tableName, headers: headerTitles}, (err, table) => {
    err ? callback(err, {} ) : callback(null, table)
  })
}

let getTable = (tableName: string, callback: (error: Error | null, sheet: any ) => void ): void => {
  if(!isConnected) callback(Error("ERROR: Database is not connected."), {})
  let sheet: any | null = sheets.find((sheet) => {
    return sheet.title === tableName
  }) || null
  if(sheet != null){
    callback(null, sheet)
  }else{
    callback(Error("ERROR: Table/Sheet does not exist."), {})
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

let compute = (queryObject: {[string]: string}, tableName: string, columnTitle: string | null, queryType: string, equalsText: string | null) => {
  return new Promise(function(resolve, reject) {
    getTable(tableName, (err, sheet) => {
      if(err) reject(err)
      switch(queryType) {
        case "equals":

        break;
        case "contains":

        break;
        case "moreThan":

        break;
        case "lessThan":

        break;
        case "selectFrom":

        break;
        default:

      }
    })
  });
}

// ----- Module Exports -----

exports.connect = ( sheetId: string , credentials: any ): Promise<boolean,Error> => {
  return new Promise( (resolve, reject) => {
    let doc:GoogleSpreadsheet = new GoogleSpreadsheet(sheetId)
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

exports.getAllTableNames = (): Promise<Array<any>,Error> => {
  return new Promise( (resolve, reject) => {
    if(!isConnected) reject(Error("ERROR: Database is not connected."))
    let worksheets = workbook.worksheets.map((sheet) => {
      return sheet.title
    })
    resolve(worksheets)
  })
}

exports.getAllHeaders = (tableName: string): Promise<Array<string>,Error> => {
  return new Promise(function(resolve, reject) {
    getTable(tableName, (err, sheet) => {
      if(err) reject(err)
      getTableHeaders(sheet, (err, headers) => {
        err ? reject(err) : resolve(headers)
      })
    })
  })
}


exports.newInsertObject = (tableName: string) => {
  getTableHeaders(tableName, () => {

  })
}


// Sidenote: Example format of dataToInsert = { firstname: "John", lastname:"Doe", gender: "male"}
// ... If say 'lastname' is not present as a column in the DB, it will simply skip and not insert. No errors thrown.
exports.insert = ( tableName: string , dataToInsert: {[string]: string} ): Promise<any,Error> => {
  return new Promise( (resolve, reject) => {
    if(tableName.length == 0) reject(Error("ERROR: Table Name must not be empty."))
    if(_.isEmpty(dataToInsert)) reject(Error("ERROR: Empty object not allowed to be inserted."))
    getTable(tableName, (err, sheet) => {
      if(err){ // Table does not exist, create table then insert data
        let tableTitles: Array<string> = []
        for(let key:string in dataToInsert){
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

exports.update = (tableName: string, dataToUpdate: any, {upsert = false}: {upsert: boolean}): Promise => {
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


exports.find = (tableName: string, queryDictionary: {[string]: string}): Promise<any, Error> => {
  return new Promise(function(resolve, reject) {
    getTable(tableName, (err, sheet) => {
      if(err) reject(err)
      sheet.getRows({ offset: 1 }, function( err, rows ){
        if(err) console.log(err)
        // State for storing conditions to check :
        let equalsQuery: {[string]: string} = {}
        let containsQuery: {[string]: string} = {}
        let greaterThanQuery: {[string]: string} = {}
        let lesserThanQuery: {[string]: string} = {}
        // Interpret Query :
        for(let key in queryDictionary){
          if( typeof queryDictionary[key] === 'object' && !Array.isArray(queryDictionary[key]) ){ // If it is an $in / $gt / $lt query
            let customQueryDictionary = queryDictionary[key]
            for(let selectorKey in customQueryDictionary ){
              if(selectorKey == '$in'){
                containsQuery[key] = customQueryDictionary[selectorKey]
              }
              if(selectorKey == '$gt'){
                greaterThanQuery[key] = customQueryDictionary[selectorKey]
              }
              if(selectorKey == '$lt'){
                containsQuery[key] = customQueryDictionary[selectorKey]
              }
            }
          }else{ // If it is a regular find() matching query
            equalsQuery[key] = queryDictionary[key]
          }
        }

        if(!_.isEmpty(equalsQuery)){ // If EQUALS query is not empty
          rows = _.filter(rows, equalsQuery)
        }

        if(!_.isEmpty(containsQuery)){ // If EQUALS query is not empty
          _.forOwn(containsQuery, (value, key) => {
            rows = _.filter(rows, (row) => {
              return _.includes(row[key], value)
            })
          })
        }

        if(!_.isEmpty(greaterThanQuery)){ // If EQUALS query is not empty
          _.forOwn(greaterThanQuery, (value, key) => {
            rows = _.filter(rows, (row) => {
              return parseInt(row[key]) > value
            })
          })
        }

        if(!_.isEmpty(lesserThanQuery)){ // If EQUALS query is not empty
          _.forOwn(lesserThanQuery, (value, key) => {
            rows = _.filter(rows, (row) => {
              return parseInt(row[key]) < value
            })
          })
        }

        resolve(rows)
        // rows[1].test = 'new val';
        // rows[1].save();
      })
    })
  })
}
