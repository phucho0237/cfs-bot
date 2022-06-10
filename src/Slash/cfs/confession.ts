import type { Slash } from "../../Interfaces";
import {
  Collection,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} from "discord.js";
import "dotenv/config";
import { getCfsCount, pushCfs } from "../../Database";

export const slash: Slash = {
  name: "confession",
  description: "Create a confession",
  type: "CHAT_INPUT",
  options: [
    {
      type: "STRING",
      name: "content",
      description: "Confession content",
      required: true,
    },
  ],
  run: async (client, interaction) => {
    const guild = client.guilds.cache.get(process.env.GUILD_ID!);

    const isInGuild = await guild?.members.fetch(interaction.user.id);
    if (!isInGuild || isInGuild instanceof Collection)
      return interaction.reply("You are not in the guild!");

    const content = interaction.options.getString("content") || "N/A";

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
        author: interaction.user.id,
        content: content,
        reviewMessageID: msg.id,
        createdAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
        status: "Pending",
        messageID: null,
        threadID: null,
      });

      interaction.reply({
        content: `Your confession #${cfsCount} is pending approval!`,
        ephemeral: true,
      });
    }
  },
};
