Secure Google Sheets Database
=========

Looking for a novel way to store your data? Look no further! Semi-production ready, and best of all, its free!

## Installation

  `npm install secure-googlesheets-db`
  OR
  `npm install secure-googlesheets-db --save`

## Usage

#### Connecting to Google Sheets

  First, you will have to get the `google-generated-creds.json` file, which you can download from your Google Developers Console. You can then connect to your Google Spreadsheet:

    const SecureSheetsDB = require('secure-googlesheets-db');

    const creds = require( '../google-generated-creds.json');

    let mySheetId = '1xusj_IWRF05_lgnZnP_1W4N7_YNquA2fv4AHMzKLe_2'

    SecureSheetsDB.connect(mySheetId, creds)


  You can check if you are connected using:

    console.log(SecureSheetsDB.isConnected)

  This should output `true` if it is connected.

  #### Inserting Data

  Code already exists. Documentation coming soon

## Tests

Open your command terminal. In the directory run:

  `npm test`

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.
