import ContactInfo from "../models/ContactInfo.js";
import Resume from "../models/Resume.js";
import Usage from "../models/Usage.js";
import Companies from "../models/Companies.js";
import Jobs from "../models/Jobs.js";
import Roles from "../models/Roles.js";
import HiringManagers from "../models/HiringManagers.js";
import { generateCoverLetter } from "../util/generateCoverLetter.js";

export const formSubmissionController = async (req, res) => {
  console.log("submitted");
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
    // console.log("Here is the resumeData", resumeData);

    // /* COMPANY */
    // if (isNew) {
    //   // await Companies.insertCompany(user_id, company_name);
    // } else if (company_id) {
    //   // QUERY THE EXISTING INFORMATION IF NEEDED
    // }
    const final = await generateCoverLetter(user_id, templateData);
    console.log(final);
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
    const jobData = await Jobs.existingLink(user_id, link);
    res.status(200).json(jobData);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
};

/* ROLES */

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

/* HIRING_MANAGER */
export const createHiringManagerController = async (req, res) => {
  const user_id = req.session.user.id;
  const { hiring_manager, company_id } = req.body;

  try {
    if (!company_id || !hiring_manager) {
      throw new Error("Make sure you have the company selected");
    }
    const hiringManagerData = await HiringManagers.createHiringManager(
      user_id,
      Number(company_id),
      hiring_manager
    );
    res.status(200).json(hiringManagerData);
  } catch (error) {
    console.error(error.message);
    res.status(400).send({ message: error.message });
  }
};

/* GET ROLES AND HIRING MANAGERS */
export const getUniqueRolesAndHiringManagersController = async (req, res) => {
  const user_id = req.session.user.id;
  const company_id = Number(req.params.company_id);
  try {
    const [roleData, hiringMangerData] = await Promise.all([
      Roles.uniqueRolesByUserIdCompanyId(user_id, company_id),
      HiringManagers.hiringManagersByCompanyId(user_id, company_id),
    ]);

    const combinedData = {
      roles: roleData,
      hiring_manager: hiringMangerData,
    };
    res.status(200).json(combinedData);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
};

const templateData = {
  user: {
    firstname: "Michael",
    lastname: "Pradetto",
    // position: "Software Engineer",
    address: "123 Main St, Anytown, USA",
    phone: "555-123-4567",
    email: "john.doe@example.com",
  },
  date: new Date().toLocaleDateString(),
  default_name: "Hiring Manager",
  render_employer: true,
  required_employer: {
    company_name: "ABC Company",
    role: "Full Stack Engineer",
  },
  employer: {
    hiring_manager: "Jane Smith",
    address: "456 Oak Ave, Anytown, USA",
    phone: "555-987-6543",
    email: "jane.smith@abccompany.com",
  },
  content: {
    introduction_paragraph:
      "I am excited to apply for the Software Engineer position at ABC Company. With my extensive experience in full-stack development and expertise in multiple programming languages, I am confident that I would make a valuable addition to your team.",
    body_paragraphs: [
      "In my current role at XYZ Company, I have led the development of a web application that improved user experience and increased sales revenue by 25%. I have also worked on projects using frameworks such as ReactJS and NodeJS, and I am proficient in databases such as SQL and MongoDB.",
      "Moreover, my certifications in AWS and Microsoft Azure demonstrate my commitment to staying up-to-date with the latest industry trends and technologies. I believe my technical skills, coupled with my passion for software development and dedication to teamwork, make me an ideal candidate for this position.",
      "Thank you for considering my application. I look forward to discussing my qualifications further in an interview.",
    ],
    closing_paragraph:
      "Again, thank you for considering my application. I am excited about the opportunity to join the team at ABC Company and contribute to the development of innovative software solutions. I look forward to hearing from you soon.",
  },
};
