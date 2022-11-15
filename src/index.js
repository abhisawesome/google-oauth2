import express from "express";
import { google } from "googleapis";
import axios from 'axios';
import config from "./config/config.json";
import credentials from "./config/credentials.json";

const app = express();

const scopes = ["https://www.googleapis.com/auth/userinfo.profile"];

const oauth2Client = new google.auth.OAuth2(
  credentials.client_id,
  credentials.client_secret,
  credentials.redirect_uris
);
/**
 * To get the login URL
 */
app.get("/login-url", (req, res) => {
  // Generate a url that asks permissions for the Drive activity scope
  const authorizationUrl = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: "offline",
    /** Pass in the scopes array defined above.
     * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
    scope: scopes,
    // Enable incremental authorization. Recommended as a best practice.
    include_granted_scopes: true,
    prompt: "consent",
  });
  return res.status(200).json({ url: authorizationUrl });
});

/**
 * Callback after google login
 */

app.get("/login-callback", async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    const oauth2 = google.oauth2({
      version: "v2",
      auth: oauth2Client,
    });
    console.log(tokens)
    oauth2Client.setCredentials(tokens);
    const userInfo = await oauth2.userinfo.get();
    return res.status(200).json(userInfo);
  } catch (error) {
    return res.status(500).json({ status: false });
  }
});

/**
 * Regenerate access token using refresh token from the login-callback
 */
app.get("/generate-new-token", async (req, res) => {
  try {
    const { refresh_token } = req.query;
    const url = "https://www.googleapis.com/oauth2/v4/token";
    const response = await axios.post(url, {
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      refresh_token,
      grant_type: "refresh_token",
    });
    return res.status(200).json(response.data);
  } catch (error) {
    console.log(error)
    return res.status(500).json({ status: false });
  }
});

app.listen(config.PORT, () => {
  console.log("server starts in " + config.PORT);
});
