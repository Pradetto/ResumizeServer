import { Configuration, OpenAIApi } from "openai";
import Resume from "../models/Resume.js";
import { updateOrCreateCoverLetter } from "./form.js";
import { generateTemplate } from "../util/generateTemplate.js";
import ContactInfo from "../models/ContactInfo.js";

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
  resume_id,
  role_name,
  company,
  jobDescription,
  CoverLetterInstructions = "",
  editComments = "",
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
  const response = await Resume.findById(resume_id);
  const resumeText = response.text;

  let prompt;

  if (editComments && coverLetterText) {
    prompt = `Here's the original cover letter text:\n${coverLetterText}\n\nEdit comments: ${editComments}\n\nPlease make the suggested edits to the cover letter and provide the revised middle paragraphs (i.e., between the introduction and closing greetings) in the following JSON format:\n\n{
    "paragraphs": [
      "Paragraph 1...",
      "Paragraph 2...",
      "...and so on"
    ]
  }\n\nEach element in the "paragraphs" array should be a string representing a paragraph.\n\n`;
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
  }

  const maxAttempts = 3;
  let tokens; // I NEEED TO ACCUMULATE ALL TOKENS ON MaxAttempts each time it is called and i get a resposne take the tokens and add them together

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
        temperature: 0.6,
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

  console.log("here was the total usage", usage);
  return responseObject;
};

export const promptHandlerController = async (req, res) => {
  "start prompt handler";
  console.log(req.body);
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

  const contactData = await ContactInfo.findByUserId(user_id);

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

  let editComments = "EDITTTTT";
  let coverLetterText = "COVER LETTERRRR TEXTTTT";

  try {
    console.log("1");
    console.log(resume_id);
    console.log(role_name);
    console.log(company_name);
    console.log(description);
    console.log(coverLetterInstructions);
    console.log(editComments);
    console.log(coverLetterText);

    const paragraphs = await generateParagraphs(
      resume_id,
      role_name,
      company_name,
      description,
      coverLetterInstructions,
      editComments,
      coverLetterText
    );
    console.log("2");
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
    console.log("3");
    try {
      console.log("4");
      const coverLetterData = await updateOrCreateCoverLetter(
        user_id,
        job_id,
        templateData
      );
      console.log("5");
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
