// @flow
const GoogleSpreadsheet = require('google-spreadsheet')
const Promise = require('bluebird')
const _ = require('lodash');

let isConnected: boolean = false
let database: GoogleSpreadsheet = undefined
let workbook: any = undefined
let sheets: Array<any> = []
let currentSheet: any = undefined // Used after connecting

// ----- Helper Functions (Not exported) -----

// Takes in the table name and an array of strings, which are the headers that you want the table to have.
// Returns a Sheet object (and also creates a new sheet in google sheets itself).
let createTable = (tableName: string, headerTitles: Array<string>, callback: (error: Error | null, sheet: any ) => void) => {
  if(!isConnected) callback(Error("ERROR: Database is not connected."), {})
  database.addWorksheet({title: tableName, headers: headerTitles}, (err, sheet) => {
    err ? callback(err, {} ) : callback(null, sheet)
  })
}


// Takes in the table name.
// Returns a Sheet object in the form of a callback
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

// Takes in a Sheet object.
// Returns an array of strings, which are the table headers.
// Example: ['id', 'name', 'gender', 'age']
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

// ------- CORE FEATURES --------

let connect = ( sheetId: string , credentials: any ): Promise<boolean,Error> => {
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


let newTemplateRecord = (tableName: string) => {
  return new Promise(async (resolve, reject) => {
    try{ // Try block for handling Promise rejection
      let headersArray: [string] = await getAllHeadersOfTable(tableName)
      let templateObject: any = {}
      headersArray.forEach((header) => {
        templateObject[header] = ""
      })
      resolve(templateObject)
    }catch(err){
      reject(err) // Handle Error
    }
  })
}

// Sidenote: Example of insertObject -->  { firstname: "John", lastname:"Doe", gender: "male"}
// ... If say 'lastname' is not present as a column in the DB, it will simply skip and not insert. No errors thrown.
let insert = ( tableName: string , insertObject: {[string]: string} ): Promise<any,Error> => {
  return new Promise( (resolve, reject) => {
    if(tableName.length == 0) reject(Error("ERROR: Table Name must not be empty."))
    if(_.isEmpty(insertObject)) reject(Error("ERROR: Empty object not allowed to be inserted."))
    getTable(tableName, (err, sheet) => {
      if(err){ // Table does not exist, create table then insert data
        let tableTitles: Array<string> = []
        for(let key:string in insertObject){
          tableTitles.push(key)
        }
        createTable(tableName, tableTitles, (err, table) => {
          if(err) reject(err)
          table.addRow( insertObject , (err, row) => {
            err ? reject(err): resolve(row)
          })
        })
      }else{ // Table exists, insert data
        sheet.addRow( insertObject , (err, row) => {
          err ? reject(err): resolve(row)
        })
      }
    })
  })
}

// EXAMPLE USAGE --> update("Cars", {name: "John Doe"}, {name: "John Doe", age: 25}, {upsert: true} )
let update = (tableName: string, searchCriteria: any, updateRecord: any, {upsert = false}: {upsert: boolean}): Promise<any, Error> => {
  return new Promise(async (resolve, reject) => {
    // First check if searchCriteria and updateRecord contains fields that are not in the table
    let headersArray: [string] = await getAllHeadersOfTable(tableName)
    for(let header: string in searchCriteria){
      if(!_.includes(headersArray,header)) reject(Error("ERROR: Search Criteria contains field(s) that do not exist in the specified table."))
    }
    for(let header: string in updateRecord){
      if(!_.includes(headersArray,header)) reject(Error("ERROR: Update Record contains field(s) that do not exist in the specified table."))
    }
    //Check if record exists
    let recordExists: [any] = await find(tableName, searchCriteria)
    if(recordExists.length != 0){ // If record exists
      // Update the record
      getTable(tableName, (err, sheet) => {
        if(err) reject(err)
        sheet.getRows({ offset: 1 }, function( err, rows ){
          if(err) console.log(err)
          rows = _.filter(rows, searchCriteria)
          for(let key in rows){
            rows[key] = _.merge({},rows[key], updateRecord)
            rows[key].save();
          }
          resolve(rows)
        })
      })
    }else{ // If record doesn't exist
      if(upsert){ // If record doesn't exist AND Upsert is set to true, then insert a new record
        let newRowInserted: any = await insert(tableName,updateRecord)
        resolve(newRowInserted)
      }
    }
  })
}



let find = (tableName: string, queryDictionary: {[string]: string}): Promise<any, Error> => {
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
      })
    })
  })
}


let getAllTableNames = (): Promise<Array<any>,Error> => {
  return new Promise( (resolve, reject) => {
    if(!isConnected) reject(Error("ERROR: Database is not connected."))
    let worksheets = workbook.worksheets.map((sheet) => {
      return sheet.title
    })
    resolve(worksheets)
  })
}

let getAllHeadersOfTable = (tableName: string): Promise<Array<string>,Error> => {
  return new Promise(function(resolve, reject) {
    getTable(tableName, (err, sheet) => {
      if(err) reject(err)
      getTableHeaders(sheet, (err, headers) => {
        err ? reject(err) : resolve(headers)
      })
    })
  })
}

let remove = (tableName: string, matchCriteria: any): Promise<Array<string>,Error> => {
  return new Promise(function(resolve, reject) {
    getTable(tableName, (err, sheet) => {
      if(err) reject(err)
      // let index = _.findIndex(sheet, function(item) {
      //   return item.id == 2
      // })
    })
  });
}

// ----- Module Exports -----

// Use this to insert records.
// Example usage:
exports.connect = connect

// Use this to insert records.
// Example usage:
exports.isConnected = isConnected

// Use this to insert records.
// Example usage:
exports.insert = insert

// Use this to update records.
// Example usage:
exports.update =  update

// Use this to find records.
// Example usage:
exports.find = find

// Gets an array of all table names (array of strings) in the DB.
// Example usage:
exports.getAllTableNames = getAllTableNames

// Gets all of the headers/fields in the specified table (array of strings).
// Example usage:
exports.getAllHeadersOfTable = getAllHeadersOfTable

// Removes record(s) based off a specified query.
// Example usage:
exports.remove = remove
