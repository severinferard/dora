const ExcelJS = require("exceljs");
const express = require("express");
const mongodb = require("mongodb");
const DataLoader = require("../../DataLoader");
const GeoJsonLoader = require("../../GeoJsonLoader");

const router = express.Router();
module.exports = router;

async function createWorksheetFromSession(workbook, session) {
	const worksheet = workbook.addWorksheet(session.session_name);
	worksheet.addRow(["Séance", session.session_name]);
	worksheet.addRow(["École", session.school_name]);
	worksheet.addRow(["Classe", session.class_name]);
	worksheet.addRow(["Date", session.date]);
	worksheet.addRow([]);
  
	let headers = ["Movuino", "Date", "Chrono", "Balises validées"];
	session.beacons.forEach((beacon) => {
	  headers = [...headers, `Balise ${beacon.id}`, `Chrono`, `Chrono intermédiaire`, `Vitesse Moy`, `Distance Moy`];
	});
	worksheet.addRow(headers);
	for (let i = 1; i < headers.length + 1; i++) {
	  if (i <= 5 || i % 5 == 0) worksheet.getColumn(i).outlineLevel = 0;
	  else worksheet.getColumn(i).outlineLevel = 1;
	}
	session.runs.forEach((run) => {
	  let beacons_array = [];
	  let beaconRange = 10;
	  let speeds = DataLoader.getSpeedFromPoints(run.rawPositions, run.sampleRate);
	  let beacons = DataLoader.evaluateBeacons(run.rawPositions, session.beacons, beaconRange, speeds, run.sampleRate);
	  beacons.forEach((beacon) => {
		beacons_array.push(beacon.valided ? "Validée" : "Non Validée");
		beacons_array.push(beacon.time);
		beacons_array.push(beacon.lap);
		beacons_array.push(beacon.avgSpeed);
		beacons_array.push(beacon.distance);
	  });
	  let chrono_tmp = DataLoader.getTime(run.rawPositions, run.sampleRate);
	  let chrono = `${Math.floor(chrono_tmp / 60)}:${Math.floor(chrono_tmp % 60)}`
	  worksheet.addRow([
		run.id,
		run.date,
		chrono,
		run.beacons.filter((b) => b.valided).length,
		...beacons_array,
	  ]);
	});
	worksheet.addRow([])
  worksheet.addRow(['Moyenne', ...headers.map((header, i) => {return !((i+1) == 2 || (i + 1) % 5 == 0) ? { formula: '=AVERAGE(OFFSET(A1,6,COLUMN() - 1,ROW() - 1-7,1))'} : ""}).slice(1, headers.length + 1)])
  worksheet.addRow(['Min', ...headers.map((header, i) => {return !((i+1) == 2 || (i + 1) % 5 == 0) ? { formula: '=MIN(OFFSET(A1,6,COLUMN() - 1,ROW() - 1-7,1))'} : ""}).slice(1, headers.length + 1)])
  worksheet.addRow(['Max', ...headers.map((header, i) => {return !((i+1) == 2 || (i + 1) % 5 == 0) ? { formula: '=MAX(OFFSET(A1,6,COLUMN() - 1,ROW() - 1-7,1))'} : ""}).slice(1, headers.length + 1)])
  worksheet.addConditionalFormatting({
	  ref: "A1:CA100",
	  rules: [
		{
		  type: "expression",
		  formulae: ['A1="Validée"'],
		  style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FF00FF00" } } },
		},
	  ],
	});
	worksheet.addConditionalFormatting({
	  ref: "A1:CA100",
	  rules: [
		{
		  type: "expression",
		  formulae: ['A1="Non Validée"'],
		  style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFF0000" } } },
		},
	  ],
	});
	console.log(worksheet.properties);
	worksheet.properties.outlineLevelCol = 0;
	worksheet.properties.outlineLevelRow = 0;
	worksheet.outlineLevel = 0;
	worksheet.outlineLevelCol = 0;
	return worksheet
}

async function createExcelFileFromSession(session) {
  let workbook = new ExcelJS.Workbook();
  workbook.creator = "DORA";
  workbook.lastModifiedBy = "DORA";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastPrinted = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;
  createWorksheetFromSession(workbook, session)
  return await workbook.xlsx.writeBuffer();
}

async function createExcelFileFromClass(sessions) {
	let workbook = new ExcelJS.Workbook();
	workbook.creator = "DORA";
	workbook.lastModifiedBy = "DORA";
	workbook.created = new Date();
	workbook.modified = new Date();
	workbook.lastPrinted = new Date();
	workbook.calcProperties.fullCalcOnLoad = true;
	sessions.forEach(session => {createWorksheetFromSession(workbook, session)})
	return await workbook.xlsx.writeBuffer()
}

router.get("/session/:session_id", async (req, res) => {
  const client = await mongodb.MongoClient.connect("mongodb://localhost:27017/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const sessions = await client.db("orienteering-race-project").collection("sessions");
  const session = await sessions.findOne({ _id: mongodb.ObjectID(req.params.session_id) });
  const buffer = await createExcelFileFromSession(session);
  res.setHeader("Content-Type", "application/vnd.openxmlformats");
  res.setHeader("Content-Disposition", "attachment; filename=" + `résumé_${session.session_name.replace(/ /g, '_')}.xlsx`);
  res.end(Buffer.from(buffer, "base64"));
});

router.get("/class/:class_id", async (req, res) => {
	const client = await mongodb.MongoClient.connect("mongodb://localhost:27017/", {
	  useNewUrlParser: true,
	  useUnifiedTopology: true,
	});
	const collection = await client.db("orienteering-race-project").collection("sessions");
	const sessions = await (await collection.find({ class_id: mongodb.ObjectID(req.params.class_id) })).toArray();
	console.log('tessions',sessions[0])
	const buffer = await createExcelFileFromClass(sessions);
	res.setHeader("Content-Type", "application/vnd.openxmlformats");
	res.setHeader("Content-Disposition", "attachment; filename=" + `résumé_${sessions[0].class_name.replace(/ /g, '_')}.xlsx`);
	res.end(Buffer.from(buffer, "base64"));
  });
