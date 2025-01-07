// const insightFactory = require("../factories/insightFactory");
const { logInfo, logError } = require("../utils/logger");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

const devicesFilePath = path.join(__dirname, "../mock_data/devices.json");
const energyConsumptionFilePath = path.join(
  __dirname,
  "../mock_data/mock_energy_consumption.json"
);
const costPerKwh = parseFloat(process.env.COST_PER_KWH);

const deviceNameToPropertyName = {
  Fridge: "fridge",
  Oven: "oven",
  Lights: "lights",
  "EV Charger": "ev_charger",
};

// Store raw energy data from JSON files into the database
exports.storeRawData = async () => {
  try {
    logInfo("Storing raw energy data from JSON files into the database");

    // Read the JSON files
    const { devices: devicesData } = JSON.parse(
      fs.readFileSync(devicesFilePath, "utf8")
    );
    const energyConsumptionData = JSON.parse(
      fs.readFileSync(energyConsumptionFilePath, "utf8")
    );

    const devices = [];
    const rawData = [];

    const client = await pool.connect(); // Acquire a connection from the pool

    try {
      await client.query("BEGIN"); // Start a transaction for data integrity

      for (const device of devicesData) {
        let deviceId;
        const existingDeviceQuery = await client.query(
          `SELECT id FROM public.devices 
                   WHERE device_name = $1 LIMIT 1`,
          [device.device_name]
        );

        if (existingDeviceQuery.rowCount > 0) {
          deviceId = existingDeviceQuery.rows[0].id;
        } else {
          deviceId = uuidv4();
          devices.push({
            id: deviceId,
            device_name: device.device_name,
            unit: device.unit,
          });
        }

        // Process energy consumption data for the current device
        const propertyName = deviceNameToPropertyName[device.device_name];
        if (propertyName) {
          for (const record of energyConsumptionData) {
            const energy_kwh = record[propertyName];
            if (energy_kwh !== undefined) {
              rawData.push({
                timestamp: record.timestamp,
                device_id: deviceId,
                energy_kwh: parseFloat(energy_kwh),
                is_processed: false,
              });
            }
          }
        }
      }

      // Bulk insert new devices (if any)
      if (devices.length > 0) {
        const deviceInsertValues = devices
          .map(
            (device) =>
              `('${device.id}', '${device.device_name}', '${device.unit}')`
          )
          .join(",");

        await client.query(`
                  INSERT INTO public.devices (id, device_name, unit)
                  VALUES ${deviceInsertValues}
              `);
      }

      // Bulk insert energy data
      if (rawData.length > 0) {
        const rawInsertValues = rawData
          .map(
            (data) =>
              `('${data.timestamp}', '${data.device_id}', ${data.energy_kwh}, FALSE)`
          )
          .join(",");

        await client.query(`
                  INSERT INTO public.energy_data (timestamp, device_id, energy_kwh, is_processed)
                  VALUES ${rawInsertValues}
              `);
      }

      await client.query("COMMIT"); // Commit the transaction if all inserts succeed
      logInfo("Raw data stored successfully");
    } catch (error) {
      await client.query("ROLLBACK"); // Rollback transaction on error
      logError("Error during data insertion:", error);
      throw error;
    } finally {
      client.release(); // Release the pool connection
    }
  } catch (error) {
    logError("Error connecting to the database:", error);
    throw error;
  }
};

exports.getStats = async (date, type) => {
  try {
    const client = await pool.connect();
    let query, previousQuery, peakHourQuery;

    if (type === "hourly") {
      query = `
        SELECT device_id, date_trunc('hour', timestamp) AS hour, 
               SUM(energy_kwh) AS total_energy_kwh,
               MAX(energy_kwh) AS peak_energy_kwh,
               MIN(energy_kwh) AS off_peak_energy_kwh,
               EXTRACT(HOUR FROM timestamp) AS peak_hour
        FROM public.energy_data
        WHERE date_trunc('day', timestamp) = date_trunc('day', $1::timestamp)
        GROUP BY device_id, hour, peak_hour
      `;
      previousQuery = `
        SELECT device_id, date_trunc('hour', timestamp) AS hour, 
               SUM(energy_kwh) AS total_energy_kwh,
               MAX(energy_kwh) AS peak_energy_kwh,
               MIN(energy_kwh) AS off_peak_energy_kwh,
               EXTRACT(HOUR FROM timestamp) AS peak_hour
        FROM public.energy_data
        WHERE date_trunc('day', timestamp) = date_trunc('day', $1::timestamp) - INTERVAL '1 day'
        GROUP BY device_id, hour, peak_hour
      `;
      peakHourQuery = `
        SELECT device_id, EXTRACT(HOUR FROM timestamp) AS peak_hour
        FROM public.energy_data
        WHERE date_trunc('day', timestamp) = date_trunc('day', $1::timestamp) - INTERVAL '1 day'
        GROUP BY device_id, peak_hour
        ORDER BY SUM(energy_kwh) DESC
        LIMIT 1
      `;
    } else if (type === "monthly") {
      query = `
        SELECT device_id, date_trunc('day', timestamp) AS day, 
               SUM(energy_kwh) AS total_energy_kwh,
               MAX(energy_kwh) AS peak_energy_kwh,
               MIN(energy_kwh) AS off_peak_energy_kwh,
               EXTRACT(DAY FROM timestamp) AS peak_hour
        FROM public.energy_data
        WHERE date_trunc('month', timestamp) = date_trunc('month', $1::timestamp)
        GROUP BY device_id, day, peak_hour
      `;
      previousQuery = `
        SELECT device_id, date_trunc('day', timestamp) AS day, 
               SUM(energy_kwh) AS total_energy_kwh,
               MAX(energy_kwh) AS peak_energy_kwh,
               MIN(energy_kwh) AS off_peak_energy_kwh,
               EXTRACT(DAY FROM timestamp) AS peak_hour
        FROM public.energy_data
        WHERE date_trunc('month', timestamp) = date_trunc('month', $1::timestamp) - INTERVAL '1 month'
        GROUP BY device_id, day, peak_hour
      `;
      peakHourQuery = `
        SELECT device_id, EXTRACT(DAY FROM timestamp) AS peak_hour
        FROM public.energy_data
        WHERE date_trunc('month', timestamp) = date_trunc('month', $1::timestamp) - INTERVAL '1 month'
        GROUP BY device_id, peak_hour
        ORDER BY SUM(energy_kwh) DESC
        LIMIT 1
      `;
    } else {
      throw new Error("Invalid type. Must be 'hourly' or 'monthly'.");
    }

    const result = await client.query(query, [date]);
    const previousResult = await client.query(previousQuery, [date]);
    const peakHourResult = await client.query(peakHourQuery, [date]);

    const aggregations = result.rows.map((row) => ({
      device_id: row.device_id,
      date: row.hour || row.day,
      total_energy_kwh: row.total_energy_kwh,
      total_cost: row.total_energy_kwh * costPerKwh,
      peak_energy_kwh: row.peak_energy_kwh,
      off_peak_energy_kwh: row.off_peak_energy_kwh,
      peak_to_off_peak_ratio: (
        row.peak_energy_kwh / row.off_peak_energy_kwh
      ).toFixed(2),
      peak_hour: row.peak_hour,
      finalized: true,
    }));

    const previousAggregations = previousResult.rows.reduce((acc, row) => {
      acc[row.device_id] = {
        total_energy_kwh: row.total_energy_kwh,
        total_cost: row.total_energy_kwh * costPerKwh,
        peak_energy_kwh: row.peak_energy_kwh,
        off_peak_energy_kwh: row.off_peak_energy_kwh,
        peak_to_off_peak_ratio: (
          row.peak_energy_kwh / row.off_peak_energy_kwh
        ).toFixed(2),
        peak_hour: row.peak_hour,
      };
      return acc;
    }, {});

    const peakHourData = peakHourResult.rows.reduce((acc, row) => {
      acc += +row.peak_hour;
      return acc;
    }, 0);

    const percentageChanges = aggregations.map((agg) => {
      const previous = previousAggregations[agg.device_id] || {};
      const percentageChange = (current, previous) => {
        if (previous === 0) {
          return current === 0 ? 0 : 100;
        }
        return (((current - previous) / previous) * 100).toFixed(2);
      };

      return {
        ...agg,
        total_energy_kwh_percentage_change: percentageChange(
          agg.total_energy_kwh,
          previous.total_energy_kwh
        ),
        total_cost_percentage_change: percentageChange(
          agg.total_cost,
          previous.total_cost
        ),
        peak_energy_kwh_percentage_change: percentageChange(
          agg.peak_energy_kwh,
          previous.peak_energy_kwh
        ),
        off_peak_energy_kwh_percentage_change: percentageChange(
          agg.off_peak_energy_kwh,
          previous.off_peak_energy_kwh
        ),
        peak_to_off_peak_ratio_percentage_change: percentageChange(
          agg.peak_to_off_peak_ratio,
          previous.peak_to_off_peak_ratio
        ),
        trend:
          agg.total_energy_kwh >= (previous.total_energy_kwh || 0)
            ? "up"
            : "down",
        previous_peak_hour: peakHourData || null,
      };
    });

    await client.release();
    return percentageChanges;
  } catch (error) {
    logError("Error calculating energy aggregations:", error);
    throw error;
  }
};

exports.getPeakOffPeakRatio = async (date, type) => {
  try {
    const client = await pool.connect();
    let query, previousQuery;

    if (type === "hourly") {
      query = `
        SELECT 
          SUM(energy_kwh) FILTER (WHERE EXTRACT(HOUR FROM timestamp) >= 7 AND EXTRACT(HOUR FROM timestamp) < 19) AS peak_energy_kwh,
          SUM(energy_kwh) FILTER (WHERE EXTRACT(HOUR FROM timestamp) < 7 OR EXTRACT(HOUR FROM timestamp) >= 19) AS off_peak_energy_kwh
        FROM public.energy_data
        WHERE date_trunc('day', timestamp) = date_trunc('day', $1::timestamp)
      `;
      previousQuery = `
        SELECT 
          SUM(energy_kwh) FILTER (WHERE EXTRACT(HOUR FROM timestamp) >= 7 AND EXTRACT(HOUR FROM timestamp) < 19) AS peak_energy_kwh,
          SUM(energy_kwh) FILTER (WHERE EXTRACT(HOUR FROM timestamp) < 7 OR EXTRACT(HOUR FROM timestamp) >= 19) AS off_peak_energy_kwh
        FROM public.energy_data
        WHERE date_trunc('day', timestamp) = date_trunc('day', $1::timestamp) - INTERVAL '1 day'
      `;
    } else if (type === "monthly") {
      query = `
        SELECT 
          SUM(energy_kwh) FILTER (WHERE EXTRACT(DOW FROM timestamp) IN (1, 2, 3, 4, 5)) AS peak_energy_kwh,
          SUM(energy_kwh) FILTER (WHERE EXTRACT(DOW FROM timestamp) IN (0, 6)) AS off_peak_energy_kwh
        FROM public.energy_data
        WHERE date_trunc('month', timestamp) = date_trunc('month', $1::timestamp)
      `;
      previousQuery = `
        SELECT 
          SUM(energy_kwh) FILTER (WHERE EXTRACT(DOW FROM timestamp) IN (1, 2, 3, 4, 5)) AS peak_energy_kwh,
          SUM(energy_kwh) FILTER (WHERE EXTRACT(DOW FROM timestamp) IN (0, 6)) AS off_peak_energy_kwh
        FROM public.energy_data
        WHERE date_trunc('month', timestamp) = date_trunc('month', $1::timestamp) - INTERVAL '1 month'
      `;
    } else {
      throw new Error("Invalid type. Must be 'hourly' or 'monthly'.");
    }

    const result = await client.query(query, [date]);
    const previousResult = await client.query(previousQuery, [date]);
    const { peak_energy_kwh, off_peak_energy_kwh } = result.rows[0];
    const {
      peak_energy_kwh: previous_peak_energy_kwh,
      off_peak_energy_kwh: previous_off_peak_energy_kwh,
    } = previousResult.rows[0];

    await client.release();
    return {
      peak_energy_kwh,
      off_peak_energy_kwh,
      peak_to_off_peak_ratio: isNaN(peak_energy_kwh / off_peak_energy_kwh)
        ? 0
        : (peak_energy_kwh / off_peak_energy_kwh).toFixed(2),
      previous_peak_energy_kwh,
      previous_off_peak_energy_kwh,
      previous_peak_to_off_peak_ratio: isNaN(
        previous_peak_energy_kwh / previous_off_peak_energy_kwh
      )
        ? 0
        : (previous_peak_energy_kwh / previous_off_peak_energy_kwh).toFixed(2),
    };
  } catch (error) {
    logError("Error calculating peak to off-peak ratio:", error);
    throw error;
  }
};

exports.getTotalEnergyUsage = async (date, type) => {
  try {
    const client = await pool.connect();
    let query, previousQuery;

    if (type === "hourly") {
      query = `
        SELECT SUM(energy_kwh) AS total_energy_kwh
        FROM public.energy_data
        WHERE date_trunc('day', timestamp) = date_trunc('day', $1::timestamp)
      `;
      previousQuery = `
        SELECT SUM(energy_kwh) AS total_energy_kwh
        FROM public.energy_data
        WHERE date_trunc('day', timestamp) = date_trunc('day', $1::timestamp) - INTERVAL '1 day'
      `;
    } else if (type === "monthly") {
      query = `
        SELECT SUM(energy_kwh) AS total_energy_kwh
        FROM public.energy_data
        WHERE date_trunc('month', timestamp) = date_trunc('month', $1::timestamp)
      `;
      previousQuery = `
        SELECT SUM(energy_kwh) AS total_energy_kwh
        FROM public.energy_data
        WHERE date_trunc('month', timestamp) = date_trunc('month', $1::timestamp) - INTERVAL '1 month'
      `;
    } else {
      throw new Error("Invalid type. Must be 'hourly' or 'monthly'.");
    }

    const result = await client.query(query, [date]);
    const previousResult = await client.query(previousQuery, [date]);

    const totalEnergy = result.rows[0].total_energy_kwh || 0;
    const previousTotalEnergy = previousResult.rows[0].total_energy_kwh || 0;
    const changeFromPreviousCurrent =
      previousTotalEnergy === 0
        ? totalEnergy === 0
          ? 0
          : 100
        : (
            ((totalEnergy - previousTotalEnergy) / previousTotalEnergy) *
            100
          ).toFixed(2);

    await client.release();
    return {
      total_energy: totalEnergy,
      previous_total_energy: previousTotalEnergy,
      change_from_previous_current: changeFromPreviousCurrent,
    };
  } catch (error) {
    logError("Error calculating total energy usage:", error);
    throw error;
  }
};

exports.getPeakHour = async (date, type) => {
  try {
    const client = await pool.connect();
    let peakHourQuery, previousPeakHourQuery;

    if (type === "hourly") {
      peakHourQuery = `
        SELECT EXTRACT(HOUR FROM timestamp) AS peak_hour
        FROM public.energy_data
        WHERE date_trunc('day', timestamp) = date_trunc('day', $1::timestamp)
        GROUP BY peak_hour
        ORDER BY SUM(energy_kwh) DESC
        LIMIT 1
      `;
      previousPeakHourQuery = `
        SELECT EXTRACT(HOUR FROM timestamp) AS peak_hour
        FROM public.energy_data
        WHERE date_trunc('day', timestamp) = date_trunc('day', $1::timestamp) - INTERVAL '1 day'
        GROUP BY peak_hour
        ORDER BY SUM(energy_kwh) DESC
        LIMIT 1
      `;
    } else if (type === "monthly") {
      peakHourQuery = `
        SELECT EXTRACT(HOUR FROM timestamp) AS peak_hour
        FROM public.energy_data
        WHERE date_trunc('month', timestamp) = date_trunc('month', $1::timestamp)
        GROUP BY peak_hour
        ORDER BY SUM(energy_kwh) DESC
        LIMIT 1
      `;
      previousPeakHourQuery = `
        SELECT EXTRACT(HOUR FROM timestamp) AS peak_hour
        FROM public.energy_data
        WHERE date_trunc('month', timestamp) = date_trunc('month', $1::timestamp) - INTERVAL '1 month'
        GROUP BY peak_hour
        ORDER BY SUM(energy_kwh) DESC
        LIMIT 1
      `;
    } else {
      throw new Error("Invalid type. Must be 'hourly' or 'monthly'.");
    }

    const peakHourResult = await client.query(peakHourQuery, [date]);
    const previousPeakHourResult = await client.query(previousPeakHourQuery, [
      date,
    ]);

    await client.release();

    return {
      peak_hour: peakHourResult.rows[0]?.peak_hour || 0,
      previous_peak_hour: previousPeakHourResult.rows[0]?.peak_hour || 0,
    };
  } catch (error) {
    logError("Error calculating peak hour:", error);
    throw error;
  }
};

exports.getConsumptionChartData = async (date, type) => {
  try {
    const client = await pool.connect();
    let query, previousQuery;

    if (type === "hourly") {
      query = `
        SELECT EXTRACT(HOUR FROM timestamp) AS hour, SUM(energy_kwh) AS y
        FROM public.energy_data
        WHERE date_trunc('day', timestamp) = date_trunc('day', $1::timestamp)
        GROUP BY hour
        ORDER BY hour
      `;
      previousQuery = `
        SELECT EXTRACT(HOUR FROM timestamp) AS hour, SUM(energy_kwh) AS y
        FROM public.energy_data
        WHERE date_trunc('day', timestamp) = date_trunc('day', $1::timestamp) - INTERVAL '1 day'
        GROUP BY hour
        ORDER BY hour
      `;
    } else if (type === "monthly") {
      query = `
        SELECT 
          EXTRACT(DAY FROM timestamp) || '-' || LPAD(EXTRACT(HOUR FROM timestamp)::text, 2, '0') AS x, 
          SUM(energy_kwh) AS y
        FROM public.energy_data
        WHERE date_trunc('month', timestamp) = date_trunc('month', $1::timestamp)
        GROUP BY x
        ORDER BY x
      `;
      previousQuery = `
        SELECT 
          EXTRACT(DAY FROM timestamp) || '-' || LPAD(EXTRACT(HOUR FROM timestamp)::text, 2, '0') AS x, 
          SUM(energy_kwh) AS y
        FROM public.energy_data
        WHERE date_trunc('month', timestamp) = date_trunc('month', $1::timestamp) - INTERVAL '1 month'
        GROUP BY x
        ORDER BY x
      `;
    } else {
      await client.release();
      throw new Error("Invalid type. Must be 'hourly' or 'monthly'.");
    }

    const [result, previousResult] = await Promise.all([
      client.query(query, [date]),
      client.query(previousQuery, [date]),
    ]);

    const formatHourLabel = (label) => {
      if (type === "hourly") {
        const hour = parseInt(label, 10);
        const period = hour < 12 ? "AM" : "PM";
        const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
        return `${formattedHour} ${period}`;
      }
      return label; // For monthly, return the label as is
    };

    const data = result.rows.map((row) => ({
      x: formatHourLabel(row.hour || row.x), // Format hour label
      y: row.y,
    }));

    const previousData = previousResult.rows.map((row) => ({
      x: formatHourLabel(row.hour || row.x), // Format hour label
      y: row.y,
    }));

    await client.release();

    return {
      data,
      previousData,
    };
  } catch (error) {
    console.error("Error fetching consumption chart data:", error);
    throw error;
  }
};

exports.getTotalCost = async (date, type) => {
  try {
    const client = await pool.connect();
    const electricityPrice = parseFloat(process.env.ELECTRICITY_PRICE);
    const gridTariff = parseFloat(process.env.GRID_TARIFF);
    const taxesAndFees = parseFloat(process.env.TAXES_AND_FEES);

    const totalCostPerKwh = electricityPrice + gridTariff + taxesAndFees;
    let query, previousQuery;

    if (type === "hourly") {
      query = `
        SELECT SUM(energy_kwh) * $2 AS total_cost
        FROM public.energy_data
        WHERE date_trunc('day', timestamp) = date_trunc('day', $1::timestamp)
      `;
      previousQuery = `
        SELECT SUM(energy_kwh) * $2 AS total_cost
        FROM public.energy_data
        WHERE date_trunc('day', timestamp) = date_trunc('day', $1::timestamp) - INTERVAL '1 day'
      `;
    } else if (type === "monthly") {
      query = `
        SELECT SUM(energy_kwh) * $2 AS total_cost
        FROM public.energy_data
        WHERE date_trunc('month', timestamp) = date_trunc('month', $1::timestamp)
      `;
      previousQuery = `
        SELECT SUM(energy_kwh) * $2 AS total_cost
        FROM public.energy_data
        WHERE date_trunc('month', timestamp) = date_trunc('month', $1::timestamp) - INTERVAL '1 month'
      `;
    } else {
      throw new Error("Invalid type. Must be 'hourly' or 'monthly'.");
    }

    const result = await client.query(query, [date, totalCostPerKwh]);
    const previousResult = await client.query(previousQuery, [
      date,
      totalCostPerKwh,
    ]);

    const totalCost = result.rows[0].total_cost || 0;
    const previousTotalCost = previousResult.rows[0].total_cost || 0;
    const changeFromPreviousCurrent =
      previousTotalCost === 0
        ? totalCost === 0
          ? 0
          : 100
        : (((totalCost - previousTotalCost) / previousTotalCost) * 100).toFixed(
            2
          );

    await client.release();
    return {
      total_cost: totalCost,
      previous_total_cost: previousTotalCost,
      change_from_previous_current: changeFromPreviousCurrent,
    };
  } catch (error) {
    logError("Error calculating total cost:", error);
    throw error;
  }
};

exports.getCostBreakDownByDevices = async (date, type) => {
  try {
    const client = await pool.connect();
    const electricityPrice = parseFloat(process.env.ELECTRICITY_PRICE);
    const gridTariff = parseFloat(process.env.GRID_TARIFF);
    const taxesAndFees = parseFloat(process.env.TAXES_AND_FEES);

    const totalCostPerKwh = electricityPrice + gridTariff + taxesAndFees;
    let query;

    if (type === "hourly") {
      query = `
        SELECT d.device_name, SUM(e.energy_kwh) * $2 AS total_cost
        FROM public.energy_data e
        JOIN public.devices d ON e.device_id = d.id
        WHERE date_trunc('day', e.timestamp) = date_trunc('day', $1::timestamp)
        GROUP BY d.device_name
      `;
    } else if (type === "monthly") {
      query = `
        SELECT d.device_name, SUM(e.energy_kwh) * $2 AS total_cost
        FROM public.energy_data e
        JOIN public.devices d ON e.device_id = d.id
        WHERE date_trunc('month', e.timestamp) = date_trunc('month', $1::timestamp)
        GROUP BY d.device_name
      `;
    } else {
      throw new Error("Invalid type. Must be 'hourly' or 'monthly'.");
    }

    const result = await client.query(query, [date, totalCostPerKwh]);
    await client.release();

    const labels = result.rows.map((row) => row.device_name);
    const data = result.rows.map((row) => parseFloat(row.total_cost));

    return {
      labels,
      datasets: [
        {
          data,
        },
      ],
    };
  } catch (error) {
    logError("Error calculating cost breakdown by devices:", error);
    throw error;
  }
};

exports.getTotalEnergyUsageByDevice = async (date, type) => {
  try {
    const client = await pool.connect();
    let query, previousQuery;

    if (type === "hourly") {
      query = `
        SELECT d.device_name, SUM(energy_kwh) AS total_energy_kwh
        FROM public.energy_data e
        JOIN public.devices d ON e.device_id = d.id
        WHERE date_trunc('day', e.timestamp) = date_trunc('day', $1::timestamp)
        GROUP BY d.device_name
      `;
      previousQuery = `
        SELECT d.device_name, SUM(energy_kwh) AS total_energy_kwh
        FROM public.energy_data e
        JOIN public.devices d ON e.device_id = d.id
        WHERE date_trunc('day', e.timestamp) = date_trunc('day', $1::timestamp) - INTERVAL '1 day'
        GROUP BY d.device_name
      `;
    } else if (type === "monthly") {
      query = `
        SELECT d.device_name, SUM(energy_kwh) AS total_energy_kwh
        FROM public.energy_data e
        JOIN public.devices d ON e.device_id = d.id
        WHERE date_trunc('month', e.timestamp) = date_trunc('month', $1::timestamp)
        GROUP BY d.device_name
      `;
      previousQuery = `
        SELECT d.device_name, SUM(energy_kwh) AS total_energy_kwh
        FROM public.energy_data e
        JOIN public.devices d ON e.device_id = d.id
        WHERE date_trunc('month', e.timestamp) = date_trunc('month', $1::timestamp) - INTERVAL '1 month'
        GROUP BY d.device_name
      `;
    } else {
      throw new Error("Invalid type. Must be 'hourly' or 'monthly'.");
    }

    const result = await client.query(query, [date]);
    const previousResult = await client.query(previousQuery, [date]);

    const data = {};

    result.rows.forEach((row) => {
      data[row.device_name] = {
        total_energy: row.total_energy_kwh || 0,
        previous_total_energy: 0,
        change_from_previous_current: 0,
      };
    });

    previousResult.rows.forEach((row) => {
      if (data[row.device_name]) {
        data[row.device_name].previous_total_energy = row.total_energy_kwh || 0;
        const current = data[row.device_name].total_energy;
        const previous = row.total_energy_kwh || 0;

        data[row.device_name].change_from_previous_current =
          previous === 0
            ? current === 0
              ? 0
              : 100
            : (((current - previous) / previous) * 100).toFixed(2);
      }
    });

    const labels = Object.keys(data);
    const datasets = [
      {
        label: "Energy Usage",
        data: labels.map((name) => data[name].total_energy),
      },
    ];

    await client.release();

    return {
      labels,
      datasets,
    };
  } catch (error) {
    logError("Error calculating total energy usage by device:", error);
    throw error;
  }
};
