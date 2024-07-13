require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MNG, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const ConferenceSchema = new mongoose.Schema({
  name: String,
  date: String,
  schedule: String,
  feedback: [String],
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  conferences: [{ type: mongoose.Schema.Types.ObjectId, ref: "Conference" }],
});

const Conference = mongoose.model("Conference", ConferenceSchema);
const User = mongoose.model("User", UserSchema);

app.get("/conferences", async (req, res) => {
  try {
    const conferences = await Conference.find().select("name date schedule feedback");
    res.json(conferences);
  } catch (err) {
    res.status(500).json({ message: "Error fetching conferences" });
  }
});

app.post("/register", async (req, res) => {
  const { name, email, conferenceId } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ name, email, conferences: [conferenceId] });
    } else {
      user.conferences.push(conferenceId);
    }
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error registering user" });
  }
});

app.post("/feedback", async (req, res) => {
  const { conferenceId, feedback } = req.body;
  try {
    const conference = await Conference.findById(conferenceId);
    if (!conference) {
      return res.status(404).json({ message: "Conference not found" });
    }
    conference.feedback.push(feedback);
    await conference.save();
    res.json(conference);
  } catch (err) {
    res.status(500).json({ message: "Error submitting feedback" });
  }
});

app.post("/conference", async (req, res) => {
  const { name, date, schedule } = req.body;
  try {
    const conference = new Conference({ name, date, schedule });
    await conference.save();
    res.json(conference);
  } catch (err) {
    res.status(500).json({ message: "Error creating conference" });
  }
});

// Admin routes
app.post("/admin/conference", async (req, res) => {
  const { name, date, schedule } = req.body;
  try {
    const conference = new Conference({ name, date, schedule });
    await conference.save();
    res.json(conference);
  } catch (err) {
    res.status(500).json({ message: "Error creating conference" });
  }
});

app.put("/admin/conference/:id", async (req, res) => {
  const { id } = req.params;
  const { name, date, schedule } = req.body;
  try {
    const conference = await Conference.findByIdAndUpdate(
      id,
      { name, date, schedule },
      { new: true }
    );
    if (!conference) {
      return res.status(404).json({ message: "Conference not found" });
    }
    res.json(conference);
  } catch (err) {
    res.status(500).json({ message: "Error updating conference" });
  }
});

app.delete("/admin/conference/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const conference = await Conference.findByIdAndDelete(id);
    if (!conference) {
      return res.status(404).json({ message: "Conference not found" });
    }
    res.json({ message: "Conference deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting conference" });
  }
});

app.get("/admin/registrations", async (req, res) => {
  try {
    const users = await User.find().populate("conferences");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching registrations" });
  }
});

app.delete("/admin/registration/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await User.findByIdAndDelete(id);
    res.json({ message: "Registration deleted" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting registration" });
  }
});

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
