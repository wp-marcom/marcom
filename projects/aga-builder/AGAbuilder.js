//const primeDirectory = "C:\\Windows\\";
// Define the primeDirectory variable for file paths
const primeDirectory = "C:\\projects\\";
const fs = require('fs');
const Excel = require(`${primeDirectory}node_modules\\exceljs`);
const reader = require(`${primeDirectory}node_modules\\xlsx`)
const AGAdirectory = __dirname + `\\incomingLists`;
const CSVdirectory = __dirname + `\\incomingLists`;




// read from an excel file,get the job numbers and mail dates from two different columns

//First find the excel file that is in the root directory
let dirCont = fs.readdirSync(AGAdirectory);
let dirCSV = fs.readdirSync(CSVdirectory);
let AGAexcelFile = dirCont.filter(function(elm) {return elm.match(/.*\.(xlsx?)/ig);});

console.log(AGAexcelFile);

// Build the full path
const fullPathtoAGA = __dirname + `\\incomingLists\\${AGAexcelFile[0]}`;

//Import sheet
const wb = new Excel.Workbook();
wb.xlsx.readFile(fullPathtoAGA).then(() => {
//wb.xlsx.readFile(`${AGAexcelFile}`).then(() => {
let ws = wb.getWorksheet();
//let ws = wb.getWorksheet(`April T65 With Job Numbers`);

//First read the job numbers and create an array
let jobNumbers = ws.getSheetValues();
jobNumbers = jobNumbers.map(function(c){


    return c[1];
});
jobNumbers.shift();
jobNumbers.shift();
jobNumbers.shift();
//console.log(jobNumbers);

//Next, read the mail dates and create an array
let mailDates = ws.getSheetValues();
let jobList = ws.getSheetValues();

jobList = jobList.map(function(c){
  return c[1];
});
//jobList.shift();
jobList.shift();//Remove empty start
jobList.shift();//Remove column heading
//console.log(jobList);
console.log(jobList.length+" records to process...");

mailDates = mailDates.map(function(c){
    return c[2];
});
mailDates.shift();//Remove empty start
mailDates.shift();//Remove column heading
//console.log(mailDates)
console.log(mailDates.length+" dates to process...");



//Create a function that takes in the dates from the ship date column and extracts/formats month and date as m-d
let convertStringtoDate = function(dateString){
  //if (dateString == ''){
   // console.log (typeof (dateString))
  //}
    let dateMonth=0;
    dateString = new Date(`${dateString}`);
    dateISOstring = dateString.toISOString();
    let dateOnly = dateISOstring.substr(0,10);//yyyy-mm-dd
   //checks date for leading zero and removes it, keeps date number
    if(dateOnly.charAt(8)==0) {dateDate = dateOnly.charAt(9)} else dateDate = dateOnly.substr(8,2);
    //checks month for leading zero and removes it, keeps month number
    if(dateOnly.charAt(5)==0) {dateMonth = dateOnly.charAt(6)} else dateMonth = dateOnly.substr(5,2);
//mm-dd
    return (`${dateMonth}-${dateDate}`);
}

let checkDateDup = function(dateArray){
    let noDupDateArray=[];
    for (i=0;i<dateArray.length;i++)
    {
        if(noDupDateArray.indexOf(dateArray[i])=="-1"){noDupDateArray.push(dateArray[i])}
        else{}; 
    }
    return noDupDateArray;
}

// Create an array of formatted mail dates for naming folders

//An array of all due dates in spreadsheet
const mailDatesConverted=[];
//An array of all due dates in spreadsheet WITH DUPLICATES REMOVED
let mailDatesNoDupes=[];
//An array of all folder names with the Mail Date and Job Number
const mailDateJobfolderNames = [];
//An array of all folder names with the Mail Date and 'DBF'
const mailDateDBFfolderNames = [];

for(i=0;i<mailDates.length;i++){

    if (typeof mailDates[i]=='undefined'){
      console.log("Missing Due Date");
      mailDateJobfolderNames[i]="Could Not Process"
      mailDatesConverted[i] = "";
    }

    else if (typeof mailDates[i]=='object'){
    mailDatesConverted[i] = convertStringtoDate(`${mailDates[i]}`)
    mailDateJobfolderNames[i]=`${mailDatesConverted[i]} ${jobList[i]}`
    mailDateDBFfolderNames[i] = `${mailDatesConverted[i]} DBF`;
    }

else {}

if(mailDateJobfolderNames[i]!="Could Not Process"){
  fs.mkdir(__dirname+`\\processedLists\\${mailDateJobfolderNames[i]}`, { recursive: true }, (err) => {
//fs.mkdir(__dirname+`\\${mailDateJobfolderNames[i]}`, { recursive: true }, (err) => {
  if (err) throw err;});
}
  fs.mkdir(__dirname+`\\processedLists\\${mailDateDBFfolderNames[i]}`, { recursive: true }, (err) => {
  //fs.mkdir(__dirname+`\\${mailDateDBFfolderNames[i]}`, { recursive: true }, (err) => {
    if (err) throw err;
  });
}

mailDatesNoDupes = [...new Set(mailDatesConverted)];
console.log(mailDatesNoDupes);

mailDateDBFfolderNamesNoDupes = [...new Set(mailDateDBFfolderNames)];
console.log(mailDateDBFfolderNamesNoDupes); 




for(i=0;i<jobList.length;i++){

console.log(jobList[i]+" is the job");

let csvToMove = dirCSV.filter(function(elm) {return elm.match(`${jobList[i]}`);});
console.log(csvToMove+" is the file");

let oldPath = __dirname+`\\incomingLists\\${csvToMove[0]}`;
let jobPath = __dirname+`\\processedLists\\${mailDateJobfolderNames[i]}\\${csvToMove[0]}`
let DBFPath = __dirname+`\\processedLists\\${mailDateDBFfolderNames[i]}\\${csvToMove[0]}`

//console.log(`old path is ${oldPath}, job path is ${jobPath}`);
//console.log(`old path is ${oldPath}, DBFPath path is ${DBFPath}`);

fs.copyFile(oldPath,jobPath, (err) => {
  if (err) throw "CSV File copy error to Job Number Directory"+jobList[i]+oldPath+"cannot be moved or doesnot exist";
  console.log('CSV file copy complete to Job Number Directory!'+jobList[i]);
});

fs.rename(oldPath,DBFPath, (err) => {
  if (err) throw "CSV File move error to DBF Directory"+jobList[i]+oldPath+"cannot be moved or doesnot exist";
  console.log('CSV file move complete to DBF Directory!'+jobList[i]);
});

}




for(m=0;m<mailDatesNoDupes.length;m++){

//This function takes a date from the NoDupes Date Array and creates an array of all the job numbers that match that date
let dateCompare = function (datefromNoDupes) {
  jobGroup = [];
  //datetoCompare =
  for (i = 0; i < mailDatesConverted.length; i++) {
    if (mailDatesConverted[i]==datefromNoDupes) {
      jobGroup.push(jobList[i]);
    }
  }
  return jobGroup;
};
//Create a BeckyRay seed file with code column that list the job number for every job number in the dbf folder
//make the SEED workbook for each due date in the NonDupes Array


const file = reader.utils.book_new();
//make the sheet
file.SheetNames.push("Sheet 1");

//Create the header row inside the excel sheet...//assign the header row to the existing sheet
let ws_data = [[`first`,`last`,`company`,`a1`,`city`,`st`,`zip`,`code`]];

let directoryName = `${mailDateDBFfolderNamesNoDupes[m]}`;
console.log(`Current directory ${directoryName}`);

//make the header row here

//find a list of all job numbers that match the dueDate using the dateCompare function
let curJobList = dateCompare(mailDatesNoDupes[m]);
console.log(curJobList);

//Push a seed row for each job number that matches the current due date
for(n=0;n<curJobList.length;n++){
ws_data.push([`Becky`,`Wigginton-Colon`,`West Press`,`1663 W Grant Rd`,`Tucson`,`AZ`,`85745-1433`,`${curJobList[n]}`],[`Ray`,`Wcisel`,`Acquire Direct Marketing`,`12620 Race Track Road`,`Tampa`,`FL`,`33626`,`${curJobList[n]}`],[`Gabrielle`,`Rascon`,`Applied General Agency`,`19584 Lanfranca Drive`,`Santa Clarita`,`CA`,`91350`,`${curJobList[n]}`])
}
//testing output console.log (`data to write is ${ws_data}`)

//Take the completed version of the data array (header row+ all seed rows) and write it to the generated excel file
let arraysheet = reader.utils.aoa_to_sheet(ws_data);
file.Sheets["Sheet 1"] = arraysheet;
//save the file in the correct directory
reader.writeFile(file,__dirname+`\\processedLists\\${directoryName}\\BeckyRaySeed.xls`)
}
//}
    // let renamePath = __dirname+`\\undefined DBF`;
    // let newNamePath = __dirname+`\\UnableToProcess`
    
    // //console.log(`old path is ${oldPath}, newest path is ${newPath}`);
    
    // fs.rename(renamePath,newNamePath, (err) => {
    //     if (err) throw "Could Not Rename Directory";
    //     console.log('Directory renamed!');
    //   });





    });