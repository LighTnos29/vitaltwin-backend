const Submission = require('../models/Submission');

/**
 * POST /profile (or POST /submissions) — Store profile + health input in DB only.
 * Body: { profile, input }
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

    res.status(201).json({
      success: true,
      id: submission._id.toString(),
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
