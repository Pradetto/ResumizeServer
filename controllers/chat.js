import { Configuration, OpenAIApi } from "openai";
import Resume from "../models/Resume.js";
import { updateOrCreateCoverLetter } from "./form.js";
import { generateTemplate } from "../util/generateTemplate.js";
import ContactInfo from "../models/ContactInfo.js";
import Usage from "../models/Usage.js";
import CoverLetter from "../models/CoverLetter.js";

const validateResponseFormat = (responseObject) => {
  if (!responseObject.hasOwnProperty("paragraphs")) {
    return false;
  }

  if (!Array.isArray(responseObject.paragraphs)) {
    return false;
  }

  for (const paragraph of responseObject.paragraphs) {
    if (typeof paragraph !== "string") {
      return false;
    }
  }

  return true;
};

export const generateParagraphs = async (
  user_id,
  resume_id,
  role_name,
  company,
  jobDescription,
  CoverLetterInstructions = "",
  editComment = "",
  coverLetterText = ""
) => {
  const apiKey = process.env.OPENAI_API_KEY;
  const configuration = new Configuration({
    apiKey,
  });
  const openai = new OpenAIApi(configuration);
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message:
          "OpenAI API key not configured, please follow instructions in README.md",
      },
    });
    return;
  }

  const usageInfo = Usage.findByUserId(user_id);
  const resumeInfo = await Resume.findById(resume_id);

  const [resumeData, usageObj] = await Promise.all([resumeInfo, usageInfo]);
  const resumeText = resumeData.text;

  let prompt;
  let setTemperature;

  if (editComment && coverLetterText) {
    prompt = `Please edit the middle paragraphs of the given cover letter according to the user's edit comments, while keeping the content as close to the original as possible. Focus only on the content between the introduction ("Dear...") and closing greetings ("Sincerely..."). Remove any text before the introduction and after the closing greetings. Make sure to split the middle paragraph text into 3 or more separate paragraphs.

  Original cover letter text:
  ${coverLetterText}

  User's edit comments:
  ${editComment}

  Return the revised middle paragraphs in this JSON format:

  {
    "paragraphs": [
      "Paragraph 1...",
      "Paragraph 2...",
      "...and so on"
    ]
  }

  Each element in the "paragraphs" array should be a string representing a separate paragraph.
  `;
    setTemperature = 0.3;
  } else {
    prompt = `I have a resume with the following content:\n${resumeText}\n\nI am applying for a ${role_name} position at ${company}. The job description is as follows:\n${jobDescription}\n\n`;

    if (CoverLetterInstructions !== "") {
      prompt += `Here are additional instructions: ${CoverLetterInstructions}\n\n`;
    }

    prompt += `Please help me write a cover letter for this position without using any introduction or closing greetings, such as 'Dear Hiring Manager', 'Sincerely', or 'Kind regards'. I only need the content paragraphs. Provide the paragraphs in the following JSON format:\n\n{
    "paragraphs": [
      "Paragraph 1...",
      "Paragraph 2...",
      "...and so on"
    ]
  }\n\nEach element in the "paragraphs" array should be a string representing a paragraph.\n\n`;

    setTemperature = 0.6;
  }

  const maxAttempts = 3;

  let message = [
    {
      role: "system",
      content:
        "helpful cover letter writer based off resume and job description",
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  let responseObject = {
    paragraphs: ["Error generating content"],
  };
  let lastResponse = "";
  let usage = {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
  };
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`Generate Paragraphs Attempt ${attempt}`);
    try {
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: message,
        temperature: setTemperature,
        max_tokens: 1000,
      });

      usage.prompt_tokens += response.data.usage.prompt_tokens;
      usage.completion_tokens += response.data.usage.completion_tokens;
      usage.total_tokens += response.data.usage.total_tokens;

      const responseString = response.data.choices[0].message.content.trim();
      lastResponse = responseString;

      let res;
      try {
        // Parse the response string to a JSON object
        res = JSON.parse(responseString);
      } catch (error) {
        if (error.message.startsWith("Unexpected token")) {
          console.error("Error parsing JSON:", error.message);
          if (attempt < maxAttempts) {
            message = [
              {
                role: "system",
                content:
                  "helpful cover letter writer based off resume and job description",
              },
              {
                role: "user",
                content: `The provided response was not in the correct format.Ensure the response does not include any introduction or closing greetings, such as 'Dear Hiring Manager', 'Sincerely', or 'Kind regards'. I only need the content paragraphs and reformat the response as follows: 

            {
              "paragraphs": [
                "Paragraph 1...",
                "Paragraph 2...",
                "...and so on"
              ]
            }

            Here's the received response:

            ${lastResponse}

            Each element in the "paragraphs" array should be a string representing a paragraph.`,
              },
            ];
            continue;
          } else {
            throw new Error(
              "Unable to generate paragraphs in the correct format"
            );
          }
        }
      }

      // Validate the parsed response
      if (validateResponseFormat(res)) {
        responseObject = res;
        break;
      } else {
        if (attempt < maxAttempts) {
          message = [
            {
              role: "system",
              content:
                "helpful cover letter writer based off resume and job description",
            },
            {
              role: "user",
              // content: `The provided response was not in the correct format. Please reformat the response as follows:
              content: `The provided response was not in the correct format.Ensure the response does not include any introduction or closing greetings, such as 'Dear Hiring Manager', 'Sincerely', or 'Kind regards'. I only need the content paragraphs and reformat the response as follows: 


            {
              "paragraphs": [
                "Paragraph 1...",
                "Paragraph 2...",
                "...and so on"
              ]
            }

            Here's the received response:

            ${lastResponse}

            Each element in the "paragraphs" array should be a string representing a paragraph.`,
            },
          ];
        } else {
          throw new Error(
            "Unable to generate paragraphs in the correct format"
          );
        }
      }
    } catch (error) {
      if (error.response) {
        console.error(error.response.status, error.response.data);
        res.status(error.response.status).json(error.response.data);
      } else {
        console.error(`Error with OpenAI API request: ${error.message}`);
        throw new Error("Error generating paragraphs");
      }
    }
  }

  // TOKEN MANAGEMENT
  const usage_response = await usageObj.update({
    prompt_tokens: usageObj.prompt_tokens + usage.prompt_tokens,
    completion_tokens: usageObj.completion_tokens + usage.completion_tokens,
  });

  return responseObject;
};

export const promptHandlerController = async (req, res) => {
  "start prompt handler";
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
  const editComment = req.body.editComment || "";
  const cover_letter_id = req.body.cover_letter.id;

  const contactInfo = ContactInfo.findByUserId(user_id);
  const coverLetterInfo = CoverLetter.findById(cover_letter_id);

  const [contactData, coverLetterData] = await Promise.all([
    contactInfo,
    coverLetterInfo,
  ]);

  const coverLetterText = coverLetterData.text;

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

  try {
    const paragraphs = await generateParagraphs(
      user_id,
      resume_id,
      role_name,
      company_name,
      description,
      coverLetterInstructions,
      editComment,
      coverLetterText
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

    try {
      const coverLetterData = await updateOrCreateCoverLetter(
        user_id,
        job_id,
        templateData
      );

      return res.status(200).json({
        id: coverLetterData.id,
        file_key: coverLetterData.file_key,
      });
    } catch (error) {
      console.error(
        "Error while creating or updating cover letter and jobs-coverLetters"
      );
      throw new Error(
        `Error while creating or updating cover letter and jobs-cover letters: ${error.message}`
      );
    }
  } catch (error) {
    res.status(500).json({
      error: {
        message: "Error updating cover letter.",
      },
    });
  }
};

// Token Management

export const updateTokens = async (user_id, prompt) => {};

// Save
