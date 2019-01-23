const Discord = require('discord.js');
const _ = require('lodash');
require('dotenv').config();

const client = new Discord.Client();

// TODO: This is temporary placeholder.
const settings = {
  prefix: '!',
  watch: {},
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

// Create an event listener for messages.
client.on('message', async (message) => {
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

  // Disallow if author of message doesn't have permission to use bot.
  if (!message.guild) {
    return;
  }

  let member = message.guild.member(message.author);
  if (!member) {
    message.channel.send('❌ You do not have permission to do this.');
    return;
  }

  if (!member.hasPermission(Discord.Permissions.FLAGS.ADMINISTRATOR)) {
    message.channel.send('❌ You do not have permission to do this.');
    return;
  }

  // Tokenize the message.
  let tokens = message.content.trim().split(' ');
  tokens = _.map(tokens, _.trim);
  tokens = _.filter(tokens, token => !!token);

  // Ignore if no tokens.
  if (tokens.length < 1 || !tokens[0]) {
    return;
  }

  // Discard first token if it is the mention.
  if (tokens[0] === `<@${client.user.id}>`) {
    tokens.shift();

    // Ignore if no more tokens afterwards.
    if (tokens.length < 1 || !tokens[0]) {
      return;
    }
  }

  // Discard prefix if it is used.
  if (tokens[0].startsWith(settings.prefix)) {
    tokens[0] = tokens[0].substr(settings.prefix.length);
  }

  // Handle commands.
  if (tokens[0] === 'ping') {
    // Pings.
    pong(message);
  } else if (tokens[0] === 'prefix') {
    // Change prefix.
    if (!tokens[1] || tokens[1].length < 1) {
      message.channel.send('❌ Cannot use this prefix.');
      return;
    }

    settings.prefix = tokens[1];

    message.channel.send(`✅ Prefix changed to \`${tokens[1]}\`.`);
  } else if (tokens[0] === 'watch') {
    // Watch a message for reactions.
    if (tokens.length < 6) {
      message.channel.send(`**${settings.prefix}watch** channel message reaction notify notification\n\n` +
                           `*channel* The channel to watch.\n` +
                           `*message* The id of the message to watch in *channel*.\n` +
                           `*reaction* The emoji to watch for on *message*.\n` +
                           `*notify* The channel to notify when a new *reaction* is observed.\n` +
                           `*notification* The message to send to the *notify* channel.`);
      return;
    }


    // Parse the channel to watch.
    let watchChannelId;
    let watchChannelMatches = /<#(.+)>/.exec(tokens[1]);
    if (watchChannelMatches && watchChannelMatches[1]) {
      watchChannelId = watchChannelMatches[1];
    } else {
      watchChannelId = tokens[1];
    }

    let watchChannel = client.channels.get(watchChannelId);

    if (!watchChannel || !(watchChannel instanceof Discord.TextChannel)) {
      message.channel.send('❌ I do not see the channel you want me to watch.');
      return;
    }

    // Parse the message to watch.
    let watchMessage;
    try {
      watchMessage = await watchChannel.fetchMessage(tokens[2]);
      if (!watchMessage) {
        message.channel.send('❌ I do not see the message you want me to watch.');
        return;
      }
    } catch (err) {
      message.channel.send('❌ I do not see the message you want me to watch.');
      return;
    }

    let watchReaction = tokens[3];

    // Parse the channel to notify.
    let notifyChannelId;
    let notifyChannelMatches = /<#(.+)>/.exec(tokens[4]);
    if (notifyChannelMatches && notifyChannelMatches[1]) {
      notifyChannelId = notifyChannelMatches[1];
    } else {
      notifyChannelId = tokens[4];
    }

    let notifyChannel = client.channels.get(notifyChannelId);

    if (!notifyChannel || !(notifyChannel instanceof Discord.TextChannel)) {
      message.channel.send('❌ I do not see the channel you want me to notify.');
      return;
    }

    // Join the remaining tokens as the notification to send.
    let notification = tokens.slice(5).join(' ');

    // Persist to settings.
    if (!(watchMessage.id in settings.watch)) {
      settings.watch[watchMessage.id] = {
        watchChannel: watchChannel,
        watchMessage: watchMessage,
        watchReactions: [],
      };
    }

    settings.watch[watchMessage.id].watchReactions.push({
      watchReaction: watchReaction,
      notifyChannel: notifyChannel,
      notification: notification,
    });

    message.channel.send(`✅ I will now be keeping on eye on the ${watchChannel} channel ` +
                         `to see if anyone reacts with a ${watchReaction} on the message with id ${tokens[2]}.\n` +
                         ` \`\`\` ${watchMessage} \`\`\` \n` +
                         `If they do, I will notify the ${notifyChannel} channel with the following notification: \n` +
                         ` \`\`\` ${notification} \`\`\` `);
  }

});

// Create an event listener for reactions.
client.on('messageReactionAdd', async (messageReaction, user) => {
  // Ignore messages not being watched.
  if (!(messageReaction.message.id in settings.watch)) {
    return;
  }

  let watchSettings = settings.watch[messageReaction.message.id];

  // Get the setting for this reaction.
  let notifyChannel;
  let notification;
  for (let watchReactionSetting of watchSettings.watchReactions) {
    if (`<:${messageReaction.emoji.identifier}>` === watchReactionSetting.watchReaction ||
        messageReaction.emoji.name === watchReactionSetting.watchReaction) {
      notifyChannel = watchReactionSetting.notifyChannel;
      notification = watchReactionSetting.notification;
      break;
    }
  }

  if (!notifyChannel || !notification) {
    return;
  }

  // Send out the notification.
  notification = notification.replace(/{{user}}/g, user);
  notifyChannel.send(notification);
});

client.login(process.env.LOGIN_TOKEN);
