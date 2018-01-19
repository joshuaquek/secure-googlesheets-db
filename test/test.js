const SecureSheetsDB = require('../index.js')
const creds = require( '../google-generated-creds.json');
const { test, success, output, done } = require('./TestHelpers.js')

// ------ Run Test Main Function ------
let run = async () => {
  console.log("⚠️ ⚠️  Start Tests ⚠️ ⚠️ \n");

  // First Test
  test(1, "Testing for db connection")
  let isConnected = await SecureSheetsDB.connect('1xusj_IWRF05dHlgnZnP5p1W4N7YNquA2fv4AHMzHq4c', creds )
  output(isConnected)
  success()

  // Second Test
  test(2, "Testing for listing out of all tables")
  let tables = await SecureSheetsDB.getAllTableNames()
  output(tables)
  success()

  // Third Test
  test(3, "Testing for data insertion")
  let insertion = await SecureSheetsDB.insert("Sheet1", {nameofeatery: "Raffles Place", description:"A place with lots of food.", latitude: 7.77, longitude: 5.55})
  output(insertion);
  success()

  // Fourth Test
  test(4, "Testing to get table headers")
  let headers = await SecureSheetsDB.getAllHeadersOfTable("Sheet1")
  output(headers)
  success()

  // Fifth Test 
  test(5, "Testing to find record")
  let headers = await SecureSheetsDB.getAllHeadersOfTable("Sheet1")
  output(headers)
  success()


  // // Sixth Test
  // test(6, "Testing for data updating WITHOUT UPSERT")
  // let updating1 = await SecureSheetsDB.update("Sheet1", {nameofeatery: "Raffles Place"}, {nameofeatery: "Kopitiam", description: "A nice place to eat at.", latitude: 1.99, longitude: 2.00}, {upsert: false} )
  // output(updating1)
  // success()

  // // Seventh Test
  // test(7, "Testing for data updating WITH UPSERT")
  // let updating2 = await SecureSheetsDB.update("Sheet1", {nameofeatery: "Kopitiam"}, {nameofeatery: "Food Republic", description: "An expensive place to buy local food at.", latitude: 2.22, longitude: 3.33}, {upsert: true} )
  // output(updating2)
  // success()

  done()
}

// Run test
run().catch((error) => {
  console.log(error);
})
