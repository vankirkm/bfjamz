var logger = require('winston');
const { prefix, token } = require("./config.json");
const {Client, Collection, Intents} = require('discord.js');
const ytdl = require('ytdl-core');
const {
	AudioPlayerStatus,
    AudioPlayer,
	AudioResource,
	entersState,
	joinVoiceChannel,
    createAudioPlayer,
	createAudioResource,
    StreamType,
	VoiceConnectionStatus,
    NoSubscriberBehavior,
} = require('@discordjs/voice');

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

const player = createAudioPlayer({
	behaviors: {
		noSubscriber: NoSubscriberBehavior.Play,
	},
});


bot.on('ready', () => {
    console.log(`Logged in!`);
});

bot.once("reconnecting", () => {
    console.log("Reconnecting!");
});

bot.once("disconnect", () => {
    console.log("Disconnect!");
});

bot.on("messageCreate", async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    console.log('message received');

    const serverQueue = queue.get(message.guild.id);

    if (message.content.startsWith(`${prefix}play`)) {
        initPlay(message, serverQueue);
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

async function initPlay(message, serverQueue){97
    const messageArgs = message.content.split(" ");

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
        return message.channel.send(
        "You need to be in a voice channel to play music!"
    );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.channel.send(
        "I need the permissions to join and speak in your voice channel!"
    );
    }

    const songInfo = await ytdl.getInfo(messageArgs[1]);
    const song = {
        title: "songInfo.videoDetails.title",
        url: "C:\\Users\\micha\\Downloads\\yt5s.com-Bag Raiders - Shooting Stars (Official Video)-(128kbps).ogg"
    }

    if(!serverQueue){
        const channelQueue = {
            textChannel: message.channel,
            voiceChannel: message.voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        }
        queue.set(message.guild.id, channelQueue);

        channelQueue.songs.push(song);

        try {
            const connection = await joinVoiceChannel({
                channelId: message.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator
            });
            channelQueue.connection = connection;
            play(message.guild, channelQueue.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    }else {
        serverQueue.songs.push(song);
        return message.channel.send(`${song.title} has been added to the queue!`);
    }

    
}

function skip(){
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
        return message.channel.send(
        "You need to be in a voice channel to skip music!"
    );
}

function stop(){
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
        return message.channel.send(
        "You need to be in a voice channel to stop music!"
    );
}

function play(guild, song){
    const channelQueue = queue.get(guild.id);
    channelQueue.textChannel.send(`Start playing: **${song.title}**`);
}


