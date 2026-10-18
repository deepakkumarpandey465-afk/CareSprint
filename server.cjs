
const express = require("express");
const Database = require("better-sqlite3");
const cors = require("cors");

const app = express();
const db = new Database("caresprint.db");

app.use(cors());
app.use(express.json());

db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    doctorId INTEGER NOT NULL,
    doctorName TEXT NOT NULL,
    specialty TEXT NOT NULL,
    fee INTEGER NOT NULL,
    eta TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

app.get("/api/bookings", (req, res) => {
  const bookings = db.prepare(
    "SELECT * FROM bookings ORDER BY createdAt DESC"
  ).all();

  res.json(bookings);
});

app.post("/api/bookings", (req, res) => {
  const b = req.body;

  const required = [
    "id", "doctorId", "doctorName", "specialty",
    "fee", "eta", "name", "phone", "address", "reason"
  ];

  if (!b || required.some((key) => b[key] === undefined || b[key] === null || String(b[key]).trim() === "")) {
    return res.status(400).json({ error: "Required booking details missing." });
  }

  if (!Number.isInteger(Number(b.doctorId)) || !Number.isFinite(Number(b.fee))) {
    return res.status(400).json({ error: "Invalid doctor or fee details." });
  }

  try {
    db.prepare(`
      INSERT INTO bookings
      (id, doctorId, doctorName, specialty, fee, eta,
       name, phone, address, reason, status)
      VALUES
      (@id, @doctorId, @doctorName, @specialty, @fee, @eta,
       @name, @phone, @address, @reason, 'pending')
    `).run(b);

    const saved = db.prepare(
      "SELECT * FROM bookings WHERE id = ?"
    ).get(b.id);

    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: "Could not save booking." });
  }
});

app.patch("/api/bookings/:id/status", (req, res) => {
  const { status } = req.body;
  const allowed = ["pending", "accepted", "declined", "completed"];

  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "Invalid booking status." });
  }

  const bookingId = String(req.params.id || "").trim();
  const result = db.prepare(
    "UPDATE bookings SET status = ? WHERE id = ?"
  ).run(status, bookingId);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Booking not found." });
  }

  const updated = db.prepare(
    "SELECT * FROM bookings WHERE id = ?"
  ).get(bookingId);

  res.json(updated);
});
// Cancel a booking without deleting it
app.patch("/api/bookings/:id/cancel", (req, res) => {
  // Booking IDs are strings (for example, CS-123456789), not numbers.
  const id = String(req.params.id || "").trim();

  if (!id) {
    return res.status(400).json({ error: "Invalid booking ID" });
  }

  const booking = db
    .prepare("SELECT id, status FROM bookings WHERE id = ?")
    .get(id);

  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  if (["completed", "declined", "cancelled"].includes(booking.status)) {
    return res.status(400).json({ error: "This booking cannot be cancelled" });
  }

  db.prepare("UPDATE bookings SET status = ? WHERE id = ?")
    .run("cancelled", id);

  const updatedBooking = db
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(id);

  return res.json(updatedBooking);
});

app.listen(3001, () => {
  console.log("CareSprint API running at http://localhost:3001");
});
