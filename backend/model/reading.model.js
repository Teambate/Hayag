import mongoose from "mongoose";

const sensorReadingSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
    },
    metadata: {
      aggregationType: {
        type: String,
        enum: ["5min", "10min","15min", "30min", "hourly", "daily"],
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
    // Configure Time Series options
    timeseries: {
      timeField: 'createdAt',
      metaField: 'deviceId',
      granularity: 'minutes'
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
