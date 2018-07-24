exports.getTableFieldNames = (sheet) => {
  return new Promise((resolve, reject) => {
    try {
      sheet.getCells({ 'min-row': 1, 'max-row': 1, 'return-empty': false }, (error, cells) => {
        if (error) return reject(error)
        let tableHeaders = cells.map(cell => cell._value.replace(/[^A-Za-z-]/g, '').toLowerCase())
        return resolve(tableHeaders)
      })
    } catch (error) {
      return reject(error)
    }
  })
}

exports.produceTemplateObject = (tableHeaders) => {
  try {
    let templateObject = {}
    tableHeaders.forEach((header) => {
      templateObject[header] = ''
    })
    return templateObject
  } catch (error) {
    throw error
  }
}
