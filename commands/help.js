let thot

const handle = async (args, msg, bot) => {
    try {
        if(!thot) thot = bot
        msg.channel.send(`:wave: Hi there! Here are my commands :smile:
        
\`-p Link or Search\` - Add a youtube video to the playback queue.
\`-q\` - Get a list of the current video queue.
\`-s\` - Skip the current playing video in queue.
\`-c\` - Remove all videos from the queue.`)
    } catch (e) {
        console.error(e)
    }
}

module.exports = {
    command: 'help',
    aliases: ['h'],
    name: 'help',
    description: '**H E L P  M E**',
    usage: [],
    action: handle,
    init: (t) => { thot = t; console.log(thot) }
}