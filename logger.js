const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const path = require('path');
const os = require('os');

const ActorType = Object.freeze({ BOT: 'BOT', USER: 'USER',});

function logWithTimestamp(message, actorType = ActorType.BOT) 
{
    const now = new Date();
    const timestamp = now.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "medium" });
    const logMessage = `[${timestamp}] ${message}\n`;
    const parentDir = path.dirname(__dirname);
    const logDir = path.join(parentDir, 'Alysia Bot');

    const logFileName = actorType === ActorType.USER ? 'user_actions.log' : 'bot_actions.log';
    const logFile = path.join(logDir, logFileName);

    if (!fs.existsSync(logDir)) 
    {
        fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(logFile, logMessage, 'utf8');
    console.log(logMessage.trim());
}

async function logFromDatabase() 
{
    try 
    {
        const response = await fetch("https://alysia.mtxserv.com/get_vote.php");
        const data = await response.json();
        if (data.status !== "success") 
        {
            logWithTimestamp("❌ Erreur dans la réponse API: " + data.message);
            return;
        }
        data.data.forEach(entry => { logWithTimestamp(`👤 ${entry.discord_name} (${entry.discord_rp_name}) | 💸 ${entry.bank_value.toLocaleString()}€ | 🗳️ Votes: ${entry.vote_value} | 🕒 ${entry.date_at_withdraw}`); });
    } 
    catch (error) 
    {
        logWithTimestamp("❌ Erreur lors du fetch de la base de données: " + error.message);
    }
}
module.exports = { logWithTimestamp, logFromDatabase, ActorType };