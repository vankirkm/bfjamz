var logger = require('winston');
const { prefix, token } = require("./config.json");
const {Client, Collection, Intents} = require('discord.js');

const queue = new Map();



// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
var bot = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES]
});
bot.login(token);


bot.on('ready', () => {
    console.log(`Logged in!`);
});

bot.once("reconnecting", () => {
    console.log("Reconnecting!");
});

bot.once("disconnect", () => {
    console.log("Disconnect!");
});

bot.on("message", async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    console.log('message received');

    const serverQueue = queue.get(message.guild.id);

    if (message.content.startsWith(`${prefix}play`)) {
        play(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}skip`)) {
        skip(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}stop`)) {
        stop(message, serverQueue);
        return;
    } else {
        message.channel.send("You need to enter a valid command!");
    }
});

play()

skip()

stop()

