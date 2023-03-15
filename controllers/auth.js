import User from "../models/User.js";

export const register = async (req, res, next) => {
  try {
    const { firstname, lastname, email, password } = req.body;
    const user = await User.create({
      firstname,
      lastname,
      email,
      password,
    });
    const token = await User.generateAuthToken(user.email);
    req.session.user = user;
    req.session.token = token;
    await req.session.save((err) => {
      if (err) {
        console.error(err);
        res.sendStatus(500);
      }
    });
    return res.status(201).json(user);
  } catch (err) {
    return res.status(400).send({ message: err.message });
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByCredentials(email, password);
    const token = await User.generateAuthToken(email);
    req.session.user = user;
    req.session.token = token;
    await req.session.save((err) => {
      if (err) {
        console.error(err);
        res.sendStatus(500);
      }
    });
    return res.status(201).json(user);
  } catch (err) {
    return res.status(400).send({ message: err.message });
  }
};

export const logout = async (req, res) => {
  console.log("Logout request received"); // Add this line
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Logout successful" });
  });
};

export const testLogout = (req, res) => {
  console.log("Test logout request received");
  res.status(200).json({ message: "Test logout successful" });
};
