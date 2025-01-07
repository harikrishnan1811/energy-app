const insightService = require("../services/insightService");
const { logInfo, logError } = require("../utils/logger");

exports.getInsights = async (req, res) => {
  try {
    logInfo("Fetching insights data");
    const insights = await insightService.getInsights();
    res.status(200).json({ success: true, data: insights });
  } catch (error) {
    logError(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProjectedEnergyUsage = async (req, res) => {
  try {
    logInfo("Calculating projected energy usage");
    const { deviceId } = req.query;
    const usage = await insightService.getProjectedEnergyUsage(deviceId);
    res.status(200).json({ success: true, data: usage });
  } catch (error) {
    logError(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProjectedCost = async (req, res) => {
  try {
    logInfo("Calculating projected cost");
    const { deviceId } = req.query;
    const cost = await insightService.getProjectedCost(deviceId);
    res.status(200).json({ success: true, data: cost });
  } catch (error) {
    logError(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDevices = async (req, res) => {
  try {
    logInfo("Fetching devices data");
    const devices = await insightService.getDevices();
    res.status(200).json({ success: true, data: devices });
  } catch (error) {
    logError(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
