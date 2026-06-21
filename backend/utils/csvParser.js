const fs = require('fs');
const csv = require('csv-parser');

/**
 * Parses the farmers locations CSV file and returns a Promise resolving to the parsed list.
 * @param {string} csvPath The path to the CSV file
 * @returns {Promise<Array>} A promise that resolves to the array of parsed farmers
 */
function parseFarmersCSV(csvPath) {
  return new Promise((resolve, reject) => {
    const farmers = [];
    if (!fs.existsSync(csvPath)) {
      return reject(new Error('Farmers CSV file not found'));
    }

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        // Normal row: id,state,latitude,longitude,crops
        if (row.id && row.id.startsWith('crop_')) {
          farmers.push({
            id: row.id,
            state: row.state,
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude),
            crops: row.crops
          });
        } 
        // Re-headered row: state,latitude,longitude,crops,farmerId
        else if (row.id && row.id !== 'state' && row.state && row.latitude) {
          farmers.push({
            id: row.crops, // crops column holds farmerId
            state: row.id,       // id column holds state
            latitude: parseFloat(row.state), // state column holds latitude
            longitude: parseFloat(row.latitude), // latitude column holds longitude
            crops: row.longitude // longitude column holds crops
          });
        }
      })
      .on('end', () => {
        resolve(farmers);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

module.exports = {
  parseFarmersCSV
};
