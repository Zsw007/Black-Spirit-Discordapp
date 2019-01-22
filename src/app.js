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

// Create an event listener for messages
client.on('message', (message) => {
  // Ignore message from other bots to prevent infinite loop.
  if (message.author.bot) {
    return;
  }

  // Ignore message if it doesn't mention the bot or use prefix.
  if (!message.isMentioned(client.user) && !message.content.startsWith(settings.prefix)) {
    return;
  }

  // Tokenize the message.
  let tokens = message.content.trim().split(' ');

  // Discard first token if it is the mention.
  if (tokens[0].trim() === `<@${client.user.id}>`) {
    tokens.shift();
  }

  // Discard prefix if it is used.
  if (tokens[0].trim().startsWith(settings.prefix)) {
    tokens[0] = tokens[0].substr(settings.prefix.length);
  }

  // Respond to pings.
  if (tokens[0].trim() === 'ping') {
    message.channel.send(`pong ${Math.round(client.ping)}ms`);
  }
});

client.login(process.env.LOGIN_TOKEN);
