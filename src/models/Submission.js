const mongoose = require('mongoose');

// Body: { profile: { name, age, gender, height, weight, diet, activity }, input: { smoking, alcohol, sleep, stress, medical_conditions[] } }
const profileSchema = new mongoose.Schema(
  {
    name: String,
    age: Number,
    gender: String,
    height: String,
    weight: String,
    diet: String,
    activity: String,
  },
  { _id: false }
);

const healthInputSchema = new mongoose.Schema(
  {
    smoking: String,
    alcohol: String,
    sleep: String,
    stress: String,
    medical_conditions: [String],
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    profile: {
      type: profileSchema,
      required: true,
    },
    input: {
      type: healthInputSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Submission', submissionSchema);
