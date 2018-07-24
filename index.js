const GoogleSpreadsheet = require('google-spreadsheet')
const Promise = require('bluebird')

const { authenticate, getWorkbookData } = require('./helpers/connect_helpers')
const { getTableFieldNames, produceTemplateObject } = require('./helpers/template_method_helpers')
const { validateInsertParameters, getTableObject, addObjectToExistingTable, addObjectToNewTable } = require('./helpers/template_method_helpers')

module.exports = () => {
  let workbook // Used to store the Workbook Object, used to create Tables. Undefined by default.
  let workbookData // Used to store the WorkbookData Object, used to hold the created Tables. Undefined by default.

  return {

    // ------- Connect to Google Sheets Database -------
    connect: (workbookId, credentials) => {
      return new Promise(async (resolve, reject) => {
        try {
          workbook = new GoogleSpreadsheet(workbookId) // Get Workbook Object via the workbook's id.
          await authenticate(workbook, credentials) // This throws an error if authentication fails.
          workbookData = await getWorkbookData(workbook) // Returns the WorkbookData Object.
          console.log('>  📗   Google Sheets DB Connected! Workbook name: ' + workbookData.title + ' by ' + workbookData.author.email)
          resolve(workbookId) // Resolves Workbook ID is connection is successful.
        } catch (error) {
          reject(error) // Reject if error
        }
      })
    },

    // ------- Create Template for Object Insertion -------
    template: (tableName) => {
      return new Promise(async (resolve, reject) => {
        try {
          let headerFieldNamesArray = await getTableFieldNames(tableName) // Get field names of table, based on table name
          let templateObject = produceTemplateObject(headerFieldNamesArray) // produces a blank template object to use for record insertion
          resolve(templateObject) // Resolves template object if successful.
        } catch (err) {
          reject(err) // Handle Error
        }
      })
    },

    insert: (tableName, insertObject) => {
      return new Promise(async (resolve, reject) => {
        try {
          validateInsertParameters(tableName, insertObject) // This line throws an error if the parameters fail the validation.
          let tableObject = getTableObject(tableName, workbookData) // Gets Table object.
          if (tableObject) await addObjectToExistingTable(tableObject, insertObject) // Adds a new record to the Table object.
          if (!tableObject) await addObjectToNewTable(workbook, tableName, insertObject) // Create a new Table o
          resolve(insertObject) // Return back the inserted object if successful
        } catch (error) {
          reject(error) // Reject if error
        }
      })
    },

    update: (tableName, insertObject) => {

    }

  } // end module exports return
} // end module exports

// ------- Helper methods -------
