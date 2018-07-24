const _ = require('lodash')

exports.validateInsertParameters = (tableName, insertObject) => {
  if (tableName.length === 0) throw Error('ERROR: Table Name must not be empty.')
  if (_.isEmpty(insertObject)) throw Error('ERROR: Empty object not allowed to be inserted.')
}

exports.getTableObject = (tableName, workbookData) => {
  return workbookData.worksheets.find(sheet => sheet.title === tableName)
}

exports.addObjectToExistingTable = (tableObject, insertObject) => {
  return new Promise((resolve, reject) => {
    try {
      tableObject.addRow(insertObject, (error, row) => {
        return error ? reject(error) : resolve(row)
      })
    } catch (error) {
      return reject(error)
    }
  })
}

exports.addObjectToNewTable = (workbook, tableName, insertObject) => {
  return new Promise(async (resolve, reject) => {
    try {
      let tableObject = await createNewTable(workbook, tableName, insertObject)
      let insertedObject = await exports.addObjectToExistingTable(tableObject, insertObject)
      resolve(insertedObject)
    } catch (error) {
      reject(error)
    }
  })
}

// ----- Supporting Non-exported functions -----

function createNewTable (workbook, tableName, insertObject) {
  return new Promise((resolve, reject) => {
    workbook.addWorksheet({title: tableName, headers: Object.keys(insertObject)}, (error, tableObject) => {
      return error ? reject(error) : resolve(tableObject)
    })
  })
}
