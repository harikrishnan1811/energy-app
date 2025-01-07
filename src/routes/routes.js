const express = require("express");
const router = express.Router();
const energyController = require("../controllers/energyController");
const insightController = require("../controllers/insightController");

router.post("/energy/store", energyController.storeData);
router.get("/energy/stats", energyController.getStats);
router.get("/energy/peakOffPeakRatio", energyController.getPeakOffPeakRatio);
router.get("/energy/totalUsage", energyController.getTotalEnergyUsage);
router.get("/energy/peakHour", energyController.getPeakHour);
router.get(
  "/energy/getConsumptionChartData",
  energyController.getConsumptionChartData
);
router.get("/energy/getTotalCost", energyController.getTotalCost);
router.get(
  "/energy/getCostBreakDownByDevices",
  energyController.getCostBreakDownByDevices
);
router.get(
  "/energy/getTotalEnergyUsageByDevice",
  energyController.getTotalEnergyUsageByDevice
);

router.get("/insights", insightController.getInsights);
router.get(
  "/insights/getProjectedEnergyUsage",
  insightController.getProjectedEnergyUsage
);
router.get("/insights/getProjectedCost", insightController.getProjectedCost);
router.get("/insights/getDevices", insightController.getDevices);

module.exports = router;
