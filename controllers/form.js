import ContactInfo from "../models/ContactInfo.js";
import Resume from "../models/Resume.js";
import Usage from "../models/Usage.js";
import Companies from "../models/Companies.js";
import Jobs from "../models/Jobs.js";
import Roles from "../models/Roles.js";
import HiringManagers from "../models/HiringManagers.js";
import { generateCoverLetter } from "../util/generateCoverLetter.js";
import { generateTempalte } from "../util/generateTemplate.js";
import { processFile } from "../util/fileProcessing.js";
import JobsResume from "../models/JobResumes.js";
import CoverLetter from "../models/CoverLetter.js";
import JobCoverLetters from "../models/JobCoverLetters.js";
import { deleteFile } from "./fileStorage.js";

export const formSubmissionController = async (req, res) => {
  console.log("submitted");
  const {
    id: user_id,
    firstname,
    lastname,
    email: userEmail,
  } = req.session.user;
  const { id: resume_id, is_default: resumeIsDefault } = req.body.resume;
  const { id: company_id, company_name } = req.body.company;
  const { id: job_id, link, description } = req.body.job;
  const { id: role_id, role_name } = req.body.role;
  const {
    id: hiring_manager_id = false,
    name: hiring_manager_name = "",
    email = "",
    phone = "",
    address = "",
  } = req.body.hiring_manager || {};
  const { coverLetter = "" } = req.body.instructions || {};

  try {
    let resumeData;
    let contactData;

    try {
      const resumeUpdate = Resume.updateIsDefault(
        resume_id,
        user_id,
        resumeIsDefault
      );
      const contactInfo = ContactInfo.findByUserId(user_id);
      [resumeData, contactData] = await Promise.all([
        resumeUpdate,
        contactInfo,
      ]);
    } catch (error) {
      throw new Error(
        `Error while updating resume and fetching contact info: ${error.message}`
      );
    }

    let userPhone = contactData.phone;

    if (userPhone.length === 10) {
      userPhone = `(${userPhone.slice(0, 3)}) ${userPhone.slice(
        3,
        6
      )}-${userPhone.slice(6)}`;
    } else {
      userPhone = `+${userPhone}`;
    }

    let userAddress1 = "";
    if (contactData.apt !== "") {
      userAddress1 = `${contactData.street}, ${contactData.apt}`;
    } else {
      userAddress1 = contactData.street;
    }
    let userAddress2 = `${contactData.city}, ${contactData.state}`;
    let userAddress3 = contactData.postalCode;

    const render_employer = hiring_manager_id ? true : false;

    const templateData = generateTempalte(
      firstname,
      lastname,
      userEmail,
      userPhone,
      userAddress1,
      userAddress2,
      userAddress3,
      company_name,
      role_name,
      render_employer,
      hiring_manager_name,
      email,
      phone,
      address
    );

    /* JOBS */
    let jobData;
    let jobsResumesData;

    try {
      const jobRoleUpdate = Jobs.updateJobRoleAndDescription(
        job_id,
        role_id,
        description
      );
      const jobsResumeCreate = JobsResume.createJobsResume(
        user_id,
        job_id,
        resume_id
      );
      [jobData, jobsResumesData] = await Promise.all([
        jobRoleUpdate,
        jobsResumeCreate,
      ]);
    } catch (error) {
      throw new Error(
        `Error while updating job role and creating jobs-resumes: ${error.message}`
      );
    }

    /* GENERATE templateData paragraphs */

    /* COVER LETTER */
    let fileKey;
    let coverLetterData;
    try {
      const uploadResponse = await generateCoverLetter(user_id, templateData);

      const fileData = await processFile({
        key: uploadResponse.key,
        mimetype: uploadResponse.mimetype,
      });

      const { text, fileKey: localFileKey, mimetype } = fileData;
      fileKey = localFileKey;
      const filename = fileKey.split("/").slice(-1)[0];

      coverLetterData = await CoverLetter.createCoverLetter(
        user_id,
        fileKey,
        mimetype,
        filename,
        text,
        templateData
      );
      const jobsCoverLetterData = await JobCoverLetters.createJobsCoverLetter(
        user_id,
        job_id,
        coverLetterData.id
      );
    } catch (error) {
      console.log("Error here");
      console.log("delete file", fileKey);
      deleteFile(fileKey);
      throw new Error(
        `Error while creating cover letter and jobs-cover letters: ${error.message}`
      );
    }

    res.status(200).json({ id: coverLetterData.id, file_key: fileKey });
  } catch (error) {
    console.log(error.message);
    res.status(400).send({ message: error.message });
  }
};

export const getProfileInfoController = async (req, res) => {
  const user_id = req.session.user.id;

  try {
    const contactInfo = ContactInfo.findByUserId(user_id);
    const tokensInfo = Usage.findByUserId(user_id);

    const [contactData, tokensData] = await Promise.all([
      contactInfo,
      tokensInfo,
    ]);
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

// export const formSubmissionController = async (req, res) => {
//   console.log("submitted");
//   const {
//     id: user_id,
//     firstname,
//     lastname,
//     email: userEmail,
//   } = req.session.user;
//   const { id: resume_id, is_default: resumeIsDefault } = req.body.resume;
//   const { id: company_id, company_name } = req.body.company;
//   const { id: job_id, link, description } = req.body.job;
//   const { id: role_id, role_name } = req.body.role;
//   const {
//     id: hiring_manager_id = false,
//     name: hiring_manager_name = "",
//     email = "",
//     phone = "",
//     address = "",
//   } = req.body.hiring_manager || {};
//   const { coverLetter = "" } = req.body.instructions || {};

//   try {
//     /* RESUME */
//     const resumeData = await Resume.updateIsDefault(
//       resume_id,
//       user_id,
//       resumeIsDefault
//     );

//     /* CONTACT INFO LOGIC */
//     const contactData = await ContactInfo.findByUserId(user_id);
//     let userPhone = contactData.phone;

//     if (userPhone.length === 10) {
//       userPhone = `(${userPhone.slice(0, 3)}) ${userPhone.slice(
//         3,
//         6
//       )}-${userPhone.slice(6)}`;
//     } else {
//       userPhone = `+${userPhone}`;
//     }

//     let userAddress1 = "";
//     if (contactData.apt !== "") {
//       userAddress1 = `${contactData.street}, ${contactData.apt}`;
//     } else {
//       userAddress1 = contactData.street;
//     }
//     let userAddress2 = `${contactData.city}, ${contactData.state}`;
//     let userAddress3 = contactData.postalCode;

//     const render_employer = hiring_manager_id ? true : false;

//     const templateData = generateTempalte(
//       firstname,
//       lastname,
//       userEmail,
//       userPhone,
//       userAddress1,
//       userAddress2,
//       userAddress3,
//       company_name,
//       role_name,
//       render_employer,
//       hiring_manager_name,
//       email,
//       phone,
//       address
//     );

//     /* JOBS */
//     const jobData = await Jobs.updateJobRoleAndDescription(
//       job_id,
//       role_id,
//       description
//     );

//     /* JOBS_RESUMES */
//     const jobsResumesData = await JobsResume.createJobsResume(
//       user_id,
//       job_id,
//       resume_id
//     );

//     /* GENERATE templateData paragraphs */

//     /* COVER LETTER */

//     const uploadResponse = await generateCoverLetter(user_id, templateData);

//     const fileData = await processFile({
//       key: uploadResponse.key,
//       mimetype: uploadResponse.mimetype,
//     });

//     const { text, fileKey, mimetype } = fileData;
//     const filename = fileKey.split("/").slice(-1)[0];

//     const coverLetterData = await CoverLetter.createCoverLetter(
//       user_id,
//       fileKey,
//       mimetype,
//       filename,
//       text
//     );

//     const jobsCoverLetterData = await JobCoverLetters.createJobsCoverLetter(
//       user_id,
//       job_id,
//       coverLetterData.id
//     );
//     console.log("LOOK HEEREEE", jobsCoverLetterData.ok);

//     if (!jobsCoverLetterData.ok) {
//       console.log("delete file");
//       deleteFile(fileKey);
//     }
//     res.status(200).json({ fileKey });
//   } catch (error) {
//     res.status(400).send({ message: error.message });
//   }
// };
