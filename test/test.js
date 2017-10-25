// @flow
const SecureSheet = require('../index.js')
const creds = require( '../google-generated-creds.json');


let run = async () => {
  await SecureSheet.connect('1xusj_IWRF05dHlgnZnP5p1W4N7YNquA2fv4AHMzHq4c', creds )

}

// Run test
run()
