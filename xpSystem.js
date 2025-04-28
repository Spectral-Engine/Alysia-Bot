const fs = require('fs');
const path = require('path');
const xpFilePath = path.join(__dirname, 'xpData.json');

function loadXpData() 
{
    if (!fs.existsSync(xpFilePath)) 
    {
        fs.writeFileSync(xpFilePath, JSON.stringify({}), 'utf8');
    }
    return JSON.parse(fs.readFileSync(xpFilePath, 'utf8'));
}

function saveXpData(data) 
{
    fs.writeFileSync(xpFilePath, JSON.stringify(data, null, 4), 'utf8');
}

function calculateLevel(xp) 
{
    let level = 0;
    let xpForNextLevel = 1000;

    while (xp >= xpForNextLevel && level < 100) 
    {
        xp -= xpForNextLevel;
        level++;
        xpForNextLevel += 1000;
    }
    return { level, xpForNextLevel: xpForNextLevel - xp };
}

function addXp(userId, amount) 
{
    const xpData = loadXpData();

    if (!xpData[userId]) 
    {
        xpData[userId] = { xp: 0, level: 0 };
    }
    xpData[userId].xp += amount;
    const { level, xpForNextLevel } = calculateLevel(xpData[userId].xp);
    if (level > xpData[userId].level) 
    {
        xpData[userId].level = level;
        logWithTimestamp(`🎉 ${userId} a atteint le niveau ${level}!`);
    }
    saveXpData(xpData);
    return { level, xp: xpData[userId].xp, xpForNextLevel };
}

function getXp(userId) 
{
    const xpData = loadXpData();
    if (!xpData[userId]) 
    {
        return { xp: 0, level: 0, xpForNextLevel: 1000 };
    }
    const { xp, level } = xpData[userId];
    const { xpForNextLevel } = calculateLevel(xp);
    return { xp, level, xpForNextLevel };
}
module.exports = { addXp, getXp };