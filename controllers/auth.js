import User from "../models/User.js";
import nodemailer from "nodemailer";
import ContactInfo from "../models/ContactInfo.js";
import Usage from "../models/Usage.js";

export const registerController = async (req, res, next) => {
  try {
    const {
      firstname,
      lastname,
      email,
      password,
      street,
      apt,
      city,
      state,
      postalCode,
      country,
      phone,
      address,
    } = req.body;

    const user = await User.create({
      firstname,
      lastname,
      email,
      password,
    });

    const contactInfo = await ContactInfo.create({
      user_id: user.id,
      street,
      apt,
      city,
      state,
      postalCode,
      country,
      phone,
      address,
    });

    await Usage.create(user.id);

    req.session.user = user;
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

    req.session.user = user;
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
    return res.status(200).json({ message: "Logout successful" });
  });
};

export const forgotPasswordController = async (req, res) => {
  const { email } = req.body;

  try {
    const token = await User.generateAuthToken(email);
    const resetUrl = `${process.env.CLIENT_URL}/resetpassword/${token}`;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `Resumize Support <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset",
      text: `Click the following link to reset your password: ${resetUrl}. It expires in 15 minutes.`,
      html: `<p>Click the following link to reset your password: <a href="${resetUrl}">${resetUrl}</a>. It expires in 15 minutes.</p>`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error(err);
        throw new Error("Email did not send");
      } else {
      }
    });
    return res.status(200).json({ message: "Password reset email sent" });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

export const resetPasswordController = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!req.user) {
      throw new Error("User not found");
    }

    if (email !== req.user.email) {
      throw new Error("User not found");
    }

    const foundUser = await User.findByIdOrEmail(req.user.id);
    await foundUser.updatePassword(password);
    return res.status(200).json({ message: "Successfully reset password" });
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const updatePasswordController = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (req.session.user.email !== email || !email) {
      return res.status(401).json({ message: "Credentials do not match" });
    }
    const user = await User.findByIdOrEmail(null, email);
    if (user) {
      await user.updatePassword(password);
      return res.status(200).json({ message: "Successfully updated password" });
    } else {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
  } catch (err) {
    return res.status(401).json({ message: err.message });
  }
};

export const deleteProfileController = async (req, res) => {
  try {
    const user = await User.findByIdOrEmail(req.session.user.id);
    await user.deleteUser();
    res.clearCookie("connect.sid");
    return res.status(200).json({ message: "User successfully deleted" });
  } catch (err) {
    return res.status(400).json(err.message);
  }
};

export const authStatusController = async (req, res) => {
  return res.json(req.session.user);
};
