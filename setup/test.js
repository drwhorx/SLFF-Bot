const fs = require("fs");
var start = new Date();
var events = JSON.parse(fs.readFileSync("../data/events.json"))
var sims = JSON.parse(fs.readFileSync("../data/data.json"));
console.log(`Took ${new Date() - start} ms to load files`)
start = new Date();
const BOUND = 2.5;
///*
for (LOWER = 0; LOWER <= 85; LOWER += BOUND) {
    var found = []
    var guess = LOWER + (BOUND / 2);
    for (i = 0; i < sims.length; i++) {
        var score = sims[i].situation.team
        var year = sims[i].year;
        if (score >= LOWER && score <= LOWER + BOUND && year == "2019") found.push(sims[i])
    }
    var results = found.map(item => item.result.team)
    if (results.length == 0) {
        console.log(guess + "\t0\t0");
        continue
    }
    var avg = results.reduce((a, b) => a + b) / results.length
    var accuracy = (guess - Math.abs(guess - avg)) / guess
    if (accuracy < 0) accuracy = 0;
    if (guess < 8.75) accuracy = avg;
    console.log(guess + "\t" + Math.round(accuracy * 1000) / 1000 + "\t" + results.length);
}
//*/
/*
for (i = 0; i < sims.length; i++) {
    console.log({
        team: sims[i].situation.team,
        top: sims[i].situation.opponents.top,
        middle: sims[i].situation.opponents.middle,
        bottom: sims[i].situation.opponents.bottom
    })
}
*/
console.log(`Took ${new Date() - start} ms since loading files`)