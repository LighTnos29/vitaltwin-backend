const Submission = require('../models/Submission');

/**
 * Map stored profile + input to ML API /predict body (single combined payload).
 * ProfileInfo: Userid, Age, Gender, Height, Weight, Diet, ActivityLevel
 * HealthInfo: Smoking, Alcohol, Sleep, Stress, MedicalConditions
 */
function buildPredictPayload(submissionId, profile, input) {
  const p = profile && typeof profile === 'object' ? profile : {};
  const i = input && typeof input === 'object' ? input : {};
  return {
    ProfileInfo: {
      Userid: submissionId,
      Age: Number(p.age) || 0,
      Gender: String(p.gender || '').trim() || 'string',
      Height: Number(p.height) || 0,
      Weight: Number(p.weight) || 0,
      Diet: String(p.diet || 'Average').trim(),
      ActivityLevel: String(p.activity || 'Moderate').trim(),
    },
    HealthInfo: {
      Smoking: String(i.smoking || 'Never').trim(),
      Alcohol: String(i.alcohol || 'Never').trim(),
      Sleep: Number(i.sleep) || 7,
      Stress: String(i.stress || 'Medium').trim(),
      MedicalConditions: Array.isArray(i.medical_conditions) ? i.medical_conditions : [],
    },
  };
}

/**
 * POST combined payload to LLM /predict endpoint (fire-and-forget).
 */
async function sendToLLM(submissionId, profile, input) {
  let endpoint = process.env.LLM_ENDPOINT;
  if (!endpoint) return;
  endpoint = endpoint.replace(/\/$/, '');
  if (!endpoint.endsWith('/predict')) endpoint += '/predict';

  const payload = buildPredictPayload(submissionId, profile, input);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error('LLM endpoint error:', res.status, await res.text());
    }
  } catch (err) {
    console.error('LLM endpoint request failed:', err.message);
  }
}

/**
 * POST /profile (or POST /submissions) — Save profile + health input to DB, then send same data to LLM.
 * Single request from frontend: submitReport(profile, input) → body { profile, input }.
 * profile: { name, age, gender, height, weight, diet, activity }
 * input: { smoking, alcohol, sleep, stress, medical_conditions[] }
 */
exports.createSubmission = async (req, res) => {
  try {
    const { profile, input } = req.body;

    if (profile == null || input == null) {
      return res.status(400).json({
        success: false,
        message: 'Request body must include profile and input',
      });
    }

    const submission = await Submission.create({ profile, input });
    const submissionId = submission._id.toString();

    // Send same data to LLM (non-blocking; errors logged only)
    sendToLLM(submissionId, profile, input).catch(() => {});

    res.status(201).json({
      success: true,
      id: submissionId,
    });
  } catch (err) {
    console.error('createSubmission error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to save submission',
    });
  }
};

/**
 * GET /profile — Get latest submission (for display).
 * GET /profile/:id — Get submission by id.
 * GET /submissions/latest — Get latest submission (alias).
 */
exports.getSubmission = async (req, res) => {
  try {
    const { id } = req.params;

    let doc;
    if (id) {
      doc = await Submission.findById(id);
    } else {
      doc = await Submission.findOne().sort({ createdAt: -1 });
    }

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: id ? 'Submission not found' : 'No submission found',
      });
    }

    res.status(200).json({
      profile: doc.profile,
      input: doc.input,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      id: doc._id.toString(),
    });
  } catch (err) {
    console.error('getSubmission error:', err);
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to get submission',
    });
  }
};

/**
 * GET /submissions/latest — Same as GET /profile (latest).
 * Handled by same controller; route can point here or to getSubmission without id.
 */
exports.getLatestSubmission = (req, res) => {
  req.params.id = undefined;
  return exports.getSubmission(req, res);
};
