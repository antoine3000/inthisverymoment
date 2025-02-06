let deviceId = 18451;
let sensorData = [];
let today = new Date().toISOString(); // Current timestamp
let then = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
let sensorList = [193, 196, 194, 195]

function setup() {
  createCanvas(windowWidth, windowHeight);
  fetchSensorList();
}

function fetchSensorList() {
  let url = `https://api.smartcitizen.me/v0/devices/${deviceId}`;
  
  fetch(url)
    .then(response => response.json())
    .then(data => {
      sensorList.forEach((sensor, i) => {
        let sensorUrl = `https://api.smartcitizen.me/v0/devices/${deviceId}/readings?sensor_id=${sensor.id}&rollup=1h&from=${then}&to=${today}`;
        
        fetch(sensorUrl)
          .then(response => response.json())
          .then(readings => {
            sensorData.push({ name: sensor.name, values: readings.readings });
          })
          .catch(error => console.error("Error fetching sensor readings:", error));
      });
    })
    .catch(error => console.error("Error fetching device data:", error));
}

function draw() {
  background(0);
  fill(255);
  textSize(14);
  
  
  if (sensorData.length > 0) {
    let y = 30;
    for (let sensor of sensorData) {
      console.log(sensor);
      text(sensor.name + ": " + (sensor.values.length ? sensor.values[0][1] : "No data"), 20, y);
      y += 20;
    }
  } else {
    text("Loading sensor data...", 20, 30);
  }
}