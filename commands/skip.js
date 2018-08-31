let thot

const { Queue } = require('../dbmodels')

const handle = async (args, msg, bot) => {
  try {
    if (!thot) thot = bot
    let queue = await Queue.findOne({server: msg.guild.id}, null, {sort: { added: 1 }})
    if (queue === undefined || queue === null) { return }

    if (queue.requestedBy !== msg.author.id && msg.member.roles.last().calculatedPosition < thot.client.guilds.get(msg.guild.id).members.get(thot.client.user.id).roles.last().calculatedPosition) {
      msg.channel.send(`😞 Only the person who requested can skip.`)
      return
    }
    let vchannel = thot.client.guilds.get(queue.server).channels.get(queue.voice)
    vchannel.leave()
    // await Queue.findOneAndRemove({server: msg.guild.id}, {sort: {added: 1 }})

    msg.channel.send(`:fast_forward: Skipped [**${queue.title}**](https://youtu.be/${queue.video})`)
  } catch (e) {
    console.error(e)
  }
}

module.exports = {
  command: 'skip',
  aliases: ['s'],
  name: 'skip',
  description: 'Skip the current playing video in queue.',
  usage: [],
  action: handle,
  init: (t) => { thot = t; console.log(thot) }
}
