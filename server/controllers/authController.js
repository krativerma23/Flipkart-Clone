import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const sign = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const safe = (user) => ({
  _id:   user._id,
  name:  user.name,
  email: user.email,
  phone: user.phone,
  role:  user.role,
});

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });

    if (await User.findOne({ email }))
      return res.status(409).json({ message: 'Email is already registered' });

    const user  = await User.create({ name, email, password });
    const token = sign(user._id);
    res.status(201).json({ token, user: safe(user) });
  } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    const token = sign(user._id);
    res.json({ token, user: safe(user) });
  } catch (err) { next(err); }
};

export const getMe = async (req, res) => {
  res.json(safe(req.user));
};
