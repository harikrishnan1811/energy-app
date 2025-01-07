const fs = require('fs');
const path = require('path');

// Logging Utility
const logError = (error) => {
    const logDir = path.join(process.cwd(), '..', 'logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }

    const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);
    const errorMessage = `${new Date().toISOString()} - ERROR: ${error.message}\n`;
    fs.appendFileSync(logFile, errorMessage);
};

const logInfo = (message) => {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }

    const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);
    const infoMessage = `${new Date().toISOString()} - INFO: ${message}\n`;
    fs.appendFileSync(logFile, infoMessage);
};

module.exports = { logError, logInfo };