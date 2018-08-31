let thot
let streamOptions = { passes: 4, bitrate: 28000 }

const YouTube = require('youtube-node')
const ytdl = require('ytdl-core')

const { Queue } = require('../dbmodels')

const youTube = new YouTube()
youTube.setKey('AIzaSyCp0bWktjYaLcmrooSzlAxSuydt7zy2MEY')

const search = async (query, amount = 2) => {
  let result = await new Promise(function (resolve, reject) {
    youTube.search(query, amount, {type: 'video'}, function (err, res) {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })

  return result
}

const handleQueue = async (server) => {
  let queue = await Queue.findOne({server}, null, {sort: { added: 1 }})
  console.log(queue)

  let channel = thot.client.guilds.get(queue.server).channels.get(queue.channel)
  let vchannel = thot.client.guilds.get(queue.server).channels.get(queue.voice)
  try {
    let stream = ytdl(`https://www.youtube.com/watch?v=${queue.video}`, { filter: 'audioonly' })
    const voice = await vchannel.join()
    const connection = voice.playStream(stream, streamOptions)
    channel.send(`:musical_note: Now playing [**${queue.title}**](https://youtu.be/${queue.video}) - Requested by *${queue.requestedByName}*`)
    connection.once('end', async () => {
      channel.send(`:musical_note: Done playing **${queue.title}**.`)
      await Queue.findOneAndRemove({server}, {sort: { added: 1 }})
      if ((await Queue.find({server})).length > 0) {
        handleQueue(server)
      } else {
        voice.channel.leave()
      }
    })
  } catch (e) {
    console.error(e)
    await Queue.findOneAndRemove({server}, {sort: { added: 1 }})
    channel.send(`😞 Error joining voice channel.\n\`${e.message}\``)
  }
}

const handle = async (args, msg, bot) => {
  try {
    if (!thot) thot = bot
    console.log(args)
    if (!msg.channel.guild) {
      msg.channel.send('😞 This command can only be run in a server.')
      return
    }
    if (!msg.member.voiceChannel) {
      msg.channel.send('😞 You are not in a voice channel.')
      return
    }

    let id
    let title

    let searchResults = await search(args.join(' '), 9)
    if (!searchResults || searchResults.items.length === 0) {
      msg.channel.send('😞 No results.')
      return
    }

    let srstr = ':1234: **Search Results:**\n'

    let numbers = [':one:', ':two:', ':three:', ':four:', ':five:', ':six:', ':seven:', ':eight:', ':nine:']

    searchResults.items.forEach((search, i) => {
      srstr += `\n${numbers[i]} **${search.snippet.title}**`
    })

    srstr += '\n\n *write `c` to cancel*'

    let selectionMsg = msg.channel.send(srstr)

    const handleMsg = async (message) => {
      if (message.author.id === msg.author.id && [1, 2, 3, 4, 5, 6, 7, 8, 9].indexOf(parseInt(message.content)) > -1) {
        if (searchResults.items[parseInt(message.content)]) {
          id = searchResults.items[parseInt(message.content)].id.videoId
          title = searchResults.items[parseInt(message.content)].snippet.title

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

          msg.channel.send(`:musical_note: *${msg.member.displayName}* added [**${title}**](https://youtu.be/${id}) to the queue.`)
          thot.client.removeListener('message', handleMsg)
          selectionMsg.delete()
        }
      } else if (message.author.id === msg.author.id && message.content.toLowerCase() === 'n') {
        thot.client.removeListener('message', handleMsg)
        selectionMsg.delete()
      }
    }

    thot.client.on('message', handleMsg)
  } catch (e) {
    console.error(e)
  }
}

module.exports = {
  command: 'search',
  aliases: ['y'],
  name: 'search',
  description: 'Heh jeo.',
  usage: ['search query'],
  action: handle,
  init: (t) => { thot = t; console.log(thot) }
}
