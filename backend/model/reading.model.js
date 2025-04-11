import mongoose from "mongoose";

const sensorReadingSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    metadata: {
      aggregationType: {
        type: String,
        enum: ["5min"],
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
          health: { type: Number, required: true },
        },
      ],
      uv: [
        {
          panelId: { type: String, required: true },
          average: { type: Number, required: true },
          min: { type: Number, required: true },
          max: { type: Number, required: true },
          unit: { type: String, default: "mW/cm2" },
          health: { type: Number, required: true },
        },
      ],
      light: [
        {
          panelId: { type: String, required: true },
          average: { type: Number, required: true },
          min: { type: Number, required: true },
          max: { type: Number, required: true },
          unit: { type: String, default: "lux" },
          health: { type: Number, required: true },
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
            health: { type: Number, required: true },
          },
          humidity: {
            average: { type: Number, required: true },
            min: { type: Number, required: true },
            max: { type: Number, required: true },
            unit: { type: String, default: "%" },
            health: { type: Number, required: true },
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
          health: { type: Number, required: true },
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
            health: { type: Number, required: true },
          },
          current: {
            average: { type: Number, required: true },
            min: { type: Number, required: true },
            max: { type: Number, required: true },
            unit: { type: String, default: "mA" },
            health: { type: Number, required: true },
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
          health: { type: Number, required: true },
        },
      ],
      battery: [
        {
          panelId: { type: String, required: true },
          average: { type: Number, required: true },
          min: { type: Number, required: true },
          max: { type: Number, required: true },
          unit: { type: String, default: "V" },
          health: { type: Number, required: true },
        },
      ],
      battery_capacity: {
        type: Number,
        required: true,
        default: 0,
        unit: { type: String, default: "mAh" },
      },
    },
  },
  {
    // Configure Time Series options
    timeseries: {
      timeField: "endTime",
      metaField: "deviceId",
      granularity: "minutes",
    },
    timestamps: true,
  }
);

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
