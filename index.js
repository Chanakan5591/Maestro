const Discord = require("discord.js")
const ytdl = require("ytdl-core");
const YouTube = require("discord-youtube-api");

const client = new Discord.Client()

const queue = new Map();

const youtube = new YouTube("AIzaSyBG_B8arvyYu1FGIGwQsDCHH4YnhCLEVEQ");

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`)
    client.user.setActivity("songs | =help", {type: "PLAYING"});
})

var prefix = "="
  
client.on("message", async message => {

    if (message.author.bot) return;
    if (message.content.indexOf(prefix) !== 0) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
  
    const serverQueue = queue.get(message.guild.id);
  
    if (command.startsWith(`play`) || command.startsWith(`p`)) {
        execute(message, serverQueue);
        return;
    } else if (command.startsWith(`skip`)) {
        skip(message, serverQueue);
        return;
    } else if (command == `stop` || command == `disconnect` || command == `dc`) {
        stop(message, serverQueue);
    } else if (command == `join` || command == `summon`) {

        const novcjoin = new Discord.MessageEmbed()
            .setColor('#FFA500')
            .setTitle('Join a voice channel first!')
            .setDescription("You have to be in a voice channel to make me join.")

        if (!message.member.voice.channel) return message.channel.send(novcjoin);
        message.member.voice.channel.join()
        message.react(`✅`)

    } else if (command == `remove` || command == `r`) {

        const novcr = new Discord.MessageEmbed()
            .setColor('#FFA500')
            .setTitle('Join a voice channel first!')
            .setDescription("You have to be in a voice channel to remove music.")

        const diffvcr = new Discord.MessageEmbed()
            .setColor(`#FFA500`)
            .setTitle(`You are not in the same VC with me!`)
            .setDescription(`You have to be in the same VC with me to remove music.`)

        const noqr = new Discord.MessageEmbed()
            .setColor(`#FFA500`)
            .setTitle(`No queue!`)
            .setDescription(`I have no song to remove.`)
        
        const invr = new Discord.MessageEmbed()
            .setColor(`#FFA500`)
            .setTitle(`You provided an invalid music number!`)
            .setDescription(`Please give me a valid music number.`)
            .setFooter(`Type =q to view music number.`)

        const args1 = message.content.split(' ').slice(1); 
        const amount = args1.join(' '); 

        if(!serverQueue) return message.channel.send(noqr)

        if(message.member.voice.channel && message.guild.me.voice.channel && message.member.voice.channel != message.guild.me.voice.channel) 
            return message.channel.send(diffvcr)

        if(isNaN(amount) || amount >= serverQueue.songs.length || !amount ||  amount <= 0 ) return message.channel.send(invr)

        serverQueue.songs = serverQueue.songs.splice(amount, 1)

        const removed = new Discord.MessageEmbed()
            .setColor(`00ff00`)
            .setTitle(`Removed music!`)
            .setDescription(`Successfully removed music ${amount} from the queue.`)

        message.channel.send(removed)

    } else if (command == `queue`|| command == `q`) {

        if(!serverQueue) {
            const notplayingqueue = new Discord.MessageEmbed()
                .setColor(`#FFA500`)
                .setTitle(`Not playing!`)
                .setDescription(`I'm not playing songs now.`)
            message.channel.send(notplayingqueue)
            return;
        } else if ( serverQueue.songs == [] ) {
            const notplayingqueuea = new Discord.MessageEmbed()
                .setColor(`#FFA500`)
                .setTitle(`Not playing!`)
                .setDescription(`I'm not playing songs now.`)
            message.channel.send(notplayingqueuea)
            return;
        }

        var songsarray = [];
        for (var i = 0; i < serverQueue.songs.length; i++) {
            songsarray.push(serverQueue.songs[i].title);
        }

        if(songsarray.length > 0) {
            
            for (var j = 0; j < 1; j++) {
                songsarray[j] = ":play_pause: ``" + songsarray[j] + "``\n"
            }
            for (var i = 1; i < songsarray.length; i++) {
                songsarray[i] = "**" + (i) + ".** ``"+ songsarray[i] + "``";
            }
            const queueembed = new Discord.MessageEmbed()
                .setColor(`#00ff00`)
                .setTitle(`**Queue**`)
                .setDescription(`${songsarray.join("\n")}`)
                .setTimestamp()
            message.channel.send(queueembed);
        }

    } else if (command.startsWith(`help`)) {
        const helpembed = new Discord.MessageEmbed()
            .setColor(`#1167b1`)
            .setTitle(`**Command list**`)
            .setDescription("``=play`` Plays music.\n``=stop`` Stops playing music.\n``=skip`` Skips music.\n``=help`` This command.\n``=queue`` Displays queue.")
        message.channel.send(helpembed)
    }});

    async function execute(message, serverQueue) {

        const novc = new Discord.MessageEmbed()
            .setColor('#FFA500')
            .setTitle('Join a voice channel first!')
            .setDescription('You need to be in a voice channel to play music.')
    
        const diffvc = new Discord.MessageEmbed()
            .setColor(`#FFA500`)
            .setTitle(`You are not in the same VC with me!`)
            .setDescription(`You have to be in the same vc with me to play music.`)

            const args = message.content.split(' ').slice(1); 
            const video = args.join(' '); 

        if(!video) {
            const nosongembed = new Discord.MessageEmbed()
                .setColor(`#b19cd9`)
                .setTitle(`Play command`)
                .setDescription(`Usage: =play [youtube link]`)
            message.channel.send(nosongembed)
            return
        }
    
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.channel.send(novc);

        if(message.member.voice.channel && message.guild.me.voice.channel && message.member.voice.channel != message.guild.me.voice.channel) 
            return message.channel.send(diffvc)

        if(ytdl.validateURL(video) == false) {

            var keyword = encodeURI(video)
            const videosearched = await youtube.searchVideos(keyword);

            const songInfoa = await ytdl.getInfo(videosearched.url);
            const songyt = {
                title: songInfoa.title,
                url: songInfoa.video_url
            };
  
            if (!serverQueue) {
            const queueContruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true
            };
        
            queue.set(message.guild.id, queueContruct);
        
            queueContruct.songs.push(songyt);
        
            try {
                var connection = await voiceChannel.join();
                queueContruct.connection = connection;
                play(message.guild, queueContruct.songs[0]);
            } catch (err) {
                console.log(err);
                queue.delete(message.guild.id);
                return message.channel.send(err);
            }

        } else {
            
            serverQueue.songs.push(songyt);
            const addedsong = new Discord.MessageEmbed()
                .setColor('#00ff00')
                .setTitle('Song added!')
                .setDescription("``" + songyt.title + "`` has been added to the queue!")
            return message.channel.send(addedsong);
            }
        } else {
        
            const songInfo = await ytdl.getInfo(video);
            const song = {
                title: songInfo.title,
                url: songInfo.video_url
            };
    
            if (!serverQueue) {
            const queueContruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true
            };
        
            queue.set(message.guild.id, queueContruct);
        
            queueContruct.songs.push(song); 
        
            try {
                var connection = await voiceChannel.join();
                queueContruct.connection = connection;
                play(message.guild, queueContruct.songs[0]);
            } catch (err) {
                console.log(err);
                queue.delete(message.guild.id);
                return message.channel.send(err);
            }

        } else {
            serverQueue.songs.push(song);
            const addedsong = new Discord.MessageEmbed()
                .setColor('#00ff00')
                .setTitle('Song added!')
                .setDescription("``" + song.title + "`` has been added to the queue!")
            return message.channel.send(addedsong);
        }}
    }
  
    function skip(message, serverQueue) {

        const novcskip = new Discord.MessageEmbed()
            .setColor('#FFA500')
            .setTitle('Join a voice channel first!')
            .setDescription("You have to be in a voice channel to skip music.")

        const nosongskip = new Discord.MessageEmbed()
            .setColor('#FFA500')
            .setTitle('No song anymore!')
            .setDescription('There is no song that I can skip.')

        const diffvcskip = new Discord.MessageEmbed()
            .setColor(`#FFA500`)
            .setTitle(`You are not in the same VC with me!`)
            .setDescription(`You have to be in the same VC with me to skip music.`)

        if (!message.member.voice.channel) return message.channel.send(novcskip);
        if(message.member.voice.channel && message.guild.me.voice.channel && message.member.voice.channel != message.guild.me.voice.channel) 
            return message.channel.send(diffvcskip)
        if (!serverQueue) return message.channel.send(nosongskip);

        serverQueue.songs.shift();
        play(message.guild, serverQueue.songs[0]);
    } 
    
    function stop(message, serverQueue) {
        const novcstop = new Discord.MessageEmbed()
            .setColor('#FFA500')
            .setTitle('Join a voice channel first!')
            .setDescription("You have to be in a voice channel to disconnect me.")

        const diffvcstop = new Discord.MessageEmbed()
            .setColor(`#FFA500`)
            .setTitle(`You are not in the same VC with me!`)
            .setDescription(`You have to be in the same VC with me to disconnect me.`)

        if (!message.member.voice.channel) return message.channel.send(novcstop);

        if(message.member.voice.channel && message.guild.me.voice.channel && message.member.voice.channel != message.guild.me.voice.channel) 
            return message.channel.send(diffvcstop)

        if (!serverQueue) {
            message.member.voice.channel.leave()
        } else {
            serverQueue.songs = [];
            serverQueue.connection.dispatcher.end();
        }
        
        message.react(`👋`) 
    }
  
    function play(guild, song) {
        const serverQueue = queue.get(guild.id);
        if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection
        .play(ytdl(song.url, { filter: 'audioonly' }))
        dispatcher.on("finish", () => {
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    const playing = new Discord.MessageEmbed()
            .setColor('#00ff00')
            .setTitle('Playing music!')
            .setDescription("Playing ``" + song.title + "`` now! :notes:")
    serverQueue.textChannel.send(playing);

}

client.login(process.env.TOKEN)