const fs = require("fs");
var events_json = JSON.parse(fs.readFileSync("../data/events.json"))
function inverf(x) {
    var z;
    var a = 0.147;
    var the_sign_of_x;
    if (0 == x) {
        the_sign_of_x = 0;
    } else if (x > 0) {
        the_sign_of_x = 1;
    } else {
        the_sign_of_x = -1;
    }
    if (0 != x) {
        var ln_1minus_x_sqrd = Math.log(1 - x * x);
        var ln_1minusxx_by_a = ln_1minus_x_sqrd / a;
        var ln_1minusxx_by_2 = ln_1minus_x_sqrd / 2;
        var ln_etc_by2_plus2 = ln_1minusxx_by_2 + (2 / (Math.PI * a));
        var first_sqrt = Math.sqrt((ln_etc_by2_plus2 * ln_etc_by2_plus2) - ln_1minusxx_by_a);
        var second_sqrt = Math.sqrt(first_sqrt - ln_etc_by2_plus2);
        z = second_sqrt * the_sign_of_x;
    } else { // x is zero
        z = 0;
    }
    return z;
}
function rankPnts(team, event) {
    var alpha = 1.07
    var rank = events_json[event].rankings[team].rank
    var teams = Object.keys(events_json[event].rankings).length
    var qual_points = (Math.ceil(inverf((teams - 2 * rank + 2) / (alpha * teams)) * (10.0 / inverf(1.0 / alpha)) + 12))
    return qual_points;
}
// Award Points Calculation, done for 2018 season rules.
var normAwards = {
    0: 60,	//Chairman's
    9: 45,	//EI
    10: 25,	//RAS
    15: 15,	//RI
    3: 10,	//WFFA
    2: 0,	//Event finalist
    //Engineering Quintifecta, who cares which is which.
    29: 20,
    21: 20,
    29: 20,
    20: 20,
    16: 20,
    2: 0	//Event finalist
}
var cmpAwards = {
    0: 110,	//CCA
    69: 90,	//CCAF
    9: 60,	//EI
    10: 35,	//RAS
    15: 20,	//RI
    3: 30,	//WFA
    //Engineering Quintifecta
    29: 30,
    21: 30,
    29: 30,
    20: 30,
    16: 30
}
//Award ports, be sure to update for the 2019 SLFF season.
function awardPnts(team, event) {
    var points = 0;
    var ranks = events_json[event].rankings[team]
    var awards = ranks.awards;
    if (!awards) console.log(team + "," + event)
    var eventType = events_json[event].event_type
    var cmpTypes = [3, 4]; //These were taken from TBA sourcecode.  https://github.com/the-blue-alliance/the-blue-alliance/blob/master/consts/event_type.py#L2
    var rookieAwardIds = [10, 14, 15];
    for (i = 0; i < awards.length; i++) {
        if (cmpTypes.includes(eventType)) {
            if (awards[i] in cmpAwards) {
                points += (cmpAwards[awards[i]]);
            } else {
                points += 10; //All other awards are 10 at CMP.
            }
        };
        if (![99, 100, -1].includes(eventType)) {
            if (awards[i] in normAwards) {
                points += (normAwards[awards[i]]);
            } else {
                points += 5; //All other awards are 5 according to rules.
            }
        }
    }
    return points;
}
//Return playoff points.
function playoffPnts(team, event) {
    var matches = events_json[event].rankings[team].matches;
    var points = 0;
    for (i = 0; i < matches.length; i++) {
        if (matches[i].indexOf("qm") == -1) {
            var match = events_json[event].matches[matches[i]]
            if (match[match.winner].includes(team)) points += 5;
        }
    }
    return points;
}
function alliancePnts(team, event) {
    if (events_json[event].rankings[team].alliance) {
        if ([0, 1].includes(events_json[event].rankings[team].pick))
            return (17 - events_json[event].rankings[team].alliance);
        return (17 - 8 - (9 - events_json[event].rankings[team].alliance));
    }
    return 0;
}
function calculate(team, event) {
    a = alliancePnts(team, event);
    b = playoffPnts(team, event);
    c = awardPnts(team, event);
    d = rankPnts(team, event);
    return a + b + c + d
}
for (event in events_json) {
    for (team in events_json[event].rankings) {
        events_json[event].rankings[team].score = calculate(team, event);
    }
}