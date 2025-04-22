import mongoose from "mongoose";

const insightSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    timezone: {
      type: String,
      required: true,
      default: "Asia/Manila"
    },
    dailyPerformance: {
      energyGenerated: {
        value: { type: Number, default: 0 },
        unit: { type: String, default: "kWh" }
      },
      expectedEnergy: {
        value: { type: Number, default: 0 },
        unit: { type: String, default: "kWh" }
      },
      comparisonWithYesterday: {
        value: { type: Number, default: 0 }, // percentage change
        unit: { type: String, default: "%" }
      },
      peakGenerationTime: { type: String },
      peakGenerationValue: {
        value: { type: Number, default: 0 },
        unit: { type: String, default: "kWh" }
      },
      efficiencyRate: {
        value: { type: Number, default: 0 },
        unit: { type: String, default: "%" }
      }
    },
    sensorHealth: {
      summary: {
        total: { type: Number, default: 0 },
        good: { type: Number, default: 0 },
        warning: { type: Number, default: 0 },
        critical: { type: Number, default: 0 }
      },
      details: [
        {
          sensorType: { type: String, required: true },
          panelId: { type: String, required: true },
          status: { 
            type: String, 
            enum: ["good", "warning", "critical"],
            default: "good"
          },
          avgHealth: { type: Number, default: 100 }
        }
      ]
    },
    panelHealth: {
      summary: {
        totalPanels: { type: Number, default: 0 },
        goodPanels: { type: Number, default: 0 },
        warningPanels: { type: Number, default: 0 },
        criticalPanels: { type: Number, default: 0 }
      },
      details: [
        {
          panelId: { type: String, required: true },
          efficiency: {
            value: { type: Number, default: 0 },
            unit: { type: String, default: "%" }
          },
          temperature: {
            min: { type: Number },
            max: { type: Number },
            avg: { type: Number },
            unit: { type: String, default: "°C" }
          },
          status: { 
            type: String, 
            enum: ["good", "warning", "critical"],
            default: "good"
          }
        }
      ]
    },
    insights: [
      {
        category: { 
          type: String, 
          enum: ["performance", "health", "maintenance", "environmental"],
          required: true 
        },
        importance: {
          type: String,
          enum: ["info", "warning", "critical"],
          default: "info"
        },
        message: { type: String, required: true }
      }
    ],
    metadata: {
      processingTime: { type: Date, default: Date.now },
      dataQuality: {
        completeness: { type: Number, default: 100 }, // percentage of expected data points that were available
        sampleCount: { type: Number, default: 0 }
      }
    }
  },
  {
    timestamps: true,
    // Set up index for efficient querying
    index: {
      deviceId: 1,
      date: 1
    }
  }
);

// Create a compound unique index to ensure only one insight per device per day
insightSchema.index({ deviceId: 1, date: 1 }, { unique: true });

const Insight = mongoose.model("Insight", insightSchema);
export default Insight; 