const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = process.env.SECRET || "devsecret";

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);

// Models
const User = mongoose.model("User", {
  username: String,
  password: String,
});

const Timesheet = mongoose.model("Timesheet", {
  userId: String,
  date: String,
  hours: Number,
  notes: String,
});

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    res.sendStatus(403);
  }
}

// Routes
app.get("/", (req, res) => {
  res.send("Timesheet API running");
});

app.post("/register", async (req, res) => {
  const hashed = await bcrypt.hash(req.body.password, 10);
  const user = new User({ username: req.body.username, password: hashed });
  await user.save();
  res.send("User created");
});

app.post("/login", async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user) return res.status(400).send("User not found");

  const valid = await bcrypt.compare(req.body.password, user.password);
  if (!valid) return res.status(400).send("Invalid password");

  const token = jwt.sign({ id: user._id }, SECRET);
  res.json({ token });
});

app.post("/timesheets", auth, async (req, res) => {
  const ts = new Timesheet({
    userId: req.user.id,
    date: req.body.date,
    hours: req.body.hours,
    notes: req.body.notes,
  });
  await ts.save();
  res.send("Saved");
});

app.get("/timesheets", auth, async (req, res) => {
  const data = await Timesheet.find({ userId: req.user.id });
  res.json(data);
});

app.listen(3000, () => console.log("Server running on port 3000"));
