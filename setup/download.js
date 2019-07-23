const TBA = require("tba-api-storm");
const fs = require("fs");
const req = new TBA("wFLfqneHnQeMApDRSJnAvtS1egVMBQzXxn2E6vGW0DuGy3HhRYztR8tGJvbdBX0G");
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
(async () => {
    //well well well look who's commenting their code for once
    //years we'll be checking
    const YEARS = [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019];
    const EVENT_DIR = "../old_data/events/"
    const TEAM_DIR = "../old_data/teams/"
    //keep track of events we've already looked up so we don't make
    //8 billion api requests while im working this out
    var events_json = JSON.parse(fs.readFileSync("../data/events.json"))
    //for every year, get every event
    try {
        for (yr = 0; yr < YEARS.length; yr++) {
            var year = YEARS[yr]
            var events = fs.readdirSync(EVENT_DIR + year, { withFileTypes: true })
                .filter(f => f.isDirectory())
                .map(f => f.name)
            for (e = 0; e < events.length; e++) {
                var dir = EVENT_DIR + year + "/" + events[e] + "/"
                if (events_json[events[e]]) {
                    var teams = Object.keys(events_json[events[e]].rankings)
                    var quit = await new Promise(resolve => {
                        for (i = 0; i < teams.length; i++) {
                            if (events_json[events[e]].rankings[teams[i]].pick != undefined) {
                                resolve(true)
                            }
                        }
                        resolve(false)
                    })
                    if (quit) continue;
                    try {
                        var alliances = fs.readFileSync(dir + events[e] + "_alliances.csv", 'utf8').split("\r\n").map(e => e.split(",")).slice(0, -1)
                        for (i = 0; i < alliances.length; i++) {
                            for (p = 0; p < alliances[i].length; p++) {
                                events_json[events[e]].rankings[alliances[i][p]].alliance = (i + 1);
                                events_json[events[e]].rankings[alliances[i][p]].pick = p;
                            }
                        }
                    } catch (err) {
                        var alliances = await req.getEventAlliances(events[e]);
                        if (!alliances || alliances.length == 0) {
                            delete events_json[events[e]];
                            fs.writeFileSync("../data/events.json", JSON.stringify(events_json));
                            continue;
                        }
                        for (i = 0; i < alliances.length; i++) {
                            var count = 0;
                            for (p = 0; p < alliances[i].picks.length; p++) {
                                var pick = alliances[i].picks[p];
                                if (!events_json[events[e]].rankings[pick]) continue;
                                events_json[events[e]].rankings[pick].alliance = (i + 1);
                                events_json[events[e]].rankings[pick].pick = p;
                                count++
                            }
                            if (count != 3) console.log("Check " + events[e])
                        }
                    }
                    console.log(events[e])
                    fs.writeFileSync("../data/events.json", JSON.stringify(events_json));
                    continue;
                }
                //if (events_json[events[e]]) continue;
                try {
                    var obj = {
                        event_type: null,
                        rankings: {},
                        matches: {}
                    }
                    try {
                        var matches = fs.readFileSync(dir + events[e] + "_matches.csv", 'utf8').split("\r\n").map(e => e.split(",")).slice(0, -1)
                        if (matches.length == 0 || matches[0].length == 0)
                            matches.forEach(m => {
                                obj.matches[m[0]] = {
                                    red: m.slice(1, 4),
                                    blue: m.slice(4, 7),
                                    winner: m[7] > m[8] ? "red" : "blue"
                                }
                            })
                    } catch (err) {
                        var matches = await req.getEventMatchesSimple(events[e])
                        if (!matches) continue;
                        matches.forEach(m => {
                            obj.matches[m.key] = {
                                red: m.alliances.red.team_keys,
                                blue: m.alliances.blue.team_keys,
                                winner: m.winning_alliance
                            }
                        })
                    }
                    try {
                        var rankings = fs.readFileSync(dir + events[e] + "_rankings.csv", 'utf8').split("\r\n").map(e => e.split(",")).slice(1, -1)
                        if (rankings.length <= 1 || rankings[0].length <= 1) continue;
                        for (r = 0; r < rankings.length; r++) {
                            rankings[r][1] = "frc" + rankings[r][1]
                            var played = matches.filter(item => item.includes(rankings[r][1])).map(item => item[0])
                            obj.rankings[rankings[r][1]] = {
                                rank: rankings[r][0],
                                awards: null,
                                matches: played
                            }
                            if (!team_json[rankings[r][1]]) team_json[rankings[r][1]] = [];
                            team_json[rankings[r][1]].push(events[e])
                        }
                    } catch (err) {
                        var rank = await req.getEventRankings(events[e])
                        if (!rank || !rank.rankings || rank.rankings.length == 0) continue;
                        for (r = 0; r < rank.rankings.length; r++) {
                            var element = rank.rankings[r];
                            var team = element.team_key;
                            var played = Object.keys(obj.matches).filter(item => obj.matches[item].red.includes(team) || obj.matches[item].blue.includes(team))
                            obj.rankings[team] = {
                                rank: element.rank,
                                awards: null,
                                matches: played,
                            }
                            if (!team_json[team]) team_json[team] = [];
                            team_json[team].push(events[e]);
                        }
                    }
                    var teams = Object.keys(obj.rankings);
                    try {
                        var awards = fs.readFileSync(dir + events[e] + "_awards.csv", 'utf8').split("\r\n").map(e => e.split(",")).slice(0, -1)
                        for (t = 0; t < teams.length; t++) {
                            if (awards.length == 0 || awards[0].length == 0) break;
                            var team = teams[t];
                            var awarded = awards.filter(item => item[2] == team).map(item => item[0].replace(events[e] + "_", ""))
                            obj.rankings[team].awards = awarded
                        }
                    } catch (err) {
                        var awards = await req.getEventAwards(events[e]);
                        if (!awards) awards = [];
                        for (t = 0; t < teams.length; t++) {
                            if (awards.length == 0) break;
                            var team = teams[t];
                            var awarded = awards.filter(item => item.recipient_list.filter(recip => recip.team_key == team).length > 0).map(e => e.award_type)
                            obj.rankings[team].awards = awarded
                        }
                    }
                    if (obj.event_type == null) {
                        var info = await req.getEvent(events[e]);
                        obj.event_type = info.event_type;
                    }
                    if (obj.rankings && teams.length > 0) events_json[events[e]] = obj;
                    fs.writeFileSync("../data/events.json", JSON.stringify(events_json));
                } catch (err) {
                }
            }
        }
    } catch (err) {
        console.log(err);
    }
    console.log("Finished!")
})()