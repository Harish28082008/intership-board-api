const express = require("express");
const Database = require("better-sqlite3");

const app = express();
const db = new Database("internships.db");

app.use(express.json());

// Create database table
db.exec(`
  CREATE TABLE IF NOT EXISTS internships (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    mode TEXT NOT NULL,
    skills TEXT NOT NULL,
    openings INTEGER NOT NULL
  )
`);

// Add sample internship records
const samples = [
  ["INT-101", "Frontend Intern", "Full Stack Development", "India", "Remote", "HTML,CSS,JavaScript", 3],
  ["INT-102", "API Engineering Intern", "Full Stack Development", "India", "Hybrid", "Node.js,SQL,Testing", 2],
  ["INT-103", "UI/UX Intern", "UI/UX", "India", "Remote", "Figma,Research,Accessibility", 1],
  ["INT-104", "Data Analyst Intern", "Data Analytics", "Bengaluru", "On-site", "Excel,SQL,Data Visualization", 2],
  ["INT-105", "Security Operations Intern", "Cyber Security", "India", "Remote", "Linux,Logs,Networking", 1]
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO internships
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

for (const record of samples) {
  insert.run(...record);
}

// List internships with pagination
app.get("/api/internships", (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;

  const data = db.prepare(
    "SELECT * FROM internships LIMIT ? OFFSET ?"
  ).all(limit, offset);

  const total = db.prepare(
    "SELECT COUNT(*) AS count FROM internships"
  ).get().count;

  res.json({
    status: "success",
    data,
    pagination: { page, limit, total }
  });
});

// Get one internship
app.get("/api/internships/:id", (req, res) => {
  const item = db.prepare(
    "SELECT * FROM internships WHERE id = ?"
  ).get(req.params.id);

  if (!item) {
    return res.status(404).json({
      status: "error",
      message: "Internship not found"
    });
  }

  res.json({ status: "success", data: item });
});

// Create internship
app.post("/api/internships", (req, res) => {
  const { id, title, category, location, mode, skills, openings } = req.body;

  if (
    !id || !title || !category || !location || !mode ||
    !Array.isArray(skills) || skills.length === 0 ||
    !Number.isInteger(openings) || openings < 1
  ) {
    return res.status(400).json({
      status: "error",
      message: "Please provide valid internship details"
    });
  }

  try {
    db.prepare(`
      INSERT INTO internships VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, category, location, mode, skills.join(","), openings);

    res.status(201).json({
      status: "success",
      message: "Internship created",
      data: { id }
    });
  } catch (error) {
    res.status(409).json({
      status: "error",
      message: "Internship ID already exists"
    });
  }
});

// Update internship
app.put("/api/internships/:id", (req, res) => {
  const { title, category, location, mode, skills, openings } = req.body;

  if (
    !title || !category || !location || !mode ||
    !Array.isArray(skills) || skills.length === 0 ||
    !Number.isInteger(openings) || openings < 1
  ) {
    return res.status(400).json({
      status: "error",
      message: "Please provide valid internship details"
    });
  }

  const result = db.prepare(`
    UPDATE internships
    SET title = ?, category = ?, location = ?, mode = ?,
        skills = ?, openings = ?
    WHERE id = ?
  `).run(title, category, location, mode, skills.join(","), openings, req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({
      status: "error",
      message: "Internship not found"
    });
  }

  res.json({ status: "success", message: "Internship updated" });
});

// Delete internship
app.delete("/api/internships/:id", (req, res) => {
  const result = db.prepare(
    "DELETE FROM internships WHERE id = ?"
  ).run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({
      status: "error",
      message: "Internship not found"
    });
  }

  res.json({ status: "success", message: "Internship deleted" });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});