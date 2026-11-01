const express = require("express");

const Database = require("better-sqlite3");



const app = express();

const db = new Database("internships.db");



app.use(express.json());



// Create database table

db.exec(`

&#x20; CREATE TABLE IF NOT EXISTS internships (

&#x20;   id TEXT PRIMARY KEY,

&#x20;   title TEXT NOT NULL,

&#x20;   category TEXT NOT NULL,

&#x20;   location TEXT NOT NULL,

&#x20;   mode TEXT NOT NULL,

&#x20;   skills TEXT NOT NULL,

&#x20;   openings INTEGER NOT NULL

&#x20; )

`);



// Add sample internship records

const samples = \[

&#x20; \["INT-101", "Frontend Intern", "Full Stack Development", "India", "Remote", "HTML,CSS,JavaScript", 3],

&#x20; \["INT-102", "API Engineering Intern", "Full Stack Development", "India", "Hybrid", "Node.js,SQL,Testing", 2],

&#x20; \["INT-103", "UI/UX Intern", "UI/UX", "India", "Remote", "Figma,Research,Accessibility", 1],

&#x20; \["INT-104", "Data Analyst Intern", "Data Analytics", "Bengaluru", "On-site", "Excel,SQL,Data Visualization", 2],

&#x20; \["INT-105", "Security Operations Intern", "Cyber Security", "India", "Remote", "Linux,Logs,Networking", 1]

];



const insert = db.prepare(`

&#x20; INSERT OR IGNORE INTO internships

&#x20; VALUES (?, ?, ?, ?, ?, ?, ?)

`);



for (const record of samples) {

&#x20; insert.run(...record);

}



// List internships with pagination

app.get("/api/internships", (req, res) => {

&#x20; const page = Math.max(1, parseInt(req.query.page) || 1);

&#x20; const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

&#x20; const offset = (page - 1) \* limit;



&#x20; const data = db.prepare(

&#x20;   "SELECT \* FROM internships LIMIT ? OFFSET ?"

&#x20; ).all(limit, offset);



&#x20; const total = db.prepare(

&#x20;   "SELECT COUNT(\*) AS count FROM internships"

&#x20; ).get().count;



&#x20; res.json({

&#x20;   status: "success",

&#x20;   data,

&#x20;   pagination: { page, limit, total }

&#x20; });

});



// Get one internship

app.get("/api/internships/:id", (req, res) => {

&#x20; const item = db.prepare(

&#x20;   "SELECT \* FROM internships WHERE id = ?"

&#x20; ).get(req.params.id);



&#x20; if (!item) {

&#x20;   return res.status(404).json({

&#x20;     status: "error",

&#x20;     message: "Internship not found"

&#x20;   });

&#x20; }



&#x20; res.json({ status: "success", data: item });

});



// Create internship

app.post("/api/internships", (req, res) => {

&#x20; const { id, title, category, location, mode, skills, openings } = req.body;



&#x20; if (

&#x20;   !id || !title || !category || !location || !mode ||

&#x20;   !Array.isArray(skills) || skills.length === 0 ||

&#x20;   !Number.isInteger(openings) || openings < 1

&#x20; ) {

&#x20;   return res.status(400).json({

&#x20;     status: "error",

&#x20;     message: "Please provide valid internship details"

&#x20;   });

&#x20; }



&#x20; try {

&#x20;   db.prepare(`

&#x20;     INSERT INTO internships VALUES (?, ?, ?, ?, ?, ?, ?)

&#x20;   `).run(id, title, category, location, mode, skills.join(","), openings);



&#x20;   res.status(201).json({

&#x20;     status: "success",

&#x20;     message: "Internship created",

&#x20;     data: { id }

&#x20;   });

&#x20; } catch (error) {

&#x20;   res.status(409).json({

&#x20;     status: "error",

&#x20;     message: "Internship ID already exists"

&#x20;   });

&#x20; }

});



// Update internship

app.put("/api/internships/:id", (req, res) => {

&#x20; const { title, category, location, mode, skills, openings } = req.body;



&#x20; if (

&#x20;   !title || !category || !location || !mode ||

&#x20;   !Array.isArray(skills) || skills.length === 0 ||

&#x20;   !Number.isInteger(openings) || openings < 1

&#x20; ) {

&#x20;   return res.status(400).json({

&#x20;     status: "error",

&#x20;     message: "Please provide valid internship details"

&#x20;   });

&#x20; }



&#x20; const result = db.prepare(`

&#x20;   UPDATE internships

&#x20;   SET title = ?, category = ?, location = ?, mode = ?,

&#x20;       skills = ?, openings = ?

&#x20;   WHERE id = ?

&#x20; `).run(title, category, location, mode, skills.join(","), openings, req.params.id);



&#x20; if (result.changes === 0) {

&#x20;   return res.status(404).json({

&#x20;     status: "error",

&#x20;     message: "Internship not found"

&#x20;   });

&#x20; }



&#x20; res.json({ status: "success", message: "Internship updated" });

});



// Delete internship

app.delete("/api/internships/:id", (req, res) => {

&#x20; const result = db.prepare(

&#x20;   "DELETE FROM internships WHERE id = ?"

&#x20; ).run(req.params.id);



&#x20; if (result.changes === 0) {

&#x20;   return res.status(404).json({

&#x20;     status: "error",

&#x20;     message: "Internship not found"

&#x20;   });

&#x20; }



&#x20; res.json({ status: "success", message: "Internship deleted" });

});



// Start server

const PORT = 3000;

app.listen(PORT, () => {

&#x20; console.log(`Server running at http://localhost:${PORT}`);

});

