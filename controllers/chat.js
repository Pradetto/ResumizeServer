import { Configuration, OpenAIApi } from "openai";
import Resume from "../models/Resume.js";

export const getPrompt = async (req, res) => {
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
  const response = await Resume.findById(53);
  console.log(response);
  const resumeText = response.text;

  let prompt = `I have a resume with the following content:\n${resumeText}\n\nI am applying for a ${position} position at ${company}. The job description is as follows:\n${jobDescription}\n\n`;

  // if (userInstructions) {
  //   prompt += `Here are additional instructions: ${userInstructions}\n\n`;
  // }

  prompt +=
    "Please help me write a cover letter for this position with the following structure. I only need the paragraphs JSON Object as the response. Do not include any greetings or closing to the hiring manager or mentioning my name I only need the content paragraphs.\n\n";
  prompt += "```\n";
  prompt += "{\n";
  prompt += '  "paragraphs": [],\n';
  prompt += "}\n";
  prompt += "```\n\n";
  // prompt += "```\n";
  // prompt += "{\n";
  // prompt += '  "introduction_paragraph": "",\n';
  // prompt += '  "body_paragraphs": [],\n';
  // prompt += '  "closing_paragraph": ""\n';
  // prompt += "}\n";
  // prompt += "```\n\n";

  console.log(prompt);

  /* MESSAGE LOGIC */
  const cover_letter_id = false;
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
  try {
    console.log("Start attempt");
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: message,
      temperature: 0.6,
      max_tokens: 1000,
    });
    // console.log(response);
    console.log("HERE IS THE USAGE", response.data.usage);
    const responseString = response.data.choices[0].message.content;
    console.log("Received response string:", responseString);

    // Parse the response string to a JSON object
    const responseObject = JSON.parse(responseString);
    console.log("Parsed response object:", responseObject);

    // // Access the paragraphs array from the JSON object
    // const paragraphsArray = responseObject.paragraphs;
    // console.log("Paragraphs array:", paragraphsArray);
    res.status(200).json({ paragraphs: responseObject });
  } catch (error) {
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      res.status(500).json({
        error: {
          message: "An error occurred during your request.",
        },
      });
    }
  }
};

// Token Management

export const updateTokens = async (user_id, prompt) => {};

// Reroll
export const getPromptWithInstructions = (req, res) => {};

// Edit

// Save

const position = "Software Engineer";
const company = "Delta";

const jobDescription = `Job description
Key Responsibilities:
• We are looking for a passionate software engineers who enjoy UI development. This is what you will be doing:
• hands on implementing front ends associated with the technical designs for product/project teams
• Transforming business requirements into conceptual/logical application architectures
• Determining feasibility & scalability of front-end solutions, interacting with business and product owners in order to define technical solutions for customer problems
• Production issue triage, management, and prevention as needed
• Technical definition and implementation for analytics, error logging/tracking, and other key functional customer interactions on delta.com
• UI Design reviews for feasibility and impact analysis
• Develop sustainable Accessibility compliant solutions
• Technical debt resolutions, prevention & code reviews
• Analysis and implementation of Performance/Stability/Reliability initiatives
• Research & Development of POCs & innovative new ideas for customer interactions with Delta -Assists in defining alternate solutions for the business problem.

Benefits and Perks to Help You Keep Climbing

What you need to succeed (minimum qualifications)
• 1-2 years of Experience
• Advanced level development skills in HTML5, JS and CSS
• Javascript versions ES2015/ES6 and Typescript - a superset of ES2015
• Node and NPM
• Javascript frameworks
• AngularJS v4
• Express JS
• jQuery
• UI testing, E2E testing
• Jasmine
• Karma
• Protractor
• PhantomJS
• Jest
• Cypress
• Application bundlers
• Webpack
• (optional) SystemJS
• Task runners
• Grunt, Gulp, etc
• CSS 3/Frameworks
• Bootstrap v3/v4
• Foundation CSS
• SaaS
• Experience with deployment in cloud
• Focus on Test Driven Development
• Quality forward development practices, with automation at forefront for continuous quality
• Performant sites focused on optimal time to interact for end consumers, and continuous focus on improvement of that
• Secure sites that adhere to best practices for information security
• Where permitted by applicable law, must have received or be willing to receive the COVID-19 vaccine by date of hire to be considered for U.S.-based job, if not currently employed by Delta Air Lines, Inc.
• Demonstrates that privacy is a priority when handling personal data.
• Embraces a diverse set of people, thinking and styles.
• Consistently makes safety and security, of self and others, the priority.

What will give you a competitive edge (preferred qualifications)
• Ability to write, execute and visualize test results
• Code organization and bundling for coherent packaging
• UI Grids, Responsive Web Design, using Figma to interact with visual design`;
