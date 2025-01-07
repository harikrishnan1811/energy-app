const { logInfo, logError } = require("../utils/logger");
const pool = require("../config/db");

exports.getInsights = async () => {
  try {
    logInfo("Fetching insights from the database");
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT * FROM public.insights WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 3"
      );
      return result.rows;
    } catch (error) {
      logError("Error fetching insights:", error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logError("Error connecting to the database:", error);
    throw error;
  }
};

exports.getProjectedEnergyUsage = async (device_id = null) => {
  try {
    const client = await pool.connect();
    const monthStart = new Date("2024-12-01T00:00:00Z");
    const monthEnd = new Date("2024-12-31T23:59:59Z");

    let query = `
        SELECT date, total_energy_kwh 
        FROM public.energy_aggregations 
        WHERE date BETWEEN $1 AND $2`;
    let queryParams = [monthStart, monthEnd];

    if (device_id) {
      query += ` AND device_id = $3`;
      queryParams.push(device_id);
    }

    query += ` ORDER BY date;`;

    // Fetch energy data for the specified month and device (if provided)
    const result = await client.query(query, queryParams);

    if (result.rows.length === 0) {
      console.log("No data available for the specified month and device.");
      return;
    }

    let totalEnergy = 0;
    let lastDate;

    result.rows.forEach((row) => {
      totalEnergy += parseFloat(row.total_energy_kwh);
      lastDate = row.date;
    });

    const hoursAvailable = (lastDate - monthStart) / (1000 * 60 * 60);
    const averageHourlyUsage = totalEnergy / hoursAvailable;

    // Calculate projected energy for remaining hours
    const hoursRemaining = (monthEnd - lastDate) / (1000 * 60 * 60);
    const projectedEnergy = totalEnergy + averageHourlyUsage * hoursRemaining;

    // Calculate average daily usage
    const daysInMonth = (monthEnd - monthStart) / (1000 * 60 * 60 * 24);
    const averageDailyUsage = projectedEnergy / daysInMonth;

    const response = {
      total_energy: totalEnergy.toFixed(4),
      projected_energy: projectedEnergy.toFixed(4),
      average_daily_usage: averageDailyUsage.toFixed(4),
    };

    console.log(response);
    return response;
  } catch (error) {
    console.error("Error calculating projected energy usage:", error);
    throw error;
  }
};

exports.getProjectedCost = async (device_id = null) => {
  try {
    const client = await pool.connect();

    const electricityPrice = parseFloat(process.env.ELECTRICITY_PRICE);
    const gridTariff = parseFloat(process.env.GRID_TARIFF);
    const taxesAndFees = parseFloat(process.env.TAXES_AND_FEES);
    const totalCostPerKwh = electricityPrice + gridTariff + taxesAndFees;

    const date = new Date("2024-12-26");
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const daysPassed = date.getDate();
    const totalDaysInMonth = monthEnd.getDate();

    let query = `
        SELECT SUM(energy_kwh) AS total_energy_kwh
        FROM public.energy_data
        WHERE date_trunc('month', timestamp) = date_trunc('month', $1::timestamp)`;
    const queryParams = [date];

    if (device_id) {
      query += ` AND device_id = $2`;
      queryParams.push(device_id);
    }

    const result = await client.query(query, queryParams);
    const totalEnergy = parseFloat(result.rows[0].total_energy_kwh || 0);

    const dailyAverage = daysPassed > 0 ? totalEnergy / daysPassed : 0;
    const projectedEnergy = dailyAverage * totalDaysInMonth;

    const totalCost = totalEnergy * totalCostPerKwh;
    const projectedCost = projectedEnergy * totalCostPerKwh;
    const averageDailyCost = projectedCost / totalDaysInMonth;

    const response = {
      total_cost: totalCost.toFixed(2),
      projected_cost: projectedCost.toFixed(2),
      average_daily_cost: averageDailyCost.toFixed(2),
    };

    console.log(response);
    return response;
  } catch (error) {
    console.error("Error calculating projected cost:", error);
    throw error;
  }
};

exports.getDevices = async () => {
  try {
    const client = await pool.connect();
    const query = "SELECT id, device_name FROM public.devices";
    const result = await client.query(query);
    await client.release();
    return result.rows;
  } catch (error) {
    console.error("Error fetching devices:", error);
    throw error;
  }
};
