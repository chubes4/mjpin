const fs = require('fs').promises;
const path = require('path');

const dataDir = path.join(__dirname, '../../data');

/**
 * Read and parse JSON file from data directory
 * @param {string} filename - JSON filename
 * @returns {Promise<Object>} Parsed JSON data or empty object if file not found
 */
async function readJsonFile(filename) {
    const filePath = path.join(dataDir, filename);
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return {};
        }
        console.error(`Error reading ${filename}:`, error);
        throw error;
    }
}

/**
 * Write data to JSON file in data directory
 * @param {string} filename - JSON filename
 * @param {Object} data - Data to write
 */
async function writeJsonFile(filename, data) {
    const filePath = path.join(dataDir, filename);
    try {
        await fs.mkdir(dataDir, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Error writing ${filename}:`, error);
        throw error;
    }
}

/**
 * Read text file from data directory
 * @param {string} filename - Text filename
 * @returns {Promise<string|null>} File content or null if not found
 */
async function readTextFile(filename) {
    const filePath = path.join(dataDir, filename);
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return data;
    } catch (error) {
        if (error.code === 'ENOENT') {
            return null;
        }
        console.error(`Error reading ${filename}:`, error);
        throw error;
    }
}

module.exports = {
    readJsonFile,
    writeJsonFile,
    readTextFile,
}; 