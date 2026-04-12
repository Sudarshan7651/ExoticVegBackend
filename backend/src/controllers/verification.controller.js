const User = require('../models/User');
const { uploadMultiple } = require('../middleware/upload');

// Submit verification documents
exports.submitVerification = async (req, res) => {
  try {
    const { documents } = req.body; // Array of document URLs

    if (req.user.role !== 'trader') {
      return res.status(403).json({ success: false, message: 'Only traders can submit verification' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.verificationStatus === 'verified') {
      return res.status(400).json({ success: false, message: 'Already verified' });
    }

    user.verificationStatus = 'pending';
    user.verificationDocuments = documents;
    await user.save();

    res.json({
      success: true,
      message: 'Verification documents submitted successfully',
      data: user,
    });
  } catch (error) {
    console.error('Submit verification error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit verification' });
  }
};

// Get pending verifications (admin only)
exports.getPendingVerifications = async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        role: 'trader',
        verificationStatus: 'pending',
      },
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending verifications' });
  }
};

// Process verification (admin only)
exports.processVerification = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.verificationStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Verification already processed' });
    }

    user.verificationStatus = status;
    if (status === 'verified') {
      user.isVerified = true;
    } else if (status === 'rejected') {
      user.verificationDocuments = null;
      user.rejectionReason = rejectionReason;
    }

    await user.save();

    res.json({
      success: true,
      message: `Verification ${status} successfully`,
      data: user,
    });
  } catch (error) {
    console.error('Process verification error:', error);
    res.status(500).json({ success: false, message: 'Failed to process verification' });
  }
};

// Upload verification documents
exports.uploadVerificationDocuments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const documentUrls = req.files.map(file => `/uploads/${file.filename}`);

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      data: { documentUrls },
    });
  } catch (error) {
    console.error('Upload documents error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload documents' });
  }
};
