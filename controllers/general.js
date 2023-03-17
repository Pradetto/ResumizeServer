import { Configuration, OpenAIApi } from "openai";
import ContactInfo from "../models/ContactInfo.js";

export const getContactInfoController = async (req, res) => {
  const userId = req.session.user.id;

  try {
    const data = await ContactInfo.findByUserId(userId);
    return res.status(200).json({ ...req.session.user, ...data });
  } catch (err) {
    return res.status(400).send({ message: err.message });
  }
};

export const getPrompt = async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;

  const configuration = new Configuration({
    apiKey,
  });

  const openai = new OpenAIApi(configuration);

  const { message } = req.body;
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message:
          "OpenAI API key not configured, please follow instructions in README.md",
      },
    });
    return;
  }
  try {
    console.log("Start attempt");
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
      temperature: 0.6,
      max_tokens: 100,
    });
    res.status(200).json({ result: response.data.choices[0].message.content });
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
