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

bot.on('ready', () => {
    logger.log("info", `Logged in!`);
});

bot.once("reconnecting", () => {
    logger.log("info", "Reconnecting!");
});

bot.once("disconnect", () => {
    logger.log("info", "Disconnecting!");
});

bot.on("messageCreate", async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    logger.log("info", 'message received');

    const serverQueue = queue.get(message.guild.id);

    if (message.content.startsWith(`${prefix}play`)) {
        initPlay(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}skip`)) {
        skip(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}pause`)) {
        pause(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}resume`)) {
        resume(message, serverQueue);
        return;
    } else {
        message.channel.send("You need to enter a valid command!");
    }
});

async function initPlay(message, serverQueue){
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
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url
    }

    if(!serverQueue){

        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            },
        });

        player.on(AudioPlayerStatus.Idle, () => {
            advanceQueue(message.guild);
        });

        player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
        });

        const guildQueue = {
            textChannel: message.channel,
            voiceChannel: message.voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true,
            player: player
        }
        queue.set(message.guild.id, guildQueue);

        guildQueue.songs.push(song);

        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator
            });
            guildQueue.connection = connection;
            play(message.guild, guildQueue.songs[0]);
        } catch (err) {
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    }else {
        serverQueue.songs.push(song);
        if(serverQueue.songs.length == 1){
            return play(message.guild, serverQueue.songs[0]);
        }
        return message.channel.send(`${song.title} has been added to the queue!`);
    }

    
}

function skip(message, serverQueue){
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
        return message.channel.send(
        "You need to be in a voice channel to skip music!"
    );
    else {
        serverQueue.player.pause();
        advanceQueue(message.guild);
    }
}

function pause(message, serverQueue){
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
        return message.channel.send(
        "You need to be in a voice channel to stop music!"
    );
    else{
        message.channel.send(`**Pausing playback. Use !resume to continue playback.**`);
        serverQueue.player.pause();
    }
}

function resume(message, serverQueue) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
        return message.channel.send(
        "You need to be in a voice channel to resume music!"
    );
    else {
        message.channel.send(`**Resuming playback.**`);
        serverQueue.player.unpause();
    }
}

async function play(guild, song){
    const songToPlay = await ytdl(song.url);
    const currentSong = createAudioResource(songToPlay);
    const guildQueue = queue.get(guild.id);
    guildQueue.textChannel.send(`Start playing: **${song.title}**`);
    guildQueue.player.play(currentSong);
    guildQueue.connection.subscribe(guildQueue.player);
}

function advanceQueue(guild){
    const guildQueue = queue.get(guild.id);
    guildQueue.songs.splice(0,1);
    if(guildQueue.songs[0]){
        logger.log("info", "queue has another song");
        play(guild, guildQueue.songs[0]);
    }
    else{
        logger.log("info", "waiting for another song");
    }
}


