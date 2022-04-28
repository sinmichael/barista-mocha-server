const axios = require('axios').default
const csv = require('csvtojson')
const express = require('express')

const app = express()
const port = 3001

const ciscoMerakiApiKey = 'b32b2c72e4b60b8153b9fedee7028ee9d4b234dd'
const switchesCsvFilePath = './csv/switches.csv'
const dataCsvFilePath = './csv/data.csv'

let uData = []
let uSwitches = []

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.listen(port, () => {
  console.log('\x1b[36m%s\x1b[0m', `[INFO] Barista Mocha Server 🐧`)
  console.log('\x1b[36m%s\x1b[0m', `[INFO] Server started. Listening on port ${port}`)
  console.log('\x1b[36m%s\x1b[0m', `[INFO] Loading data...`)
  loadSwitches()
  console.log('\x1b[36m%s\x1b[0m', `[INFO] Loading switches...`)
  loadData()
})

/**
 * API Endpoints
 */

app.get('/devices/:serial', async (req, res) => {
  console.log('\x1b[32m%s\x1b[0m', `[GET] /devices/${req.params.serial}`)
  await sleep(1000);
  const data = await getDevicesBySerial(req.params.serial)
  res.send(transformClientsRespose(data))
})

app.get('/racks/:pod', async (req, res) => {
  console.log('\x1b[32m%s\x1b[0m', `[GET] /racks/${req.params.pod}`)
  const racks = await getRacksByPod(req.params.pod)
  res.send(racks)
})

/**
 * Functions
 */

async function loadData() {
  uData = await csv().fromFile(dataCsvFilePath)
  console.log('\x1b[36m%s\x1b[0m', `[INFO] Data loaded. Length: ${uData.length}`)
}

async function loadSwitches() {
  uSwitches = await csv().fromFile(switchesCsvFilePath)
  console.log('\x1b[36m%s\x1b[0m', `[INFO] Switches loaded. Length: ${uSwitches.length}`)
}

async function getRacksByPod(pod) {
  const found = uSwitches.filter(item => item.pod==pod)
  // Limit to 1 item
  // return found.splice(0, 1)
  return found
}

async function getDevicesBySerial(serial) {
  try {
    const response = await axios.get(`https://api.meraki.com/api/v0/devices/${serial}/clients?timespan=86400`, { headers: { 'X-Cisco-Meraki-API-Key': ciscoMerakiApiKey }})
    return response.data
  } catch(error) {
    console.log(error)
  }
}

function transformClientsRespose(data) {
  data.forEach(element => {
    const found = uData.find(item => item.mac_address==element.mac)
    // foundSplit = found.location.split('-')
    // element.location = { pod: foundSplit[2], shelf: foundSplit[3], slot: foundSplit[4] }
    if (found) {
      element.code = found.code
      element.port = found.port
    } else {
      console.log('\x1b[33m%s\x1b[0m', `[WARN] Device with MAC address ${element.mac} not found. Please check data.csv`)
      element.code = 'N/A'
      element.port = 'N/A'
    }
  });
  return data
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}