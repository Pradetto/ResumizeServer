import ContactInfo from "../models/ContactInfo.js";
import Resume from "../models/Resume.js";
import Usage from "../models/Usage.js";
import Companies from "../models/Companies.js";
import Jobs from "../models/Jobs.js";
import Roles from "../models/Roles.js";

export const formSubmissionController = async (req, res) => {
  const user_id = req.session.user.id;
  // const { company_name, isNew, id: company_id } = req.body.company;
  const { id: resume_id, is_default: resumeIsDefault } = req.body.resume;

  try {
    /* RESUME */
    const resumeData = await Resume.updateIsDefault(
      resume_id,
      user_id,
      resumeIsDefault
    );
    console.log("Here is the resumeData", resumeData);

    /* COMPANY */
    if (isNew) {
      // await Companies.insertCompany(user_id, company_name);
    } else if (company_id) {
      // QUERY THE EXISTING INFORMATION IF NEEDED
    }
  } catch (error) {}
};

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

/* RESUMES */
export const getResumesListController = async (req, res) => {
  const user_id = req.session.user.id;
  try {
    const resumeData = await Resume.resumeList(user_id);
    res.status(200).json(resumeData);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
};

/* COMPANIES */
export const getCompaniesListController = async (req, res) => {
  const user_id = req.session.user.id;
  try {
    const companiesData = await Companies.companiesList(user_id);
    res.status(200).json(companiesData);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
};

export const insertCompanyController = async (req, res) => {
  const user_id = req.session.user.id;
  const company_name = req.body.company_name;
  try {
    const company = await Companies.insertCompany(user_id, company_name);
    res.status(200).json(company);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
};

/* JOBS */

export const createJobController = async (req, res) => {
  const user_id = req.session.user.id;
  const { company_id, link } = req.body;

  try {
    if (!company_id || !link) {
      throw new Error("Make sure you have the link and company selected");
    }
    const jobData = await Jobs.createJobEntry(user_id, company_id, link);
    res.status(200).json(jobData);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

export const deleteDraftsController = async (req, res) => {
  const user_id = req.session.user.id;

  try {
    await Jobs.deleteDraftJobs(user_id);
    res.status(200).send({ message: "Successfully deleted drafts." });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
};

export const getExistingLinkController = async (req, res) => {
  const user_id = req.session.user.id;
  const link = req.params.link_id;
  try {
    console.log(user_id, link);
    const jobData = await Jobs.existingLink(user_id, link);
    console.log(jobData);
    res.status(200).json(jobData);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
};

/* ROLES */
export const getUniqueRolesController = async (req, res) => {
  const user_id = req.session.user.id;
  const company_id = req.params.company_id;
  try {
    const roleData = await Roles.uniqueRolesByUserIdCompanyId(
      user_id,
      Number(company_id)
    );
    res.status(200).json(roleData);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
};

export const createRoleController = async (req, res) => {
  const user_id = req.session.user.id;
  const { role_name, company_id } = req.body;

  try {
    if (!company_id || !role_name) {
      throw new Error("Make sure you have the company selected");
    }
    const roleData = await Roles.createRole(
      user_id,
      Number(company_id),
      role_name
    );
    res.status(200).json(roleData);
  } catch (error) {
    console.error(error.message);
    res.status(400).send({ message: error.message });
  }
};
