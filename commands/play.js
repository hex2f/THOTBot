let thot
let streamOptions = { passes: 4, bitrate: 28000 }

const YouTube = require('youtube-node')
const ytdl = require('ytdl-core')

const { Queue } = require('../dbmodels')

const youTube = new YouTube()
youTube.setKey('AIzaSyCp0bWktjYaLcmrooSzlAxSuydt7zy2MEY')

const getById = async (id) => {
    let result = await new Promise(function(resolve, reject) {
        youTube.getById(id, function(err, res){
            if(err) {
                reject(err)
            }else{
                resolve(res)
            }
        })
    })

    return result
}

const search = async (query, amount = 2) => {
    let result = await new Promise(function(resolve, reject) {
        youTube.search(query, amount, {type: 'video'}, function(err, res){
            if(err) {
                reject(err)
            }else{
                resolve(res)
            }
        })
    })

    return result
}

const handleQueue = async (server) => {
    let queue = await Queue.findOne({server}, null, {sort: {added: 1 }})
    console.log(queue)

    let channel = thot.client.guilds.get(queue.server).channels.get(queue.channel)
    let vchannel = thot.client.guilds.get(queue.server).channels.get(queue.voice)
    try {
        let stream = ytdl(`https://www.youtube.com/watch?v=${queue.video}`, { filter: 'audioonly' })
        const voice = await vchannel.join()
        const connection = voice.playStream(stream, streamOptions)
        channel.send(`:musical_note: Now playing [**${queue.title}**](https://youtu.be/${queue.video})`)
        connection.once("end", async () => {
            channel.send(`:musical_note: Done playing **${queue.title}**.`)
            await Queue.findOneAndRemove({server}, {sort: {added: 1 }})
            if((await Queue.find({server})).length > 0) {
                handleQueue(server)
            } else {
                voice.channel.leave()
            }
        });
    } catch (e) {
        await Queue.findOneAndRemove({server}, {sort: {added: 1 }})
        channel.send(`😞 Error joining voice channel.\n\`${e.message}\``)
        console.error(e)
    }
}

const handle = async (args, msg, bot) => {
    try {
        if(!thot) thot = bot
        console.log(args)
        if(!msg.channel.guild) {
            msg.channel.send("😞 This command can only be run in a server.");
            return;
        }
        if(!msg.member.voiceChannel) {
            msg.channel.send("😞 You are not in a voice channel.");
            return;
        }

        let id
        let title
        let length
        let skip

        if(args.join(' ').indexOf('watch?v=') > -1) {
            id = args.join(' ').split('watch?v=')[1]
            if (id.indexOf('&t=') > -1) {
                skip = id.split('&t=')[1]
                id = id.split('&t=')[0]
            }
            let vid = await getById(id).items[0]
            title = vid.snippet.title

            console.log(1, id, title)
        } else if (args.join(' ').indexOf('youtu.be/') > -1) {

            id = args.join(' ').split('youtu.be/')[1]
            if (id.indexOf('?t=') > -1) {
            skip = id.split('?t=')[1]
            id = id.split('?t=')[0]
            }
            let vid = await getById(id).items[0]
            title = vid.snippet.title
            console.log(2, id, title)
        } else {
            let searchResults = await search(args.join(' '), 1)
            if(!searchResults || searchResults.items.length === 0) {
                msg.channel.send("😞 No results.");
                return;
            }
            id = searchResults.items[0].id.videoId
            title = searchResults.items[0].snippet.title
            console.log(3, id, title)
        }
        
        if (!ytdl.validateID(id)) {
            msg.channel.send(`😞 An error occured\n\`${id} isnt a valid ID.\``);
            return;
        }

        console.log(msg.member.voiceState)


        await Queue.create({
            server: msg.guild.id,
            channel: msg.channel.id,
            requestedBy: msg.member.id,
            requestedByName: msg.member.displayName,
            voice: msg.member.voiceChannel.id,
            video: id,
            title: title
        })

        let queue = await Queue.find({server: msg.guild.id})

        if (queue.length === 1) {
            handleQueue(msg.guild.id)
        }

        msg.channel.send(`:musical_note: Added [**${title}**](https://youtu.be/${id}) to the queue.`);
    } catch(e) {
        console.error(e)
    }
}

module.exports = {
    command: 'play',
    aliases: ['p'],
    name: 'play',
    description: 'Add a youtube video to the playback queue.',
    usage: ['search or url'],
    action: handle,
    init: (t) => { thot = t; console.log(thot) }
}