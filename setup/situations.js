const fs = require("fs")
const PERCENT = 0.2
var events = JSON.parse(fs.readFileSync("../data/events.json"))
var teams = JSON.parse(fs.readFileSync("../data/teams.json"))
var sims = [];
var exclude = ["2012", "2013"]
for (event in events) {
    if (exclude.map(e => event.indexOf(e)).filter(e => e > -1).length > 0) continue;
    var avgs = {}
    for (team in events[event].rankings) {
        var keys = Object.keys(teams[team])
        var vals = keys.filter(item => item.substring(0, 4) < event.substring(0, 4)).map(item => teams[team][item]);
        if (vals.length == 0) avgs[team] = 0;
        else avgs[team] = vals.reduce((a, b) => a + b) / vals.length;
    }
    for (team in events[event].rankings) {
        var avg = avgs[team];
        var opp_teams = Object.keys(avgs).filter(item => item != team)
        var opp_avgs = opp_teams.map(item => avgs[item]);
        var score = events[event].rankings[team].score;
        var opp_scores = opp_teams.map(item => events[event].rankings[item].score).sort((a, b) => b - a);
        var place = opp_scores.map(e => e <= score).indexOf(true)
        var sorted = opp_avgs.sort((a, b) => b - a);
        var round = Math.round(sorted.length * PERCENT)
        var top = sorted.slice(0, round);
        var middle = sorted.slice(round, sorted.length - round);
        var bottom = sorted.slice(sorted.length - round, sorted.length);
        sims.push({
            year: event.substring(0, 4),
            situation: {
                team: avg,
                opponents: {
                    top: top.reduce((a, b) => a + b) / top.length,
                    middle: middle.reduce((a, b) => a + b) / middle.length,
                    bottom: bottom.reduce((a, b) => a + b) / bottom.length,
                }
            },
            result: {
                team: events[event].rankings[team].score,
                opponents: opp_scores,
                place: place + 1
            }
        })
    }
}
fs.writeFileSync("../data/data.json", JSON.stringify(sims))