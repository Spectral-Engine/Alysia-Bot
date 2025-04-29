const axios = require("axios");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const { logWithTimestamp } = require("./logger");
const cleanString = (str) => str.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

async function handleLeaderboardCommand(interaction) 
{
    try 
    {
        logWithTimestamp("📊 Récupération du leaderboard via l'API...");
        const response = await axios.get(`https://api.top-serveurs.net/v1/servers/6AECCG43HYBS/players-ranking`);
        const leaderboard = response.data.players;
        logWithTimestamp("✅ Leaderboard récupéré avec succès.");
        const embed = new EmbedBuilder().setTitle("Top 10 des meilleurs votants").setColor("#dc1f1f");

        let leaderboardText = "";
        leaderboard.slice(0, 10).forEach((player, index) => { leaderboardText += `**#${index + 1} - ${player.playername}** - Votes: ${player.votes}\n`; });
        embed.addFields({ name: "", value: leaderboardText, inline: false,});

        await interaction.reply({ embeds: [embed] });
        logWithTimestamp("✅ Leaderboard envoyé avec succès.");
        await assignExpertRole(interaction.guild, leaderboard.slice(0, 10));
    } 
    catch (error) 
    {
        logWithTimestamp(`❌ Erreur lors de la récupération du leaderboard : ${error.response ? error.response.data : error.message}`);
        await interaction.reply({ content: "❌ Une erreur est survenue lors de la récupération du leaderboard.", flags: 64 });
    }
}

async function assignExpertRole(guild, topPlayers) 
{
    try 
    {
        logWithTimestamp("🔍 Recherche du rôle 'Expert en Votes'...");
        const role = guild.roles.cache.find(r => r.name === "Expert en Votes");
        if (!role) 
        {
            logWithTimestamp("❌ Le rôle 'Expert en Votes' n'existe pas.");
            return;
        }
        logWithTimestamp("✅ Rôle trouvé : gestion des membres du top 10.");

        const members = await guild.members.fetch();
        const topPlayerNames = topPlayers.map(player => cleanString(player.playername)); 

        members.forEach(member => {
            const isInTop10 = topPlayerNames.includes(cleanString(member.displayName));
            if (isInTop10) 
            {
                if (!member.roles.cache.has(role.id)) 
                {
                    member.roles.add(role).catch(logWithTimestamp);
                    logWithTimestamp(`✅ Rôle 'Expert en Votes' attribué à ${member.displayName}`);
                } 
                else 
                {
                    logWithTimestamp(`ℹ️ ${member.displayName} a déjà le rôle.`);
                }
            } 
            else 
            {
                if (member.roles.cache.has(role.id)) 
                {
                    member.roles.remove(role).catch(logWithTimestamp);
                    logWithTimestamp(`❌ Rôle 'Expert en Votes' retiré de ${member.displayName}`);
                }
            }
        });
    } 
    catch (error) 
    {
        logWithTimestamp("❌ Erreur lors de la gestion des rôles :", error.message);
    }
}

async function checkLeaderboardAndAssignRoles(guild) 
{
    try 
    {
        logWithTimestamp("📊 Vérification du leaderboard...");
        const response = await axios.get(`https://api.top-serveurs.net/v1/servers/6AECCG43HYBS/players-ranking`);
        const leaderboard = response.data.players;
        logWithTimestamp("✅ Leaderboard récupéré avec succès.");
        await assignExpertRole(guild, leaderboard.slice(0, 10));
        await axios.get("https://alysia.mtxserv.com/add_vote.php");
    } 
    catch (error) 
    {
        logWithTimestamp("❌ Erreur lors de la vérification du leaderboard :", error.message);
    }
}

async function handleBankCommand(interaction) 
{
    try 
    {
        logWithTimestamp("📊 Récupération des votes de l'utilisateur via l'API...");
        const response = await axios.get('https://alysia.mtxserv.com/get_vote.php');
        const playersData = response.data.data;
        const user = playersData.find(player => cleanString(player.discord_rp_name) === cleanString(interaction.member.displayName));
        if (!user || user.vote_value === 0) 
        {
            await interaction.reply({ content: "Vous n'avez pas encore voté, aucun argent ne vous a été versé.", flags: { flags: 64 } });
            logWithTimestamp(`ℹ️ ${interaction.user.username} n'a pas de votes.`);
            return;
        }
        const totalMoney = user.bank_value;
        const bankEmbed = new EmbedBuilder().setTitle("Caisse des Récompenses").setDescription(`Vous avez **${totalMoney.toLocaleString()}€** en récompense de vos votes.`).setColor("#dc1f1f");
        const virementButton = new ButtonBuilder().setCustomId('virement').setLabel('Virement').setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder().addComponents(virementButton);

        await interaction.reply({ embeds: [bankEmbed], components: [row], flags: 64 });
        logWithTimestamp("✅ Informations bancaires envoyées avec succès.");
    } 
    catch (error) 
    {
        logWithTimestamp(`❌ ${interaction.member.displayName} | Erreur lors de la récupération des informations bancaires : ${error.response ? error.response.data : error.message}`);
        await interaction.reply({ content: "❌ Assurez-vous de lier votre compte Steam en utilisant la commande `/auth`. Si vous venez de le faire, patientez un instant avant de réessayer.", flags: 64 });

    }
}
module.exports = { handleLeaderboardCommand, checkLeaderboardAndAssignRoles, handleBankCommand };