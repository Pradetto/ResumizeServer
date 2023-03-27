import ContactInfo from "../models/ContactInfo.js";
import Resume from "../models/Resume.js";
import Usage from "../models/Usage.js";

export const getProfileInfoController = async (req, res) => {
  const user_id = req.session.user.id;

  try {
    const contactData = await ContactInfo.findByUserId(user_id);
    const tokensData = await Usage.findByUserId(user_id);
    console.log({ ...tokensData });
    return res.status(200).json({
      ...req.session.user,
      ...contactData.publicData(),
      ...tokensData.publicData(),
    });
  } catch (err) {
    return res.status(400).send({ message: err.message });
  }
};

export const getTokensController = async (req, res) => {
  try {
  } catch (err) {}
};

export const getResumesListController = async (req, res) => {
  const user_id = req.session.user.id;
  try {
    const resumeData = await Resume.resumeList(user_id);
    res.status(200).json(resumeData);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
};
