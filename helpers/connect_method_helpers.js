exports.authenticate = (workbook, credentials) => {
  return new Promise((resolve, reject) => {
    try {
      workbook.useServiceAccountAuth(credentials, () => {
        return resolve()
      })
    } catch (error) {
      return reject(error)
    }
  })
}

exports.getWorkbookData = (workbook) => {
  return new Promise((resolve, reject) => {
    try {
      workbook.getInfo((error, workbookData) => {
        return error ? reject(error) : resolve(workbookData)
      })
    } catch (error) {
      return reject(error)
    }
  })
}
