const Discord = require('discord.js');
require('dotenv').config();

const client = new Discord.Client();

/**
 * The ready event is vital, it means that only _after_ this will your bot start reacting to information
 * received from Discord
 */
client.on('ready', () => {
  console.log('I am ready!');
});

// Create an event listener for messages
client.on('message', message => {
  // Ignore message from other bots to prevent infinite loop.
  if (message.author.bot) {
    return;
  }

  // If the message is "ping"
  if (message.content === 'ping') {
    // Send "pong" to the same channel
    message.channel.send('pong');
  }
});

client.login(process.env.LOGIN_TOKEN);
