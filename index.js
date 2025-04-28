require("dotenv").config();
const axios = require("axios");
const cleanString = (str) => str.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const { Client, GatewayIntentBits, SlashCommandBuilder, ActivityType,ButtonBuilder, ActionRowBuilder, EmbedBuilder, ButtonStyle, ChannelType  } = require("discord.js");
const { handleLeaderboardCommand, checkLeaderboardAndAssignRoles, handleBankCommand } = require("./leaderboard");
const { logWithTimestamp, logFromDatabase, ActorType } = require("./logger");
const { addXp, getXp } = require('./xpSystem');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
    ],
});

client.once("ready", async () => {
    logWithTimestamp(`✅ Connecté en tant que ${client.user.tag}`);
    client.user.setBanner('./alysia_banner.png');
    client.user.setActivity("Alysia Roleplay", { type: ActivityType.Streaming, url: "https://www.twitch.tv/alysiaroleplay" });
    //await client.application.commands.set([]);//delete all commands   
    const guild = client.guilds.cache.first();
    if (!guild) 
    {
        logWithTimestamp("❌ Aucun serveur trouvé dans le cache.");
        return;
    }
    logWithTimestamp("⚙️ Enregistrement des commandes slash...");
    await client.application.commands.create(new SlashCommandBuilder().setName("auth").setDescription("Lier votre compte Steam."));    
    await client.application.commands.create(new SlashCommandBuilder().setName("leaderboard").setDescription("Affiche le top 10 des meilleurs votants!"));
    await client.application.commands.create(new SlashCommandBuilder().setName("bank").setDescription("Affiche combien d'argent vous avez accumulé grâce à vos votes."));   
    await client.application.commands.create(new SlashCommandBuilder().setName('level').setDescription("Affiche votre niveau et votre XP."));
    await client.application.commands.create(new SlashCommandBuilder().setName("broadcast").setDescription("Envoyer un message à tous les membres du serveur.").addStringOption(option =>option.setName("title").setDescription("Le titre de l'embed.").setRequired(true)).addStringOption(option => option.setName("message").setDescription("Le contenu du message.").setRequired(true)));
    logWithTimestamp("✅ Commandes slash enregistrées avec succès.");

    setInterval(async () => {
        logWithTimestamp("⏳ Début de la vérification automatique du leaderboard...");
        try 
        {
            await checkLeaderboardAndAssignRoles(guild);
            logWithTimestamp("✅ Vérification automatique terminée avec succès.");
        } 
        catch (error) 
        {
            logWithTimestamp(`❌ Erreur lors de la vérification automatique: ${error.message}`);
        }
    }, 21500);
    setInterval(() => { logWithTimestamp("⏳ Récupération des logs depuis la base de données..."); logFromDatabase();}, 20000);
});

client.on("interactionCreate", async (interaction) => {
    if (interaction.isCommand()) 
    {
        logWithTimestamp(`📥 Commande reçue: ${interaction.commandName}`);
        
        if (interaction.commandName === "broadcast") {
            if (!interaction.guild || !interaction.member) {
                await interaction.reply({ content: "❌ Cette commande doit être utilisée dans un serveur.", ephemeral: true });
                return;
            }
        
            const adminRole = interaction.guild.roles.cache.find(role => role.name === "Admin");
        
            if (!adminRole) {
                await interaction.reply({ content: "❌ Le rôle Admin n'existe pas sur ce serveur.", ephemeral: true });
                return;
            }
        
            if (!interaction.member.roles.cache.has(adminRole.id)) {
                await interaction.reply({ content: "❌ Vous n'avez pas la permission d'utiliser cette commande.", ephemeral: true });
                return;
            }
        
            const title = interaction.options.getString("title");
            const messageContent = interaction.options.getString("message");
            const formattedMessage = messageContent.replace(/\\n/g, '\n');
        
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(formattedMessage)
                .setColor("#dc1f1f");
        
            const members = await interaction.guild.members.fetch();
            let successCount = 0;
        
            for (const member of members.values()) {
                if (!member.user.bot) {
                    try {
                        await member.send({ embeds: [embed] });
                        successCount++;
                    } catch (err) {
                        console.error(`Impossible d'envoyer un message à ${member.user.tag}:`, err);
                    }
                }
            }
        
            console.log(`✅ Message envoyé avec succès à ${successCount} membre(s).`);
        
            await interaction.reply({ content: `✅ Message envoyé à ${successCount} membre(s).`, ephemeral: true });
        }
        
        if (interaction.commandName === "leaderboard") 
        {
            if (!interaction.inGuild()) {
                await interaction.reply({
                    content: "❌ Cette commande doit être utilisée dans un serveur.",
                    ephemeral: true,
                });
                return;
            }
            const display_name = interaction.member.displayName;
            try 
            {
                await handleLeaderboardCommand(interaction);
                logWithTimestamp(`✅ ${display_name} | Commande /leaderboard exécutée avec succès.`, ActorType.USER);
            } 
            catch (error) 
            {
                logWithTimestamp(`❌ ${display_name} | Erreur lors de l'exécution de la commande /leaderboard : ${error.message}`, ActorType.USER);
            }
        } 
        if (interaction.commandName === "auth") 
        {
            if (!interaction.inGuild()) {
                await interaction.reply({
                    content: "❌ Cette commande doit être utilisée dans un serveur.",
                    ephemeral: true,
                });
                return;
            }
            const displayName = interaction.member.displayName;
            const userName = interaction.user.username;
            logWithTimestamp(`✅ ${displayName} | Commande /auth exécutée avec succès.`, ActorType.USER);
            const linkURL = `https://alysia.mtxserv.com/init-openId.php?displayName=${encodeURIComponent(displayName)}&userName=${encodeURIComponent(userName)}`;                
            const embed = new EmbedBuilder().setTitle("Synchronisation avec Steam...").setDescription("Cliquez sur le bouton ci-dessous pour lier votre compte Steam.").setColor("#dc1f1f");
            const button = new ButtonBuilder().setLabel("Lier mon compte").setStyle(ButtonStyle.Link).setURL(linkURL);     
            const row = new ActionRowBuilder().addComponents(button);
            await interaction.reply({embeds: [embed], components: [row], ephemeral: true});
        }
        if (interaction.commandName === "bank") 
        {
            if (!interaction.inGuild()) {
                await interaction.reply({
                    content: "❌ Cette commande doit être utilisée dans un serveur.",
                    ephemeral: true,
                });
                return;
            }
            const display_name = interaction.member.displayName;
            try 
            {
                await handleBankCommand(interaction);
                logWithTimestamp(`✅ ${display_name} | Commande /bank exécutée avec succès.`, ActorType.USER);
            } 
            catch (error) 
            {
                logWithTimestamp(`❌ ${display_name} | Erreur lors de l'exécution de la commande /bank : ${error.message}`, ActorType.USER);
            }
        }
        if (interaction.commandName === "level") 
        { 
            if (!interaction.inGuild()) {
                await interaction.reply({
                    content: "❌ Cette commande doit être utilisée dans un serveur.",
                    ephemeral: true,
                });
                return;
            }
            const display_name = interaction.member.displayName;
            const { xp, level, xpForNextLevel } = getXp(interaction.user.id);
            await interaction.reply({
                content: `**${display_name}**, vous êtes au niveau **${level}** avec **${xp} XP**. Il vous reste **${xpForNextLevel} XP** pour atteindre le niveau suivant.`,
                ephemeral: true,
            });
        }
    }

    if (interaction.isButton()) 
    {
        if (interaction.customId === 'virement') 
        {
            const newEmbed = new EmbedBuilder().setTitle("Caisse des Récompenses").setDescription("Assurez-vous d'être déconnecté du serveur ou dans le lobby avant d'effectuer un transfert, sinon vous ne le recevrez pas.").setColor("#dc1f1f");     
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('virement_accept').setLabel("J'ai compris").setStyle(ButtonStyle.Secondary),);    
            await interaction.update({ embeds: [newEmbed], components: [row]});
        }
        if (interaction.customId === 'virement_accept') 
        {
            const discordName = interaction.member.displayName;        
            try 
            {
                const formData = new URLSearchParams();
                formData.append('discord_rp_name', discordName);
                const response = await axios.post('https://alysia.mtxserv.com/transfer_money.php', formData);

                if (response.data && typeof response.data === 'object') 
                {
                    const result = response.data;
                    if (result.success) 
                    {
                        logWithTimestamp(`✅ ${discordName} | ${result.bank_value_transferred}€ a été transféré.`, ActorType.USER);
                        await interaction.reply({ content: `Votre virement de **${result.bank_value_transferred}€** a été effectué avec succès.`, ephemeral: true });
                    }
                    else 
                    {
                        logWithTimestamp(`❌ ${discordName} | ${result.message || 'Erreur inconnue'}`, ActorType.USER);
                        await interaction.reply({ content: `${result.message || 'Erreur inconnue'}`, ephemeral: true });
                    }
                } 
                else 
                {
                    logWithTimestamp(`❌ ${discordName} | La réponse du serveur est invalide.`, ActorType.USER);
                    await interaction.reply({ content: 'La réponse du serveur est invalide.', ephemeral: true });
                }
            } 
            catch (error) 
            {
                logWithTimestamp(`❌ ${discordName} | Une erreur est survenue lors du virement.`, ActorType.USER);
                await interaction.reply({ content: 'Une erreur est survenue lors du virement.', ephemeral: true });
            }
        }
    }
});

client.on('messageCreate', async (message) => 
{
    if (message.author.bot) return; 

    const { level, xp, xpForNextLevel } = addXp(message.author.id, 50);
    logWithTimestamp(`📥 ${message.author.username} a gagné 50 XP. Niveau: ${level}, XP: ${xp}/${xpForNextLevel}`);
});

client.on('messageReactionAdd', async (reaction, user) => 
{
    if (user.bot) return;
    try 
    {
        if (reaction.partial) await reaction.fetch();
        if (reaction.message.partial) await reaction.message.fetch();
    } 
    catch (err) 
    {
        logWithTimestamp("Erreur lors du fetch de la réaction ou du message :", err);
        return;
    }
    const { level, xp, xpForNextLevel } = addXp(user.id, 25);
    logWithTimestamp(`👍 ${user.username} a gagné 25 XP. Niveau: ${level}, XP: ${xp}/${xpForNextLevel}`);
});

client.login(process.env.TOKEN);
