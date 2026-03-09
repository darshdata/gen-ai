const userModel = require("../models/user.model");

/**
 * @name registerUserController
 * @desc Register a new user, expects username, email, and password in the request body. Checks if the email is already registered and creates a new user if not.
 * @access Public
 */
async function registerUserController(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Please provide username, email, and password.",
      });
    }

    // Check if the user already exists
    const isUserAlreadyExists = await userModel.findOne({ 
        $or: [{ username }, { email }] 
    });

    if (isUserAlreadyExists) {
      return res.status(400).json({ 
        message: "Account already exists with this email address." 
    });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      username,
      email,
      password: hash,
    });

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

    res.cookie('token', token);

    res.status(201).json({ 
        message: "User registered successfully.",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
        },
    });
    
  } catch (error) {
    res.status(500).json({ message: "Server error. Please try again later." });
  }
}

async function loginUserController(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please provide email and password.",
            });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(400).json({ 
                message: "Invalid email or password." 
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ 
                message: "Invalid email or password." 
            });
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('token', token);

        res.status(200).json({ 
            message: "User logged in successfully.",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
        
    } catch (error) {
        res.status(500).json({ message: "Server error. Please try again later." });
    }
}

module.exports = { registerUserController, loginUserController };
