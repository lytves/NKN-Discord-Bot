// Load up the discord.js library
const Discord = require("discord.js");
const axios = require("axios");

const client = new Discord.Client();

// Here we load the config.json file that contains our token and our prefix values. 
const config = require("./config.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.

//child process for NKN
var exec = require('child_process').exec, child;

var execSync = require('child_process').execSync, child;

var fs = require('fs');

// got it from https://stackoverflow.com/a/36734774/6841308
function numberFormat(labelValue) {

    // Nine Zeroes for Billions
    return Math.abs(Number(labelValue)) >= 1.0e+9

        ? (Math.abs(Number(labelValue)) / 1.0e+9).toFixed(2) + " B"
        // Six Zeroes for Millions
        : Math.abs(Number(labelValue)) >= 1.0e+6

            ? (Math.abs(Number(labelValue)) / 1.0e+6).toFixed(2) + " M"
            // Three Zeroes for Thousands
            : Math.abs(Number(labelValue)) >= 1.0e+3

                ? (Math.abs(Number(labelValue)) / 1.0e+3).toFixed(2) + " K"

                : Math.abs(Number(labelValue));
}

client.on("ready", () => {
    // This event will run if the bot starts, and logs in, successfully.
    console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
    // Example of changing the bot's playing game to something useful. `client.user` is what the
    // docs refer to as the "ClientUser".
    client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("guildCreate", guild => {
    // This event triggers when the bot joins a guild.
    console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
    client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
    // this event triggers when the bot is removed from a guild.
    console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
    client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("message", async message => {
    // This event will run on every single message received, from any channel or DM.

    // It's good practice to ignore other bots. This also makes your bot ignore itself
    // and not get into a spam loop (we call that "botception").
    if (message.author.bot) return;

    // Also good practice to ignore any message that does not start with our prefix,
    // which is set in the configuration file.
    if (message.content.indexOf(config.prefix) !== 0) return;

    //PM-only bot. Remove this to enable the bot to reply to channels.
    if (message.guild !== null) return;

    // Here we separate our "command" name, and our "arguments" for the command.
    // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
    // command = say
    // args = ["Is", "this", "the", "real", "life?"]
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    // Let's go with a few common example commands! Feel free to delete or change those.

    // *****************************************************************************
    // ***************************     BOT'S STATE COMMAND       *******************
    // *****************************************************************************
    if (command === "ping") {
        // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
        // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
        const m = await message.channel.send("Ping?");
        m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);

        let msg, response;

        response = execSync(`${config.path}/nknc --port 30003 info -s`, {timeout: 1000}).toString();

        if (response && JSON.parse(response)['result']) {
            msg = ":white_check_mark: Bot's NKN node is available.";
        } else {
            msg = ":no_entry: Bot's node doesn't working!";
        }
        message.channel.send(msg);

    }

    // *****************************************************************************
    // ***************************     BOT'S COMMAND       *************************
    // *****************************************************************************
    if (command === "help") {
        message.channel.send(`:children_crossing: Availaible bot's commands:
+ping: check up bot's and API latency and current bot's node state
+health: network status
+block: current block count of seed node
+tx <hash>: check a transfer with txhash

+balance <wallet>: check wallet balance
+tokenomics: NKN tokenomic CoinMarketCap information
+marketstats: NKN token CoinMarketCap statistic

+nodes: all the nodes on the network
+nodev <ip>: check node version 
+nodestats: stats of seed node
+nodestats i: detailed stats of seed node
+nodestats <ip>: stats of node by IP
+nodestats <ip> i: detailed stats of node by IP

+multistats <ip>,<ip1>,<ip2>,...: check status of multiple nodes (please use in PM only)`);
    }

    // *****************************************************************************
    // ***************************     BOT'S COMMAND       *************************
    // *****************************************************************************
    if (command === "health") {

        var seed = 0;
        var node = 0;

        var process_c = exec(`${config.path}/nknc --ip testnet-node-0001.nkn.org --port 30003 info -c`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
            if (stderr) {
                message.channel.send(`:red_circle: Seed node is down.`);
            }
            //parse
            if (stdout) {
                message.channel.send(`:large_blue_circle:  Seed node is up.`);
            }
        });

        setTimeout(function () {
            process_c.kill()
        }, 2000);
    }

    // *****************************************************************************
    // ***************************     BOT'S COMMAND       *************************
    // *****************************************************************************
    if (command === "block") {

        exec(`${config.path}/nknc --ip testnet-node-0001.nkn.org --port 30003 info -c`, (error, stdout, stderr) => {

            if (error) {
                console.error(`exec error: ${error}`);
                message.channel.send("Unable to connect. Please try again later. Go grab a coffee or something!");
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);

            //parse
            if (stdout) {
                var obj = JSON.parse(stdout);
                message.channel.send(`Current NKN MainNetwork Block: ${obj['result']}`);
                // And we get the bot to say the thing:
            }
        });
    }

    // *****************************************************************************
    // ***************************     BOT'S COMMAND       *************************
    // *****************************************************************************
    if (command === "balance") {

        let wallet = args[0];

        if (typeof args[0] !== 'undefined') {

            axios.post("http://testnet-node-0001.nkn.org:30003", {
                "jsonrpc": "2.0",
                "method": "getunspendoutput",
                "params": {
                    "address": wallet,
                    "assetid": "4945ca009174097e6614d306b66e1f9cb1fce586cb857729be9e1c5cc04c9c02"
                },
                "id": "1"
            }).then(function (response) {

                if (response.data.result) {
                    console.log("Your Wallet balance is " + response.data.result.length * 10 + ".");
                    message.channel.send(`Your balance is: ${response.data.result.length * 10} NKN :moneybag:`);
                }
                else {
                    message.channel.send(`Sorry, you don't have any tokens yet. Keep mining and check back later! :money_mouth: `);
                }
            }).catch(function (error) {
                console.log(error);
            });
        } else {
            message.channel.send(`Please, provide your wallet address to check it, like "+balance your_wallet"`);
        }
    }

    // *****************************************************************************
    // ***************************     BOT'S COMMAND       *************************
    // *****************************************************************************
    if (command === "tx") {

        if (args[0]) {
            console.log(`arg: ${args[0]}`);

            exec(`${config.path}/nknc --port 30003 info -t ${args[0]}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);

                if (stdout) {
                    var obj = JSON.parse(stdout);
                    if (obj['error']) {
                        var msg = `:warning: ${obj['error']['message']}`;
                        message.channel.send(msg);
                    }

                    else {
                        if (obj['result']['outputs'][1]) {
                            var msg = `${obj['result']['outputs'][1]['address']} --> ${obj['result']['outputs'][0]['address']}
Amount: ${obj['result']['outputs'][0]['value']} NKN :moneybag:`;
                            message.channel.send(msg);
                        }
                        else if (obj['result']['outputs'][0]['address']) {
                            var sendertx = obj['result']['inputs'][0]['referTxID'];
                            var rec = obj['result']['outputs'][0]['address'];
                            var nkn = obj['result']['outputs'][0]['value'];

                            exec(`${config.path}/nknc --port 30003 info -t ${sendertx}`, (error, stdout, stderr) => {
                                if (error) {
                                    console.error(`exec error: ${error}`);
                                    return;
                                }
                                console.log(`stdout: ${stdout}`);
                                console.log(`stderr: ${stderr}`);
                                if (stdout) {
                                    var obj = JSON.parse(stdout);
                                    if (obj['result']['outputs'][0]['address']) {
                                        var msg = `${obj['result']['outputs'][0]['address']} --> ${rec}
Amount: ${nkn} NKN :moneybag:`;
                                        message.channel.send(msg);
                                    }

                                }
                            });


                        }
                    }
                }
            });
        }
        else {
            console.log(`noarg`);
            message.channel.send(`Tx Hash Invalid. Gr8 bait m8!`);
        }
    }

    // *****************************************************************************
    // ***************************     BOT'S COMMAND       *************************
    // *****************************************************************************
    if (command === "tokenomics") {

        axios({
            method: 'get',
            url: 'https://api.coinmarketcap.com/v2/ticker/2780/',
            responseType: 'json'
        })
            .then(function (response) {
                console.log(response.data.data.rank);
                message.channel.send(`Price USD: ${response.data.data.quotes.USD.price.toFixed(3)}$
CMC Rank: ${response.data.data.rank}
Circulating Supply: ${numberFormat(response.data.data.circulating_supply)}
Total Supply: ${numberFormat(response.data.data.total_supply)}
Max Possible Supply: ${numberFormat(response.data.data.max_supply)}`);
            });
    }

    // *****************************************************************************
    // ***************************     BOT'S COMMAND       *************************
    // *****************************************************************************
    if (command === "nodev") {

        let c = `${config.path}/nknc --ip testnet-node-0001.nkn.org --port 30003 info -v`;
        let msg = "";

        if (args[0]) {

            let ip = args[0];
            let selfVersion; // false by default

            console.log(ip);

            try {
                let response = execSync(`${config.path}/nknc --port 30003 info -s`, {timeout: 1000}).toString();

                let obj = JSON.parse(response);

                if (obj['result'] && obj['result']['Addr'] === ip) {
                    selfVersion = true;
                }
            }
            catch (e) {

            } finally {
                if (selfVersion) {
                    c = `${config.path}/nknc --port 30003 info -v`;
                }
                else {
                    c = `${config.path}/nknc --ip ${ip} --port 30003 info -v`;
                }
            }
        }
        else {
            msg += "Seed Node self-version!\n";
        }

        exec(c, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                message.channel.send("Unable to connect. Please try again later.");
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
            //parse
            if (stdout) {
                var obj = JSON.parse(stdout);
                msg += `Version: ${obj['result']}`;
                message.channel.send(msg);
            }

            if (stderr) {
                message.channel.send("Error!");
            }

        });
    }


    // *****************************************************************************
    // ***************************     BOT'S COMMAND       *************************
    // *****************************************************************************
    if (command === "marketstats") {
        axios({
            method: 'get',
            url: 'https://api.coinmarketcap.com/v2/ticker/2780/',
            responseType: 'json'
        })
            .then(function (response) {
                message.channel.send(`Price USD: ${response.data.data.quotes.USD.price.toFixed(3)}$
CMC Rank: ${response.data.data.rank}
Marketcap: ${numberFormat(response.data.data.quotes.USD.market_cap)} $
Volume (24h): ${numberFormat(response.data.data.quotes.USD.volume_24h)} $
Change (24h): ${numberFormat(response.data.data.quotes.USD.percent_change_24h)}%`);
            });
    }

    // *****************************************************************************
    // ***************************     BOT'S COMMAND       *************************
    // *****************************************************************************
    if (command === "nodes") {
        exec('wc -l < NKNNodeList $(wget http://testnet.nkn.org/node_list/NKNNodeList) && rm NKNNodeList*', (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                message.channel.send("Unable to connect. Please try again later. Go grab a coffee or something!");
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
            //parse
            var msg = `Node Count: ${stdout}`;
            message.channel.send(msg);

        });
    }

    // *****************************************************************************
    // ***************************     BOT'S COMMAND       *************************
    // *****************************************************************************
    if (command === "nodestats") {

        var response = "";

        if (args[0]) {

        }

    }

// *****************************************************************************
// ***************************     BOT'S COMMAND       *************************
// *****************************************************************************
    if (command === "multistats") {

        let msg, response;
        let caught; // false by default

        try {
            response = execSync(`${config.path}/nknc --ip testnet-node-0001.nkn.org --port 30003 info -s`, {timeout: 1000}).toString();

            let obj = JSON.parse(response);

            if (obj['result']) {
                msg = ":white_check_mark: **NKN MainNetwork SyncState:** " + obj['result']['SyncState'];
            }

            response = execSync(`${config.path}/nknc --ip testnet-node-0001.nkn.org --port 30003 info -c`, {timeout: 1000}).toString();

            obj = JSON.parse(response);

            if (obj['result']) {
                msg += "\nCurrent Network Block: **" + obj['result'] + "**";
            }

        }
        catch (e) {
            msg = ":no_entry: **Unable to connect to MainNetwork.** Please try again later.";
            caught = true;
        }
        finally {
            message.channel.send(msg);
        }

        if (!caught && typeof args[0] !== 'undefined') {

            let ip = args[0];
            let array = ip.split(',');
            let arrayLength = array.length;

            for (let i = 0; i < arrayLength; i++) {

                try {
                    response = execSync(`${config.path}/nknc --ip ${array[i]} --port 30003 info -s`, {timeout: 1000}).toString();

                    let obj = JSON.parse(response);

                    if (obj['result']) {

                        if (obj['result']['SyncState'] === 'PersistFinished') {
                            msg = `:white_check_mark: **${array[i]} SyncState:** ` + obj['result']['SyncState'];
                        } else {
                            msg = `:no_entry: **${array[i]} SyncState:** ` + obj['result']['SyncState'];
                        }
                    } else {
                        throw "Error";
                    }

                    response = execSync(`${config.path}/nknc --ip ${array[i]} --port 30003 info -c`, {timeout: 1000}).toString();

                    obj = JSON.parse(response);

                    if (obj['result']) {
                        msg += "\nCurrent Network Block: **" + obj['result'] + "**";
                    }
                } catch (e) {
                    msg = `:no_entry: **Unable to connect to node IP ${array[i]}.** Please try again later.`;
                }
                finally {
                    message.channel.send(msg);
                }
            }
        }
    }
})
;

client.login(config.token);
