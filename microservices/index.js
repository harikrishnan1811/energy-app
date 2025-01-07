require("dotenv").config();
const cron = require("node-cron");
const pool = require("./db");

// Helper function to calculate peak hour and metrics
async function processEnergyData() {
  console.log("Starting energy data processing...");

  try {
    const client = await pool.connect();
    await client.query("BEGIN"); // Start transaction

    // Fetch unprocessed energy data grouped by device, date, and hour
    const { rows } = await client.query(`
            SELECT device_id, DATE(timestamp) as date, 
                   EXTRACT(HOUR FROM timestamp) as hour, 
                   SUM(energy_kwh) as energy_kwh
            FROM public.energy_data
            WHERE is_processed = FALSE
            GROUP BY device_id, date, hour
            ORDER BY date, hour
        `);

    let processedCount = 0;
    for (const row of rows) {
      const { device_id, date, hour, energy_kwh } = row;

      // Calculate peak hour and total energy usage for the day
      const peakHourQuery = await client.query(
        `
                SELECT EXTRACT(HOUR FROM timestamp) as peak_hour, 
                       SUM(energy_kwh) as total_energy_kwh
                FROM public.energy_data
                WHERE device_id = $1 AND DATE(timestamp) = $2
                GROUP BY peak_hour
                ORDER BY total_energy_kwh DESC
                LIMIT 1
            `,
        [device_id, date]
      );

      const peakHourData = peakHourQuery.rows[0];
      const peakHour = peakHourData.peak_hour;
      const peakEnergy = peakHourData.total_energy_kwh;

      // Calculate total energy and cost for the day
      const totalEnergyQuery = await client.query(
        `
                SELECT SUM(energy_kwh) as total_energy_kwh,
                       SUM(CASE WHEN EXTRACT(HOUR FROM timestamp) BETWEEN 18 AND 22 
                                THEN energy_kwh * 0.20 ELSE energy_kwh * 0.10 END) AS total_cost
                FROM public.energy_data
                WHERE device_id = $1 AND DATE(timestamp) = $2
            `,
        [device_id, date]
      );

      const totalEnergy = totalEnergyQuery.rows[0].total_energy_kwh;
      const totalCost = totalEnergyQuery.rows[0].total_cost;

      const offPeakEnergy = totalEnergy - peakEnergy;
      const peakToOffPeakRatio = peakEnergy / (offPeakEnergy || 1);

      // Insert or update data in energy_aggregations table
      await client.query(
        `
                INSERT INTO public.energy_aggregations (
                    device_id, date, week_start, month_start, 
                    total_energy_kwh, total_cost, peak_energy_kwh, 
                    off_peak_energy_kwh, peak_to_off_peak_ratio, peak_hour, finalized
                ) VALUES (
                    $1, $2::timestamp, 
                    date_trunc('week', $2::timestamp)::date, 
                    date_trunc('month', $2::timestamp)::date, 
                    $3, $4, $5, $6, $7, $8, FALSE
                ) ON CONFLICT (device_id, date) 
                DO UPDATE 
                SET total_energy_kwh = $3, 
                    total_cost = $4, 
                    peak_energy_kwh = $5, 
                    off_peak_energy_kwh = $6, 
                    peak_to_off_peak_ratio = $7, 
                    peak_hour = $8
            `,
        [
          device_id,
          date,
          totalEnergy,
          totalCost,
          peakEnergy,
          offPeakEnergy,
          peakToOffPeakRatio,
          peakHour,
        ]
      );

      // Mark processed data as complete
      await client.query(
        `
                UPDATE public.energy_data
                SET is_processed = TRUE
                WHERE device_id = $1 AND DATE(timestamp) = $2
            `,
        [device_id, date]
      );

      processedCount++;
      console.log(
        `${processedCount}. Processed data for ${device_id} on ${date}`
      );
    }

    await client.query("COMMIT"); // Commit transaction
    client.release();
    console.log("Energy data processed successfully! ✅");
  } catch (error) {
    console.error("Error processing energy data:", error);
    await client.query("ROLLBACK"); // Rollback transaction on error
  }
}

// Schedule the job to run every 15 minutes
cron.schedule("*/15 * * * *", () => {
  console.log("Running the scheduled job...");
  processEnergyData();
});

console.log("Energy Cron Service started and running every 15 minutes...");

// Helper function to generate insights based on energy data
async function generateInsights() {
  const client = await pool.connect();
  try {
    console.log(
      "Generating insights with relevancy using device names and ordered by date..."
    );

    // Fetch data from energy_aggregations along with device_name, ordered by date (most recent first)
    const result = await client.query(`
              SELECT e.device_id, d.device_name, e.total_energy_kwh, e.total_cost, 
                     e.peak_energy_kwh, e.off_peak_energy_kwh, e.date
              FROM energy_aggregations e
              JOIN devices d ON e.device_id = d.id
              ORDER BY e.date DESC
          `);

    const insightsMap = new Map(); // To store only the most relevant insight per device
    let count = 0;

    result.rows.forEach((row) => {
      const insights = [];
      const formattedDate = new Date(row.date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        hour12: true,
      });

      if (row.peak_energy_kwh > row.off_peak_energy_kwh) {
        insights.push({
          text: `${row.device_name} had higher energy usage during peak hours on ${formattedDate}.`,
          relevancy: (row.peak_energy_kwh - row.off_peak_energy_kwh) * 10,
        });
      }
      if (row.total_energy_kwh > 1000) {
        insights.push({
          text: `${row.device_name} consumed more than 1000 kWh on ${formattedDate}.`,
          relevancy: row.total_energy_kwh * 5,
        });
      }
      if (row.total_cost > 500) {
        insights.push({
          text: `${row.device_name} incurred a cost greater than $500 on ${formattedDate}.`,
          relevancy: row.total_cost * 2,
        });
      }

      // Pick the most relevant insight for the current device
      if (insights.length > 0) {
        const mostRelevantInsight = insights.sort(
          (a, b) => b.relevancy - a.relevancy
        )[0];

        // Store the most relevant insight for this device only if it's more relevant
        if (
          !insightsMap.has(row.device_id) ||
          insightsMap.get(row.device_id).relevancy <
            mostRelevantInsight.relevancy
        ) {
          insightsMap.set(row.device_id, mostRelevantInsight);
        }
      }
      console.log(`Processed insights of ${++count}/${result.rows.length}`);
    });

    // Convert insights map to an array and sort by relevancy globally
    const sortedInsights = [...insightsMap.values()].sort(
      (a, b) => b.relevancy - a.relevancy
    );

    // Insert only the most relevant insights for each device
    for (const insight of sortedInsights) {
      await client.query(`INSERT INTO insights (insight_text) VALUES ($1)`, [
        insight.text,
      ]);
    }

    console.log(
      "Most relevant insights generated and stored successfully with device names and date relevance!"
    );
  } catch (err) {
    console.error("Error generating insights:", err);
  } finally {
    client.release(); // Ensure the connection is released
  }
}

// Schedule the job to run every day at 12:00 AM
cron.schedule("0 0 * * *", () => {
  console.log("Running the scheduled job...");
  generateInsights();
});
