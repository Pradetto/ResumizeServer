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
    // For some reason it should auto recognize the req.session.save() but it is not
    // req.session.regenerate((err) => {
    //   if (err) {
    //     console.error(err);
    //     return res.status(500).json({ error: "Session regeneration failed" });
    //   }
    // });
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
    // For some reason it should auto recognize the req.session.save() but it is not
    // req.session.regenerate((err) => {
    //   if (err) {
    //     console.error(err);
    //     return res.status(500).json({ error: "Session regeneration failed" });
    //   }
    // });
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

// How does the logout work with the cookie to make sure the right person is logging out
export const logout = async (req, res, next) => {
  try {
    console.log("here is the logout session", req.session);
    await req.session.destroy((err) => {
      console.log("Inside destroy callback");
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).send();
      }
      console.log("Session destroyed Successfully");
      return res.send("made it");
    });
  } catch (err) {
    console.error("Error in logout controller:", err);
    return res.status(500).send();
  }
};
