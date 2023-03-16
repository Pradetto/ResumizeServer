import User from "../models/User.js";

export const registerController = async (req, res, next) => {
  try {
    const { firstname, lastname, email, password } = req.body;
    const user = await User.create({
      firstname,
      lastname,
      email,
      password,
    });
    // const token = await User.generateAuthToken(user.email);
    req.session.user = user;
    // req.session.token = token;
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

export const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByCredentials(email, password);
    // const token = await User.generateAuthToken(email);
    req.session.user = user;
    // req.session.token = token;
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

export const logoutController = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    // console.log("this should not work", req.session.user);
    return res.status(200).json({ message: "Logout successful" });
  });
};

export const resetPasswordController = async (req, res) => {
  return;
};

export const updatePasswordController = async (req, res) => {};

export const authStatusController = async (req, res) => {
  console.log("successfully authenticated");
  return res.json(req.session.user);
};
