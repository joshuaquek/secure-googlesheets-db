const SecureSheet = require('../index.js')
const creds = require( '../google-generated-creds.json');
const { test, success, output, done } = require('./TestHelpers.js')

// ------ Run Test Main Function ------
let run = async () => {
  console.log("⚠️ ⚠️  Start Tests ⚠️ ⚠️ \n");

  // First Test
  test(1, "Testing for db connection")
  await SecureSheet.connect('1xusj_IWRF05dHlgnZnP5p1W4N7YNquA2fv4AHMzHq4c', creds )
  success()

  // Second Test
  test(2, "Testing for listing out of all tables")
  let tables = await SecureSheet.listOutAllTables()
  output(tables)
  success()

  //Third Test
  test(3, "Testing for data insertion")
  let insertion = await SecureSheet.insert("Sheet1", {sn: "test"})
  output(insertion);
  success()

  //Fourth Test
  test(4, "Testing for data updating")
  let updating = await SecureSheet.update("Sheet1", {lol: "test"})
  output(updating)
  success()

  done()
}

// Run test
run().catch((error) => {
  console.log(error);
})
