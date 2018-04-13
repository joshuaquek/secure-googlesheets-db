Google Sheets as a Database
=========

Looking for a novel way to store your data? Look no further! Semi-production ready, and best of all, its free!

## TO-DO for README.MD

This Readme.MD is incomplete. Below are the few

  - Add in images at parts marked with IMAGE_HERE
  - Add in instructions for other features
  - Add in example code

## Installation

  ```bash
  npm install google-sheets-database --save
  ```

## Usage

#### Formatting your Google Sheets for usage as a Database

  First, create a new GoogleSheets Workbook in your Google Drive.

  Once you have created the GoogleSheets Workbook, open it. You should see a blank GoogleSheets Sheet. This is where you will be creating your first "database table". Every GoogleSheets Sheet in a GoogleSheets Workbook will be read by this library to be a Database Table.

  To create a new Table that can be read by this library, follow the following format:

  The Table's headers (column names) in the first row of the sheet (row 1). Column names should be lowercase and contain no spaces.

  The Table's first row should start from the first  of the sheet (column A).

  The Table's first column should start from the first column of the sheet (column A).

  The image below shows what a Table should look like within the GoogleSheets Sheet:

  IMAGE_HERE

#### Connecting to Google Sheets as a Database

  First, you will have to get the `google-generated-creds.json` file, which you can download from your Google Developers Console:

  IMAGE_HERE

  Next, share your sheet with your Google Drive's Account Email, which can be found within your `google-generated-creds.json` file:

  IMAGE_HERE

  You can then connect to your Google Spreadsheet:

  ``` javascript
  const database = require('google-sheets-database')

  const CREDENTIALS = require( '../google-generated-creds.json')

  const SHEET_ID = '2xusj_IWRF05_lgnZxP_1W4N7_99quA2fv4AHMzKLe_2'

  database.connect(SHEET_ID, CREDENTIALS)

  ```

  You can check if you are connected using:

  ``` javascript
  console.log( database.getConnectionStatus() )

  ```

  This should output `true` if it is connected.

#### Inserting Data

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.
