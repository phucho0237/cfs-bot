import {
  Message,
  MessageEmbed,
  MessageButton,
  MessageActionRow,
  Collection,
} from "discord.js";
import { Event } from "../Interfaces";
import { getCfsCount, pushCfs } from "../Database";
import Client from "../Client";
import "dotenv/config";

export const event: Event = {
  name: "messageCreate",
  run: async (client: Client, message: Message) => {
    if (message.author.bot) return;
    const guild = client.guilds.cache.get(process.env.GUILD_ID!);
    const isInGuild = await guild?.members.fetch(message.author.id);

    if (!isInGuild || isInGuild instanceof Collection)
      return message.channel.send("You are not in the guild!");

    if (message.channel.type === "DM") {
      const content = message.content;
      let cfsCount = (await getCfsCount()) || 0;

      cfsCount++;

      const embed = new MessageEmbed()
        .setColor("AQUA")
        .setTitle(`Confession #${cfsCount}`)
        .setDescription(content)
        .setTimestamp()
        .setFooter({
          text: "Click the buttons below to approve/reject the confession!",
        });

      const b1 = new MessageButton()
        .setCustomId("approve")
        .setEmoji("✅")
        .setLabel("Approve")
        .setStyle("SUCCESS");

      const b2 = new MessageButton()
        .setCustomId("reject")
        .setEmoji("❌")
        .setLabel("Reject")
        .setStyle("SECONDARY");

      const actionRow = new MessageActionRow().addComponents([b1, b2]);

      const reviewChannel = guild?.channels.cache.get(
        process.env.REVIEW_CHANNEL_ID!
      );

      if (reviewChannel?.type === "GUILD_TEXT") {
        const msg = await reviewChannel?.send({
          embeds: [embed],
          components: [actionRow],
        });

        await pushCfs({
          id: cfsCount,
          author: message.author.id,
          content: content,
          reviewMessageID: msg.id,
          createdAt: new Date(),
          reviewedAt: null,
          reviewedBy: null,
          status: "Pending",
          messageID: null,
          threadID: null,
        });

        message.channel.send({
          content: `Your confession #${cfsCount} is pending approval!`,
        });
      }
    }
    const prefix = "c";
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const cmd = args.shift()?.toLowerCase();
    if (!cmd || cmd.length === 0) return;

    const command =
      client.commands.get(cmd) ||
      client.commands.get(client.aliases.get(cmd) || "");
    if (command) command.run(client, message, args);
  },
};
