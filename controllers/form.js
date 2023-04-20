import ContactInfo from "../models/ContactInfo.js";
import Resume from "../models/Resume.js";
import Usage from "../models/Usage.js";
import Companies from "../models/Companies.js";
import Jobs from "../models/Jobs.js";
import Roles from "../models/Roles.js";
import HiringManagers from "../models/HiringManagers.js";
import { generateCoverLetter } from "../util/generateCoverLetter.js";
import { generateTemplate } from "../util/generateTemplate.js";
import { processFile } from "../util/fileProcessing.js";
import JobsResume from "../models/JobResumes.js";
import CoverLetter from "../models/CoverLetter.js";
import JobCoverLetters from "../models/JobCoverLetters.js";
import { deleteFile } from "./fileStorage.js";
import { generateParagraphs } from "./chat.js";

export const formSubmissionController = async (req, res) => {
  // I NEED TO UPDATE HIRING MANAGER STILL

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
  const { coverLetter: coverLetterInstructions = "" } =
    req.body.instructions || {};

  /* HIRING MANAGER */
  try {
    let resumeData;
    let contactData;
    let hiringManagerData;

    try {
      const resumeUpdate = Resume.updateIsDefault(
        resume_id,
        user_id,
        resumeIsDefault
      );
      const contactInfo = ContactInfo.findByUserId(user_id);

      let hiringManagerUpdate;

      if (hiring_manager_id) {
        hiringManagerUpdate = HiringManagers.update(
          hiring_manager_id,
          hiring_manager_name,
          address,
          phone,
          email
        );
      }

      const results = await Promise.all([
        resumeUpdate,
        contactInfo,
        hiringManagerUpdate,
      ]);

      [resumeData, contactData, hiringManagerData] = results;
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

    /* JOBS */
    let jobData;

    try {
      const jobData = await Jobs.updateJobRoleAndDescription(
        job_id,
        role_id,
        description
      );
    } catch (error) {
      throw new Error(`Error while updating job role: ${error.message}`);
    }

    /* GENERATE templateData paragraphs */
    const paragraphs = await generateParagraphs(
      user_id,
      resume_id,
      role_name,
      company_name,
      description,
      coverLetterInstructions
    );

    const templateData = generateTemplate(
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
      paragraphs,
      hiring_manager_name,
      email,
      phone,
      address
    );

    //WEIRD Error handlign for duplciate entry ignoring for now this is if a user select an existing resume possibly need to add a conflict to the SQL query
    try {
      const jobsResumesData = await JobsResume.createJobsResume(
        user_id,
        job_id,
        resume_id
      );
    } catch (err) {
      console.log(
        "\n*****A duplicate entry was attempted but it is going to be ignored for the form*****\n"
      );
    }

    /* COVER LETTER */
    try {
      const coverLetterData = await updateOrCreateCoverLetter(
        user_id,
        job_id,
        templateData
      );

      res
        .status(200)
        .json({ id: coverLetterData.id, file_key: coverLetterData.file_key });
    } catch (error) {
      console.error(
        "Error while creating or updating cover letter and jobs-coverLetters"
      );
      throw new Error(
        `Error while creating or updating cover letter and jobs-cover letters: ${error.message}`
      );
    }
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

export const updateOrCreateCoverLetter = async (
  user_id,
  job_id,
  templateData
) => {
  try {
    const existingJobCoverLetter = await JobCoverLetters.findByUserIdAndJobId(
      user_id,
      job_id
    );

    if (existingJobCoverLetter) {
      const coverLetterData = await CoverLetter.findById(
        existingJobCoverLetter.cover_letter_id
      );
      const oldFileKey = coverLetterData.file_key;

      const uploadResponse = await generateCoverLetter(user_id, templateData);
      const fileData = await processFile({
        key: uploadResponse.key,
        mimetype: uploadResponse.mimetype,
      });

      const { text, fileKey: localFileKey, mimetype } = fileData;
      const filename = localFileKey.split("/").slice(-1)[0];

      await CoverLetter.updateCoverLetter(
        existingJobCoverLetter.cover_letter_id,
        user_id, // Add this line
        localFileKey,
        mimetype,
        filename,
        text,
        templateData
      );

      await deleteFile(oldFileKey);

      return {
        id: existingJobCoverLetter.cover_letter_id,
        file_key: localFileKey,
      };
    } else {
      // Create a new cover letter
      const uploadResponse = await generateCoverLetter(user_id, templateData);

      const fileData = await processFile({
        key: uploadResponse.key,
        mimetype: uploadResponse.mimetype,
      });

      const { text, fileKey: localFileKey, mimetype } = fileData;
      const filename = localFileKey.split("/").slice(-1)[0];

      const coverLetterData = await CoverLetter.createCoverLetter(
        user_id,
        localFileKey,
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

      return { id: coverLetterData.id, file_key: localFileKey };
    }
  } catch (error) {
    console.error("Error updating or creating cover letter", error);
    throw error;
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
    console.log(jobData);
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
