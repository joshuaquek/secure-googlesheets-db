const SecureSheetsDB = require('../index.js')
const creds = require('../google-generated-creds.json')

// ------ Run Test Main Function ------
let run = async () => {
  console.log('⚠️ ⚠️  Start Tests ⚠️ ⚠️ \n')

  // First Test
  console.log(1, 'Testing for db connection')
  let isConnected = await SecureSheetsDB.connect('1xusj_IWRF05dHlgnZnP5p1W4N7YNquA2fv4AHMzHq4c', creds)
  console.log(isConnected)
  console.log('\n\n')

  // Second Test
  console.log(2, 'Testing for listing out of all tables')
  let tables = await SecureSheetsDB.getAllTableNames()
  console.log(tables)
  console.log('\n\n')

  // Third Test
  console.log(3, 'Testing to generate insertion template')
  console.log('\n\n')

  // Fourth Test
  console.log(4, 'Testing for data insertion')
  let insertion = await SecureSheetsDB.insert('Sheet1', {nameofeatery: 'Raffles Place', description: 'A place with lots of food.', latitude: 7.77, longitude: 5.55})
  console.log(insertion)
  console.log('\n\n')

  // Fifth Test
  console.log(5, 'Testing to get table headers')
  let headers = await SecureSheetsDB.getAllHeadersOfTable('Sheet1')
  console.log(headers)
  console.log('\n\n')

  // Sixth Test
  console.log(6, 'Testing to findOne record')
  let findOneer = await SecureSheetsDB.findOne('Sheet1', {nameofeatery: 'Sidewalk Cafe', description: 'Foodcourt beside Funan IT Mall'})
  console.log(findOneer)
  console.log('\n\n')

  // Seventh Test
  console.log(7, 'Testing to find records')
  let finder = await SecureSheetsDB.find('Sheet1', {description: 'A place with lots of food.', latitude: '7.77'})
  console.log(finder)
  console.log('\n\n')

  // Seventh Test
  console.log(8, 'Testing to find records')
  let remover = await SecureSheetsDB.remove('Sheet1', {description: 'A place with lots of food.', latitude: '7.77'})
  console.log(remover)
  console.log('\n\n')

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
}

// Run test
run().catch((error) => {
  console.log(error)
})
