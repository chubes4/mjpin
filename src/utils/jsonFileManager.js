/**
 * File-based persistence utilities for JSON and text data in data/ directory
 */
const fs = require('fs').promises;
const path = require('path');

const dataDir = path.join(__dirname, '../../data');

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