const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Your files are in the ROOT folder
app.use(express.static(__dirname));
app.use(express.json());

// Demo temperature data
function demo(location) {
  const data = {
    "Vijayawada, India": [36, 43, 61, 91, 16.5062, 80.648],
    "Hyderabad, India": [34, 39, 58, 78, 17.385, 78.4867],
    "Phoenix, AZ": [112, 118, 18, 96, 33.4484, -112.074],
    "London, UK": [24, 25, 55, 29, 51.5074, -0.1278]
  };

  const a = data[location] || [31, 35, 52, 55, 17.385, 78.4867];

  return {
    location,
    temp: a[0],
    feels: a[1],
    humidity: a[2],
    score: a[3],
    lat: a[4],
    lon: a[5]
  };
}

// Heat-risk calculation
function risk(temp, humidity) {
  const apparent = temp + (humidity - 50) * 0.04;

  let riskLevel = "LOW";

  if (apparent >= 42) {
    riskLevel = "EXTREME";
  } else if (apparent >= 35) {
    riskLevel = "HIGH";
  } else if (apparent >= 30) {
    riskLevel = "MODERATE";
  }

  return {
    risk: riskLevel,
    score: Math.min(100, Math.round((apparent / 45) * 100))
  };
}

// Analyze location
app.post("/api/analyze", (req, res) => {
  const location =
    (req.body.location || "Vijayawada, India").trim();

  const d = demo(location);
  const r = risk(d.temp, d.humidity);

  let advice;

  if (r.risk === "EXTREME") {
    advice = [
      "Avoid prolonged outdoor activity",
      "Hydrate frequently and seek shade",
      "Move outdoor work to cooler hours",
      "Check on children and older adults"
    ];
  } else if (r.risk === "HIGH") {
    advice = [
      "Take regular shade breaks",
      "Carry water",
      "Prefer early morning or evening activity",
      "Watch for heat-stress symptoms"
    ];
  } else {
    advice = [
      "Keep water available",
      "Use shade during peak heat",
      "Normal outdoor activity is generally reasonable"
    ];
  }

  res.json({
    location: d.location,
    temperature_c: d.temp,
    apparent_temperature_c: d.feels,
    humidity: d.humidity,
    risk: r.risk,
    score: r.score,
    coordinates: {
      lat: d.lat,
      lon: d.lon
    },
    source: process.env.FORTYGUARD_API_KEY
      ? "fortyguard-ready"
      : "demo",
    advice,
    plus2: risk(d.temp + 2, d.humidity),
    plus5: risk(d.temp + 5, d.humidity),
    timestamp: new Date().toISOString()
  });
});

// Open the website
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`HeatShield AI running on port ${PORT}`);
});
