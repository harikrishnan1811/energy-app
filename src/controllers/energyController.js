const energyService = require("../services/energyService");
const { logInfo, logError } = require("../utils/logger");

exports.storeData = async (req, res) => {
  try {
    logInfo("Storing raw energy data from csv");
    await energyService.storeRawData();
    res
      .status(200)
      .json({ success: true, message: "Raw data stored successfully" });
  } catch (error) {
    logError(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    logInfo("Fetching energy statistics");
    const { date, type } = req.query;
    const stats = await energyService.getStats(date, type);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    logError(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPeakOffPeakRatio = async (req, res) => {
  try {
    logInfo("Calculating peak to off-peak ratio");
    const { date, type } = req.query;
    const ratio = await energyService.getPeakOffPeakRatio(date, type);
    res.status(200).json({ success: true, data: ratio });
  } catch (error) {
    logError(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTotalEnergyUsage = async (req, res) => {
  try {
    logInfo("Calculating total energy usage");
    const { date, type } = req.query;
    const ratio = await energyService.getTotalEnergyUsage(date, type);
    res.status(200).json({ success: true, data: ratio });
  } catch (error) {
    logError(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPeakHour = async (req, res) => {
  try {
    logInfo("Calculating peak hour");
    const { date, type } = req.query;
    const ratio = await energyService.getPeakHour(date, type);
    res.status(200).json({ success: true, data: ratio });
  } catch (error) {
    logError(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getConsumptionChartData = async (req, res) => {
  try {
    logInfo("Fetching consumption chart data");
    const { date, type } = req.query;
    const chartData = await energyService.getConsumptionChartData(date, type);
    res.status(200).json({ success: true, data: chartData });
  } catch (error) {
    logError(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTotalCost = async (req, res) => {
  try {
    logInfo("Calculating total cost");
    const { date, type } = req.query;
    const totalCost = await energyService.getTotalCost(date, type);
    res.status(200).json({ success: true, data: totalCost });
  } catch (error) {
    logError(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCostBreakDownByDevices = async (req, res) => {
  try {
    logInfo("Fetching cost breakdown by devices");
    const { date, type } = req.query;
    const costBreakdown = await energyService.getCostBreakDownByDevices(
      date,
      type
    );
    res.status(200).json({ success: true, data: costBreakdown });
  } catch (error) {
    logError(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTotalEnergyUsageByDevice = async (req, res) => {
  try {
    logInfo("Calculating total energy usage by device");
    const { date, type } = req.query;
    const usage = await energyService.getTotalEnergyUsageByDevice(date, type);
    res.status(200).json({ success: true, data: usage });
  } catch (error) {
    logError(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
