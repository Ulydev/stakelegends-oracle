const serverless = require("serverless-http")
const express = require("express")
const app = express()

// Username validation

const PSN = require("pxs-psn-api")
const psn = new PSN({})
const npsso = process.env.NPSSO

app.get("/validate", async function (req, res) {
    const address = req.query.address
    const username = req.query.username

    await psn.auth(npsso)
    const profile = await psn.getProfile(username)
    const valid = profile.aboutMe.includes(address)

    res.json({ valid: valid })
})

// Leaderboard

const apexKey = process.env.APEX_KEY

app.get("/rank", async function (req, res) {

    const web3 = new Web3(new Web3.providers.HttpProvider(`https://${process.env.NETWORK}.infura.io/v3/${process.env.INFURA_PROJECT_ID}`))
    const Contract = web3.eth.contract(require("./SeasonStaking.json").abi)
    const contract = Contract.at(process.env.CONTRACT_ADDRESS)

    const username = req.query.username

    const players = await contract.usernamesByAddress()

    const response = await fetch(`https://api.mozambiquehe.re/bridge?version=4&platform=PS4&player=${ players.join(",") }&auth=${ apexKey }`)
    const json = await response.json()

    const rankedPlayers = json.map(p => {
        try { 
            return { name: p["global"]["name"], rank: p["global"]["rank"]["rankScore"] }
        } catch (e) {
            return { name: p["global"]["name"], rank: -1 } // assume lowest possible rank
        }
    }).sort((p1, p2) => p2.rank - p1.rank).map(p => p.name)

    return rankedPlayers.indexOf(username)
})

module.exports.handler = serverless(app);