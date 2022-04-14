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
  console.log('\x1b[32m%s\x1b[0m', `[INFO] Server started. Listening on port ${port}`)
  console.log(`[INFO] Loading data...`)
  loadSwitches()
  console.log(`[INFO] Loading switches...`)
  loadData()
})

app.get('/devices/:serial', async (req, res) => {
  console.log(`[GET] /devices/${req.params.serial}`)
  await sleep(1000);
  const data = await getDevicesBySerial(req.params.serial)
  res.send(transformClientsRespose(data))
})

/**
 * API Endpoints
 */

app.get('/racks/:pod', async (req, res) => {
  console.log(`[GET] /racks/${req.params.pod}`)
  const racks = await getRacksByPod(req.params.pod)
  res.send(racks)
})

/**
 * Functions
 */

async function loadData() {
  uData = await csv().fromFile(dataCsvFilePath)
  console.log(`[INFO] Data loaded. Length: ${uData.length}`)
}

async function loadSwitches() {
  uSwitches = await csv().fromFile(switchesCsvFilePath)
  console.log(`[INFO] Switches loaded. Length: ${uSwitches.length}`)
}

async function getRacksByPod(pod) {
  const found = uSwitches.filter(item => item.pod==pod)
  // Limit to 1 item
  // return found.splice(0, 1)
  return found
}

async function getDevicesBySerial(serial) {
  const response = await axios.get(`https://api.meraki.com/api/v0/devices/${serial}/clients?timespan=86400`, { headers: { 'X-Cisco-Meraki-API-Key': ciscoMerakiApiKey }})
  return response.data
}

function transformClientsRespose(data) {
  data.forEach(element => {
    const found = uData.find(item => item.mac_address==element.mac)
    foundSplit = found.location.split('-')
    element.location = { pod: foundSplit[2], shelf: foundSplit[3], slot: foundSplit[4] }
    element.code = found.code
    element.port = found.port
  });
  return data
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}