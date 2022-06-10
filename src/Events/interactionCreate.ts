import type { Interaction } from "discord.js";
import { MessageEmbed } from "discord.js";
import { getCfs, updateCfs } from "../Database";
import { Event } from "../Interfaces";

export const event: Event = {
  name: "interactionCreate",
  run: async (client, interaction: Interaction) => {
    if (interaction.isCommand()) {
      const cmd = client.slash.get(interaction.commandName);
      if (!cmd) return;
      cmd.run(client, interaction);
    }
    if (interaction.isButton()) {
      const message = await interaction.channel?.messages.fetch(
        interaction.message.id
      );
      const confession = await getCfs(interaction.message.id);
      switch (interaction.customId) {
        case "approve": {
          const cfsChannel = interaction.guild?.channels.cache.get(
            process.env.CFS_CHANNEL_ID!
          );
          if (cfsChannel?.type !== "GUILD_TEXT") return;

          const embed = new MessageEmbed(
            interaction.message.embeds[0]
          ).setFooter({ text: "Reply to confession below!" });

          const cfs = await cfsChannel.send({ embeds: [embed] });

          const cfsThread = await cfs.startThread({
            name: `CFS #${confession.id} - Reply`,
            autoArchiveDuration: "MAX",
          });

          cfsThread.send(`You can reply to confession in here!`);

          await updateCfs({
            ...confession,
            reviewedBy: interaction.user.id,
            reviewedAt: new Date(),
            status: "Approved",
            messageID: cfs.id,
            threadID: cfsThread.id,
          });

          if (message?.editable)
            message.edit({
              components: [],
              content: `Approved by: ${interaction.user}`,
              allowedMentions: { repliedUser: false },
            });

          const author = await interaction.guild?.members.fetch(
            confession.author
          );
          await author
            ?.send(`Your confession has been approved!`)
            .catch(() => null);

          break;
        }
        case "reject": {
          if (message?.editable)
            message.edit({
              components: [],
              content: `Rejected by: ${interaction.user}`,
              allowedMentions: { repliedUser: false },
            });

          await updateCfs({
            ...confession,
            reviewedBy: interaction.user.id,
            reviewedAt: new Date(),
            status: "Rejected",
          });
        }
      }
    }
  },
};
