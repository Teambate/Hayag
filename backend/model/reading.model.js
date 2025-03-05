import mongoose from "mongoose";

const sensorReadingSchema = new mongoose.Schema(
  {
    metadata: {
      deviceId: {
        type: String,
        required: true,
      },
      aggregationType: {
        type: String,
        enum: ["5min", "hourly", "daily"],
        required: true,
      },
      sampleCount: {
        type: Number,
        required: true,
      },
    },
    readings: {
      rain: [
        {
          panelId: { type: String, required: true },
          average: { type: Number, required: true },
          min: { type: Number, required: true },
          max: { type: Number, required: true }, 
          unit: { type: String, default: "%" },
        },
      ],
      uv: [
        {
          panelId: { type: String, required: true },
          average: { type: Number, required: true },
          min: { type: Number, required: true },
          max: { type: Number, required: true },
          unit: { type: String, default: "mW/cm2" },
        },
      ],
      light: [
        {
          panelId: { type: String, required: true },
          average: { type: Number, required: true },
          min: { type: Number, required: true },
          max: { type: Number, required: true },
          unit: { type: String, default: "lux" },
        },
      ],
      dht22: [
        {
          panelId: { type: String, required: true },
          temperature: {
            average: { type: Number, required: true },
            min: { type: Number, required: true },
            max: { type: Number, required: true },
            unit: { type: String, default: "°C" },
          },
          humidity: {
            average: { type: Number, required: true },
            min: { type: Number, required: true },
            max: { type: Number, required: true },
            unit: { type: String, default: "%" },
          },
        },
      ],
      panel_temp: [
        {
          panelId: { type: String, required: true },
          average: { type: Number, required: true },
          min: { type: Number, required: true },
          max: { type: Number, required: true },
          unit: { type: String, default: "°C" },
        },
      ],
      ina226: [
        {
          panelId: { type: String, required: true },
          voltage: {
            average: { type: Number, required: true },
            min: { type: Number, required: true },
            max: { type: Number, required: true },
            unit: { type: String, default: "V" },
          },
          current: {
            average: { type: Number, required: true },
            min: { type: Number, required: true },
            max: { type: Number, required: true },
            unit: { type: String, default: "mA" },
          },
        },
      ],
      solar: [
        {
          panelId: { type: String, required: true },
          average: { type: Number, required: true },
          min: { type: Number, required: true },
          max: { type: Number, required: true },
          unit: { type: String, default: "W/m2" },
        },
      ],
      battery: [
        {
          panelId: { type: String, required: true },
          average: { type: Number, required: true },
          min: { type: Number, required: true },
          max: { type: Number, required: true },
          unit: { type: String, default: "V" },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
sensorReadingSchema.index({ timestamp: -1 });
sensorReadingSchema.index({ "metadata.deviceId": 1, timestamp: -1 });
sensorReadingSchema.index({ "metadata.aggregationType": 1, timestamp: -1 });

// Create a compound index for efficient time-based queries with aggregation type
sensorReadingSchema.index({
  "metadata.aggregationType": 1,
  "metadata.deviceId": 1,
  timestamp: -1,
});

// Add schema methods if needed
sensorReadingSchema.methods.getFormattedTimestamp = function () {
  return this.timestamp.toISOString();
};

// Add virtual properties for computed values if needed
sensorReadingSchema.virtual("powerOutput").get(function () {
  // Return an array of power outputs for each panel
  return this.readings.ina226.map((sensor) => {
    const voltage = sensor.voltage.average;
    const current = sensor.current.average;
    return {
      panelId: sensor.panelId,
      power: voltage * current,
    };
  });
});

// Export the model
const SensorReading = mongoose.model("SensorReading", sensorReadingSchema);
export default SensorReading;
