const Discord = require('discord.js');
require('dotenv').config();

const client = new Discord.Client();

// TODO: This is temporary placeholder.
const settings = {
  prefix: '!',
};

/**
 * The ready event is vital, it means that only _after_ this will your bot start reacting to information
 * received from Discord
 */
client.on('ready', () => {
  console.log('I am ready!');
});

/**
 * Respond to a ping message with a 'pong' and the one-way average latency.
 *
 * @param {Message} message the ping message.
 */
function pong(message) {
  message.channel.send(`pong ${Math.round(client.ping)}ms`);
}

// Create an event listener for messages
client.on('message', (message) => {
  // Ignore message from other bots to prevent infinite loop.
  if (message.author.bot) {
    return;
  }

  // If it is a direct message, only respond with pong.
  if (message.channel instanceof Discord.DMChannel) {
    pong(message);
    return;
  }

  // Ignore message if it doesn't mention the bot or use prefix.
  if (!message.isMentioned(client.user) && !message.content.startsWith(settings.prefix)) {
    return;
  }

  // Tokenize the message.
  let tokens = message.content.trim().split(' ');

  // Ignore if no tokens.
  if (tokens.length < 1 || !tokens[0]) {
    return;
  }

  // Discard first token if it is the mention.
  if (tokens[0].trim() === `<@${client.user.id}>`) {
    tokens.shift();

    // Ignore if no more tokens afterwards.
    if (tokens.length < 1 || !tokens[0]) {
      return;
    }
  }

  // Discard prefix if it is used.
  if (tokens[0].trim().startsWith(settings.prefix)) {
    tokens[0] = tokens[0].substr(settings.prefix.length);
  }

  // Respond to pings.
  if (tokens[0].trim() === 'ping') {
    pong(message);
  }
});

client.login(process.env.LOGIN_TOKEN);
