const fs = require("fs")
var events = JSON.parse(fs.readFileSync("../data/events.json"))
var teams = {};
for (event in events) {
    for (team in events[event].rankings) {
        if (!teams[team]) teams[team] = {};
        teams[team][event] = events[event].rankings[team].score
    }
}
fs.writeFileSync("../data/teams.json", JSON.stringify(teams))