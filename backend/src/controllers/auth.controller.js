const jwt = require("jsonwebtoken");
const { User } = require("../models");

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      businessName,
      addressStreet,
      addressCity,
      addressState,
      addressPincode,
      gstNumber,
    } = req.body;

    // Trim whitespace from all string fields
    const trimmedData = {
      name: name?.trim(),
      email: email?.trim().toLowerCase(),
      phone: phone?.trim().replace(/[^0-9]/g, ""),
      password,
      role,
      businessName: businessName?.trim(),
      addressStreet: addressStreet?.trim(),
      addressCity: addressCity?.trim(),
      addressState: addressState?.trim(),
      addressPincode: addressPincode?.trim(),
      gstNumber: gstNumber?.trim().toUpperCase(),
    };

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email: trimmedData.email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Check phone
    const existingPhone = await User.findOne({
      where: { phone: trimmedData.phone },
    });

    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number already registered",
      });
    }

    // Create new user
    const user = await User.create({
      name: trimmedData.name,
      email: trimmedData.email,
      phone: trimmedData.phone,
      password: trimmedData.password,
      role: trimmedData.role || "buyer",
      businessName: trimmedData.businessName,
      addressStreet: trimmedData.addressStreet,
      addressCity: trimmedData.addressCity,
      addressState: trimmedData.addressState,
      addressPincode: trimmedData.addressPincode,
      gstNumber: trimmedData.gstNumber,
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: user.toSafeJSON(),
        token,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(". "),
      });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message: "Email or phone already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error during registration. Please try again.",
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Trim email and password
    const trimmedEmail = email?.trim().toLowerCase();
    const trimmedPassword = password?.trim();

    // Find user
    const user = await User.findOne({ where: { email: trimmedEmail } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact support.",
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(trimmedPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: user.toSafeJSON(),
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Error during login. Please try again.",
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: { user: user.toSafeJSON() },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
    });
  }
};

/**
 * @desc    Update password
 * @route   PUT /api/auth/password
 * @access  Private
 */
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: "Password updated successfully",
      data: { token },
    });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating password",
    });
  }
};

/**
 * @desc    Logout user (client-side token removal)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

/**
 * @desc    Verify token validity
 * @route   GET /api/auth/verify
 * @access  Private
 */
const verifyToken = async (req, res) => {
  res.json({
    success: true,
    message: "Token is valid",
    data: { user: req.user.toSafeJSON() },
  });
};

module.exports = {
  register,
  login,
  getMe,
  updatePassword,
  logout,
  verifyToken,
};
