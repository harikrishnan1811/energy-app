const fs = require("fs");
const path = require("path");
const csvFilePath = path.join(
  __dirname,
  "../mock_data/mock_energy_consumption.csv"
);
const jsonFilePath = path.join(
  __dirname,
  "../mock_data/mock_energy_consumption.json"
);

fs.readFile(csvFilePath, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading the CSV file:", err);
    return;
  }

  const lines = data.split("\n");
  // const headers = lines[0].split(',');

  const jsonData = lines.slice(1).map((line) => {
    const values = line.split(",");
    return {
      timestamp: values[0],
      fridge: parseFloat(values[1]),
      oven: parseFloat(values[2]),
      lights: parseFloat(values[3]),
      ev_charger: parseFloat(values[4]),
    };
  });

  fs.writeFile(
    jsonFilePath,
    JSON.stringify(jsonData, null, 2),
    "utf8",
    (err) => {
      if (err) {
        console.error("Error writing the JSON file:", err);
        return;
      }
      console.log("JSON file has been saved.");
    }
  );
});
