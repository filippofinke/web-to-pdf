import { NextApiRequest, NextApiResponse } from "next";
const playwright = require("playwright-aws-lambda");

const getDomain = (url: string) => {
  return new URL(url).hostname;
};

const validUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  // get the url query parameter
  const { url } = request.query;

  if (!url) {
    response.status(400).send("Missing url parameter");
    return;
  }

  if (!validUrl(url as string)) {
    response.status(400).send("Invalid url parameter");
    return;
  }

  try {
    const browser = await playwright.launchChromium({
      headless: true,
    });
    const context = await browser.newContext();

    const page = await context.newPage();

    await page.goto(url as string);

    const pdfBytes = await page.pdf({
      format: "a4",
    });
    await browser.close();

    let fileName = getDomain(url as string) + ".pdf";

    response.setHeader("Content-Type", "application/pdf");
    response.setHeader(
      "Content-Disposition",
      'inline; filename="' + fileName + '"'
    );

    response.status(200).send(pdfBytes);
  } catch (error: any) {
    response.status(500).json({ error: error.message });
  }
}
