const Supervisor = require('../../models/supervisorModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper function to generate JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d', // Token expires in 7 days
  });
};

// Helper function to send JWT as cookie
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expiresIn:'7d',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
  };

  if (process.env.NODE_ENV === 'development') {
    cookieOptions.secure = false;
  }

  res.cookie('auth_sup', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// --- CRUD Operations ---

const registerSupervisor = async (req, res) => {
  try {
    // Debugging: Log the raw request body
    console.log('Raw request body:', req.body);
    console.log('Request headers:', req.headers);
    
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email, name, and password.',
      });
    }

    const existingSupervisor = await Supervisor.findOne({ email });
    if (existingSupervisor) {
      return res.status(400).json({
        status: 'fail',
        message: 'Supervisor with this email already exists.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newSupervisor = await Supervisor.create({
      email,
      name,
      password: hashedPassword,
    });

    createSendToken(newSupervisor, 201, res);
  } catch (err) {
    console.error('Error registering supervisor:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to register supervisor.',
      error: err.message,
    });
  }
};

const getAllSupervisors = async (req, res) => {
  try {
    const supervisors = await Supervisor.find().select('-password');
    res.status(200).json({
      status: 'success',
      results: supervisors.length,
      data: {
        supervisors,
      },
    });
  } catch (err) {
    console.error('Error fetching supervisors:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch supervisors.',
      error: err.message,
    });
  }
};

const getSupervisorById = async (req, res) => {
  try {
    const supervisor = await Supervisor.findById(req.params.id).select('-password');
    if (!supervisor) {
      return res.status(404).json({
        status: 'fail',
        message: 'No supervisor found with that ID.',
      });
    }
    res.status(200).json({
      status: 'success',
      data: {
        supervisor,
      },
    });
  } catch (err) {
    console.error('Error fetching supervisor by ID:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch supervisor.',
      error: err.message,
    });
  }
};

const updateSupervisor = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const supervisor = await Supervisor.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).select('-password');

    if (!supervisor) {
      return res.status(404).json({
        status: 'fail',
        message: 'No supervisor found with that ID.',
      });
    }
    res.status(200).json({
      status: 'success',
      data: {
        supervisor,
      },
    });
  } catch (err) {
    console.error('Error updating supervisor:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update supervisor.',
      error: err.message,
    });
  }
};

const deleteSupervisor = async (req, res) => {
  try {
    const supervisor = await Supervisor.findByIdAndDelete(req.params.id);
    if (!supervisor) {
      return res.status(404).json({
        status: 'fail',
        message: 'No supervisor found with that ID.',
      });
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    console.error('Error deleting supervisor:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete supervisor.',
      error: err.message,
    });
  }
};

// --- Authentication ---

const loginSupervisor = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password.',
      });
    }

    const user = await Supervisor.findOne({ email }).select('+password');
    console.log(user);
    console.log(password);
    console.log(user.password);
    const match_pass = await user.matchPassword(password);
    console.log(match_pass);
    if (!user || !match_pass) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password.',
      });
    }

    createSendToken(user, 200, res);
  } catch (err) {
    console.error('Error logging in supervisor:', err);
    res.status(500).json({
      status: 'error',
      message: 'Login failed.',
      error: err.message,
    });
  }
};

const logoutSupervisor = (req, res) => {
  res.cookie('auth_sup', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
  });
  res.status(200).json({ status: 'success', message: 'Logged out successfully.' });
};

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.cookies.auth_sup) {
      token = req.cookies.auth_sup;
    }
    console.log('Token:', token);   
    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in! Please log in to get access.',
      });
    }   

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const currentUser = await Supervisor.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.',
      });
    }

    req.user = currentUser;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid token. Please log in again.',
      });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Your token has expired! Please log in again.',
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Authentication failed.',
      error: err.message,
    });
  }
};

const checkAuth = async (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user,
      },
    });
  } catch (err) {
    console.error('Error checking auth:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check authentication.',
      error: err.message,
    });
  }
};

module.exports = {
  registerSupervisor,
  getAllSupervisors,
  getSupervisorById,
  updateSupervisor,
  deleteSupervisor,
  loginSupervisor,
  logoutSupervisor,
  protect,
  checkAuth,
};