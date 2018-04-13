// 
const GoogleSpreadsheet = require('google-spreadsheet')
const Promise = require('bluebird')
const _ = require('lodash');

let isConnected = false
let database = undefined
let workbook = undefined
let sheets = []
let currentSheet = undefined // Used after connecting

// ----- Helper Functions (Not exported) -----

// Takes in the table name and an array of strings, which are the headers that you want the table to have.
// Returns a Sheet object (and also creates a new sheet in google sheets itself).
let createTable = (tableName, headerTitles, callback) => {
  if(!isConnected) callback(Error("ERROR: Database is not connected."), {})
  database.addWorksheet({title: tableName, headers: headerTitles}, (err, sheet) => {
    err ? callback(err, {} ) : callback(null, sheet)
  })
}


// Takes in the table name.
// Returns a Sheet object in the form of a callback
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

// Takes in a Sheet object.
// Returns an array of strings, which are the table headers.
// Example return object: ['id', 'name', 'gender', 'age']
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

// Takes in a SpreadsheetRow Object.
// Returns an array of record objects, stripped of redundant metadata fields}
let stripAndCleanRecord = (spreadsheetRowObject) => {
  delete spreadsheetRowObject['id'] // Remove redundant metadata from object
  delete spreadsheetRowObject['_xml'] // Remove redundant metadata from object
  delete spreadsheetRowObject['app:edited'] // Remove redundant metadata from object
  delete spreadsheetRowObject['_links'] // Remove redundant metadata from object
  delete spreadsheetRowObject['save'] // Remove redundant metadata from object
  delete spreadsheetRowObject['del'] // Remove redundant metadata from object
  return JSON.parse( JSON.stringify(spreadsheetRowObject) )
}

// ------- CORE FEATURES --------

let connect = ( sheetId , credentials ) => {
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


let newTemplateRecord = (tableName) => {
  return new Promise(async (resolve, reject) => {
    try{ // Try block for handling Promise rejection
      let headersArray = await getAllHeadersOfTable(tableName)
      let templateObject = {}
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
let insert = ( tableName , insertObject ) => {
  return new Promise( (resolve, reject) => {
    if(tableName.length == 0) reject(Error("ERROR: Table Name must not be empty."))
    if(_.isEmpty(insertObject)) reject(Error("ERROR: Empty object not allowed to be inserted."))
    getTable(tableName, (err, sheet) => {
      if(err){ // Table does not exist, create table then insert data
        let tableTitles = []
        for(let key in insertObject){
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
let update = (tableName, searchCriteria, updateRecord, {upsert = false}) => {
  return new Promise(async (resolve, reject) => {
    // First check if searchCriteria and updateRecord contains fields that are not in the table
    let headersArray = await getAllHeadersOfTable(tableName)
    for(let header in searchCriteria){
      if(!_.includes(headersArray,header)) reject(Error("ERROR: Search Criteria contains field(s) that do not exist in the specified table."))
    }
    for(let header in updateRecord){
      if(!_.includes(headersArray,header)) reject(Error("ERROR: Update Record contains field(s) that do not exist in the specified table."))
    }
    //Check if record exists
    let recordExists = await find(tableName, searchCriteria)
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
        let newRowInserted = await insert(tableName,updateRecord)
        resolve(newRowInserted)
      }
    }
  })
}


// EXAMPLE USAGE --> find("People", {name: "John Doe"})
let findOne = (tableName, queryDictionary) => {
  return new Promise(function(resolve, reject) {
    getTable(tableName, (err, sheet) => {
      if(err) reject(err)
      sheet.getRows({ offset: 1 }, function( err, rows ){
        if(err)( console.log(err), console.trace(), resolve("Error at line ") )
        let object = (_.find(rows, queryDictionary) || {})
        let cleanObject = stripAndCleanRecord(object)
        resolve(cleanObject)
      })
    })
  })
}

// EXAMPLE USAGE --> find("People", {name: "John Doe"})
let find = (tableName, queryDictionary) => {
  return new Promise(function(resolve, reject) {
    getTable(tableName, (err, sheet) => {
      if(err) reject(err)
      sheet.getRows({ offset: 1 }, function( err, rows ){
        if(err)( console.log(err), console.trace(), resolve("Error at line ") )
        let objectsArray = (_.filter(rows, queryDictionary) || {})
        let cleanObjectsArray = objectsArray.map((item) => {
          return stripAndCleanRecord(item)
        })
        resolve(cleanObjectsArray)
      })
    })
  })
}


let getAllTableNames = () => {
  return new Promise( (resolve, reject) => {
    if(!isConnected) reject(Error("ERROR: Database is not connected."))
    let worksheets = workbook.worksheets.map((sheet) => {
      return sheet.title
    })
    resolve(worksheets)
  })
}

let getAllHeadersOfTable = (tableName) => {
  return new Promise(function(resolve, reject) {
    getTable(tableName, (err, sheet) => {
      if(err) reject(err)
      getTableHeaders(sheet, (err, headers) => {
        err ? reject(err) : resolve(headers)
      })
    })
  })
}

let remove = (tableName, matchCriteria) => {
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

// Use this to connect to the DB
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
exports.findOne = findOne

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
