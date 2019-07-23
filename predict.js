const fs = require("fs")
const events = JSON.parse(fs.readFileSync("data/events.json"));
const teams = JSON.parse(fs.readFileSync("data/teams.json"));
const sims = JSON.parse(fs.readFileSync("data/data.json"));
const TEAM_BOUND = 2;
const MIDDLE_BOUND = 1;
const TOP_BOUND = 2;
const BOTTOM_BOUND = 2;
const PERCENT = 0.2;
const MINIMUM = 25;
const MAXIMUM = 80;
function avgBeforeYear(team, year) {
    if (year == undefined) year = "2020";
    var keys = Object.keys(teams[team])
    var vals = keys.filter(item => item.substring(0, 4) < year).map(item => teams[team][item]);
    if (vals.length == 0) return 0;
    return vals.reduce((a, b) => a + b) / vals.length;
}
function findSimilar(situation) {
    var team = situation.team
    var top = situation.opponents.top
    var middle = situation.opponents.middle
    var bottom = situation.opponents.bottom
    var recur = (teamBound, topBound, midBound, bottomBound) => {
        var found = sims.filter(sim => {
            return Math.abs(sim.situation.team - team) <= teamBound
                && Math.abs(sim.situation.opponents.top - top) <= topBound
                && Math.abs(sim.situation.opponents.middle - middle) <= midBound
                && Math.abs(sim.situation.opponents.bottom - bottom) <= bottomBound
        })
        if (found.length <= 7) return recur(teamBound + 0.25, topBound + 0.25, midBound + 0.1, bottomBound + 0.25);
        return found;
    }
    var found = recur(TEAM_BOUND, TOP_BOUND, MIDDLE_BOUND, BOTTOM_BOUND);
    return found;
}
function calculate() {

}
function predsFromList(teams, year) {
    if (year == undefined) year = "2020";
    var avgs = {};
    var predictions = {};
    for (t = 0; t < teams.length; t++) {
        avgs[teams[t]] = avgBeforeYear(teams[t], year);
    }
    for (t = 0; t < teams.length; t++) {
        var team = teams[t];
        var opps = teams.filter(item => item != team);
        var opp_avgs = opps.map(e => avgs[e]);
        var sorted = opp_avgs.sort((a, b) => b - a);
        var round = Math.round(sorted.length * PERCENT)
        var top = sorted.slice(0, round);
        var middle = sorted.slice(round, sorted.length - round);
        var bottom = sorted.slice(sorted.length - round, sorted.length);
        var situation = {
            team: avgs[team],
            opponents: {
                top: top.reduce((a, b) => a + b) / top.length,
                middle: middle.reduce((a, b) => a + b) / middle.length,
                bottom: bottom.reduce((a, b) => a + b) / bottom.length,
            }
        }
        var similar = findSimilar(situation);
        var scores = similar.map(item => item.result.team)
        predictions[team] = scores.reduce((a, b) => a + b) / scores.length
    }
    return avgs
}
var test = Object.keys(events["2019azpx"].rankings)
var preds = predsFromList(test, "2019")
for (i = 0; i < test.length; i++) {
    console.log(test[i] + ", Pred: " + preds[test[i]] + ", Act: " + events["2019azpx"].rankings[test[i]].score)
}