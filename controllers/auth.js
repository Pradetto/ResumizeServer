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
    req.session.token = token;
    res.send({ user });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByCredentials(email, password);
    const token = await User.generateAuthToken(email);
    console.log("made it");
    req.session.token = token;
    res.send({ user });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
};

// How does the logout work with the cookie to make sure the right person is logging out
export const logout = async (req, res, next) => {
  try {
    req.session.destroy();
    res.send();
  } catch (err) {
    res.status(500).send();
  }
};
