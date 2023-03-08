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
    res.status(201).send({ user, token });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByCredentials(email, password);
    const token = await User.generateAuthToken(user.email);
    res.send({ user, token });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
};
