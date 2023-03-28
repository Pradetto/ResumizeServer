import ContactInfo from "../models/ContactInfo.js";
import Resume from "../models/Resume.js";
import Usage from "../models/Usage.js";
import Companies from "../models/Companies.js";
import Jobs from "../models/Jobs.js";

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

export const createJobRoleController = async (req, res) => {
  const user_id = req.session.user.id;
  const { role_name, company_id } = req.body;

  try {
    if (!role_name || !company_id) {
      throw new Error("Make sure you have the role name and company selected");
    }
    const role = await Jobs.createRole(user_id, company_id, role_name);
    res.status(200).json(role);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

export const getJobsListController = async (req, res) => {
  const user_id = req.session.user.id;
  const company_id = req.params.company_id;
  try {
    const jobsData = await Jobs.jobList(user_id, company_id);
    console.log("here is the jobs data", jobsData);
    res.status(200).json(jobsData);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
};
