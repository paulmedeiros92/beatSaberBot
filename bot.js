const Discord = require('discord.js');
const client = new Discord.Client();

const gifs = require('./user-info.json');
const sqlite = require('./sqlite');

const dbPath = '../BeatDB/sqlite-tools-win32-x86-3270200/beatDB';
// array of songs sorted by id ascending
let songs = [];
let songTxt = '';

// const tmp = [
//     '$100 Bills','Balearic Pumping', 'Beat Saber', 'Breezer', 'Commercial Pumping',
//     'Country Rounds', 'Escape', 'Legend', 'Lvl Insane', 'Turn Me On', 'Be There For You',
//     'Elixia', 'I Need You', 'Rum N\' Bass', 'Unlimited Power'
// ]

const how2use = '**songs** - to see a list of tracked song names\n'+
    '**"[song name]" [score]** - to update a score you have\n**score** - to see a list of'+
    ' your entered high scores\n**leaderboard**(in progress) - to see a list of aggregate high scores\n'+
    '**help** - that\'s how you got here...duh';

client.on('ready', () => {
    sqlite.openDB(dbPath);
    sqlite.getSongs( rows => {
        songs = rows;
        songTxt = createSongTxt(songs);
    });
    let i = 0;
    setInterval( () => {
        client.user.setActivity("Knowledge", {type: i});
        i = i>=3 ? i%3 : i+1;
    },10000);
})

client.on('message', (receivedMessage) => {
    console.log('This is '+receivedMessage.author.username+'\'s id: '+receivedMessage.author.id);
    // Prevent bot from responding to its own messages
    if (receivedMessage.author == client.user) {
        return;
    }

    else if (receivedMessage.content.includes(client.user.toString())) {     // Check if the bot's user was tagged in the message

        // if (Object.keys(gifs).includes(receivedMessage.author.username)) {
        //     const webAttachment = new Discord.Attachment(gifs[receivedMessage.author.username]);
        //     receivedMessage.channel.send(webAttachment);
        // } else {
            processMsg(receivedMessage);
        // }
    }
})

client.login("NTY0MTQ4OTM1ODc5NTU3MTMy.XKjrFQ.ds4qRkP5zx_gWBJctoICaMVG88U"); // Replace XXXXX with your bot token

function digestCommands(receivedMessage) {
    let commands = receivedMessage.content.split('> ');
    if (commands[1].includes('"')) {
        // split out the score command
        // song name
        commands[1] = commands[1].substr(commands[1].indexOf('"')+1)
        const songName = commands[1].substr(0, commands[1].indexOf('"'));
        // score
        commands = commands[1].split('"');
        const score = commands[1].split(' ');
        return [songName, score[1]];
    } else {
        commands = commands[1].split(' ');
        commands = commands.filter( command => command !== '');
        if (commands.length > 1) {
            sendMsg('Invalid command length, try using "help"', receivedMessage.channel);
        }
        return commands;
    }
}

function processMsg(receivedMessage) {
     const commands = digestCommands(receivedMessage)
    // song name and score
    if (commands.length === 1) {
        if (commands[0].toLowerCase() === 'help') {
            sendMsg(how2use, receivedMessage.channel);
        }
        if (commands[0].toLowerCase() === 'songs' || commands[0].toLowerCase() === 'song') {
            sendMsg(songTxt, receivedMessage.channel)
        }
        // if (commands[0].toLowerCase() === 'leaderboard') {
        //     //post leaderboard of all high scores in order
        //     leaderboard(receivedMessage);
        // }
        if (commands[0].toLowerCase() === 'score' || commands[0].toLowerCase() === 'scores') {
            // post accumulated personal score of all songs and total
            postAllUserScores(receivedMessage);
        }
    } else {
        validateScore(commands, receivedMessage)
        .then(commands => {
            sqlite.insertScore(commands[0], commands[1], commands[2]);
            sendMsg(`Successfully added score to your account ${receivedMessage.author.username}`, receivedMessage.channel)
        })
        .catch(err => console.error(err))
    }
}

async function validateScore(commands, receivedMessage) {

    if (commands.length > 2) {
        sendMsg("Command length is too long, song followed by score please!", receivedMessage.channel);
    }
    // find songID
    let songID = [];
    songs.forEach( song => {
        if (commands[0].toLowerCase() === song.name.toLowerCase()) {
            songID.push(song.id);
        }
    });
    // need to find a specified user and look up a way to remove all these callbacks
    // find userID
    let row = await sqlite.getUser(receivedMessage.author.username);
    let userID = row.id;
    if (songID.length > 1) {
        sendMsg("Database has duplicate songs, contact Admin", receivedMessage.channel);
        throw new Error('Duplicate database song IDs');
    }
    if (!isNaN(commands[1]) && commands[1] > 999999 && commands[1] < 0) {
        sendMsg("Score is invalid you liar!", receivedMessage.channel);
        throw new Error('Invalid score');
    }
    return [commands[1], userID, songID[0]];
}

// maybe fix the styleing use only one type of string decorator?
async function postAllUserScores(receivedMessage) {
    // get user from userID
    let user = await sqlite.getUser(receivedMessage.author.username);
    const scores = await sqlite.getAllUserScores(user.id);
    tmp = '```High scores for '+ user.username +':\n'
    scores.forEach(score => {
        tmp += `${songs[score.songID].name} - ${score.score}\n`
    });
    tmp += '```';
    receivedMessage.channel.send(tmp);
}

async function leaderboard(receivedMessage) {
    // get all users
    // for each user sum all scores
    // sort all users by score summation DESC
    
    str = `__**LEADERBOARD**__\n`;
    // THIS IS WHERE I LEFT OFF....4/14/19
    // accumulate users scores and make an array of user and high score, descending
    for (let i = 0; i<userScore.length; i++) {
        str += `#${i} ${userScore.username} - ${userScore.score}\n`;
    }
}

function sendMsg(msg, channel) {
    channel.send(msg);
}

function createSongTxt(songs) {
    let tmp = '```These are the songs currently being tracked:\n'
    songs.forEach(song => {
        tmp += `"${song.name}"\n`;
    });
    tmp += '```';
    return tmp;
}
// TODO: needs a kill switch