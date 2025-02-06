let deviceId = 18451;
let sensorList = [
  { id: 193, type: 'pm1.0' },
  { id: 196, type: 'pm10.0' },
  { id: 194, type: 'pm2.5' },
  { id: 195, type: 'pm4.0' },
  { id: 55, type: 'temperature' },
  { id: 53, type: 'sound' }
];
let appreciations = {
  airQuality: ['good', 'not that nice', 'quite bad'],
  temperature: ['pleasant', 'too hot', 'too cold'],
  sound: ['quiet', 'a little noisy', 'too noisy'],
  overall: ['enjoy', 'am ok', 'would avoid']
}
let sensorData = [];
let today = new Date().toISOString();
let then = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
let lastUpdateTime = 0;

let airQuality, temperature, soundLevel;
let airQualityAppreciation, temperatureAppreciation, soundAppreciation, appreciation;
let totalScore;

let bgColor, fontColor, targetBgColor, targetFontColor;

function setup() {
  bgColor = color('#fffff3');
  fontColor = color('#3f3f3f');
  createCanvas(windowWidth, windowHeight);
  fetchSensorList();
  textAlign(CENTER, CENTER);
  textSize(20);
  updateLastUpdateTime();
  background(bgColor);
  fill(fontColor);
}



function fetchSensorList() {
  let url = `https://api.smartcitizen.me/v0/devices/${deviceId}`;
  
  fetch(url)
    .then(response => response.json())
    .then(data => {
      let fetchPromises = sensorList.map(sensor => fetchSensorData(sensor));
      
      Promise.all(fetchPromises)
        .then(() => {
          airQuality = calculatePMaverage();
          airQualityAppreciation = getAirQualityAppreciation(airQuality);

          appreciation = getOverallAppreciation(airQualityAppreciation, temperatureAppreciation, soundAppreciation);
          redraw();
        });
    })
    .catch(error => console.error("Error fetching device data:", error));
}

function fetchSensorData(sensor) {
  let sensorUrl = `https://api.smartcitizen.me/v0/devices/${deviceId}/readings?sensor_id=${sensor.id}&rollup=1h&from=${then}&to=${today}`;
  
  return fetch(sensorUrl)
    .then(response => response.json())
    .then(readings => {
      sensorData.push({ id: sensor.id, type: sensor.type, values: readings.readings });
      
      // Check if readings and the specific value are available before using it
      let value = readings.readings && readings.readings[0] && readings.readings[0][1] !== undefined 
                  ? readings.readings[0][1] 
                  : 0; // Default value is 0 if not available

      switch (sensor.type) {
        case 'pm': // Air Quality (PM)
          // Collect all PM sensor readings in the sensorData array
          break;
        case 'temperature':
          temperature = value;
          temperatureAppreciation = getTemperatureAppreciation(temperature);
          break;
        case 'sound':
          soundLevel = value;
          soundAppreciation = getSoundAppreciation(soundLevel);
          break;
      }
    })
    .catch(error => console.error(`Error fetching sensor ${sensor.id} readings:`, error));
}

function calculatePMaverage() {
  let pmSensors = sensorData.filter(sensor => sensor.type.startsWith('pm'));
  
  // Filter out invalid or undefined readings for each sensor
  let pmValues = pmSensors.map(sensor => {
    // Check if readings and values exist, then extract the value, or return 0 if not valid
    return (sensor.values && sensor.values[0] && sensor.values[0][1] !== undefined) 
           ? sensor.values[0][1] 
           : 0;  // Default value is 0 if not available
  });

  // Calculate the sum of PM values and divide by the number of PM sensors to get the average
  let sum = pmValues.reduce((total, value) => total + value, 0);
  let average = pmValues.length > 0 ? sum / pmValues.length : 0; // Prevent division by 0

  return average;
}

function getAirQualityAppreciation(value) {
  if (value == 0) {
    return '...';
  }
  if (value < 25) {
    return appreciations.airQuality[0];
  } else if (value < 50) {
    return appreciations.airQuality[1];
  } else {
    return appreciations.airQuality[2];
  }
}

function getTemperatureAppreciation(value) {
  if (value == 0) {
    return '...';
  }
  if (value >= 18 && value <= 24) {
    return appreciations.temperature[0];
  } else if (value > 24) {
    return appreciations.temperature[1];
  } else {
    return appreciations.temperature[2];
  }
}

function getSoundAppreciation(value) {
  if (value == 0) {
    return '...';
  }
  if (value < 40) {
    return appreciations.sound[0];
  } else if (value < 60) {
    return appreciations.sound[1];
  } else {
    return appreciations.sound[2];
  }
}

function getOverallAppreciation(air, temp, sound) {
  // If all values are '...', return '...'
  if (air === '...' && temp === '...' && sound === '...') {
    return '...';
  }

  // Get the index directly from the appreciations arrays
  let airRating = appreciations.airQuality.indexOf(air);
  let tempRating = appreciations.temperature.indexOf(temp);
  let soundRating = appreciations.sound.indexOf(sound);

  // If any of the ratings are -1 (meaning no match), set them to 0 (assume 'good', 'pleasant', 'quiet')
  airRating = airRating === -1 ? 0 : airRating;
  tempRating = tempRating === -1 ? 0 : tempRating;
  soundRating = soundRating === -1 ? 0 : soundRating;

  // Calculate the total score (sum of points)
  totalScore = airRating + tempRating + soundRating;

  // Based on the total score, return an overall rating
  if (totalScore <= 2) {
    return appreciations.overall[0];  // "enjoy"
  } else if (totalScore <= 4) {
    return appreciations.overall[1];  // "am ok"
  } else {
    return appreciations.overall[2];  // "would avoid"
  }
}

function draw() {
  if (totalScore === undefined) {
    targetBgColor = color('#fffff3');
    targetFontColor = color('#3f3f3f');
  } else if (totalScore <= 2) { 
    targetBgColor = color('#a0cc94');
    targetFontColor = color('#3f3f3f');
  } else if (totalScore <= 4) { 
    targetBgColor = color('#B5B5A6');
    targetFontColor = color('#fffff3');
  } else { 
    targetBgColor = color('#d88163');
    targetFontColor = color('#fffff3');
  }

  bgColor = lerpColor(bgColor, targetBgColor, 0.05);
  fontColor = lerpColor(fontColor, targetFontColor, 0.05);
  background(bgColor);
  fill(fontColor);

  let currentTime = millis();
  if (currentTime - lastUpdateTime > 10000) {
    lastUpdateTime = currentTime;
    updateLastUpdateTime();
    fetchSensorList();
  }

  textAlign(CENTER, TOP);
  textSize(11);

  text(lastUpdate, width / 2, 15);
  
  let sentence = `
    in this very moment,
    it is ${airQualityAppreciation || '...'} to breathe in,
    ${temperatureAppreciation || '...'} to be here,
    ${soundAppreciation || '...'} to the ears,
    i ${appreciation || '...'} being here.
  `;
  
  textAlign(CENTER, CENTER);
  textSize(27);
  text(sentence, width / 2, height / 2);

  let sensorValues = `
    Device ID: ${deviceId}
    Average Air Quality (PM): ${airQuality !== undefined ? airQuality.toFixed(2) : '...'} µg/m³
    Air temperature: ${temperature !== undefined ? temperature.toFixed(2) : '...'} °C
    Sound Level: ${soundLevel !== undefined ? soundLevel.toFixed(2) : '...'} dB
  `;
  
  textAlign(CENTER, BOTTOM);
  textSize(11);
  text(sensorValues, width / 2, height);
}

function updateLastUpdateTime() {
  lastUpdate = new Date().toLocaleString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
    hour: '2-digit', minute: '2-digit', second: '2-digit' 
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}