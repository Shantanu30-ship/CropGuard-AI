# CropGuard — AWS-ready Cloud Computing Mini Project

**Course:** CSE2285 · Cloud Computing  
**Section:** 5CIT02  
**Project:** Crop Disease Information and Prevention Website

## What this prototype does

- Responsive website for laptop, tablet and mobile browsers.
- Crop selection for tomato, potato and maize.
- Symptom checklist and a transparent, rule-based symptom matching demonstration.
- Prevention and suggested next-step guidance for selected common diseases.
- Local image upload and preview (the image is not analysed or uploaded).
- No login, database or paid API is required for this first working version.

**Important limitation:** This version does not contain a trained machine-learning model. The image is only previewed locally; results are generated from the crop and symptoms selected by the user. Do not describe this version as AI image classification. A future model phase can use a properly trained and validated PlantVillage-style classifier deployed behind an API.

## Run locally

1. Extract the ZIP.
2. Open `index.html` in a modern browser, or run a local server:
   ```bash
   python3 -m http.server 8000
   ```
3. Visit `http://localhost:8000`.

The external hero photograph and Google Fonts require internet access. The rest of the site works locally.

## Deploy to AWS (recommended: AWS Amplify Hosting)

Amplify Hosting provides a public HTTPS URL and serves the static website globally. It is a managed hosting service; no EC2 server is needed.

1. Create a GitHub repository and upload the contents of this project folder (keep `index.html`, `styles.css` and `app.js` at the repository root).
2. Sign in to the AWS Management Console and open **AWS Amplify**.
3. Choose **Create new app** → **Host web app**.
4. Connect GitHub, authorize access and select the repository and branch.
5. For this plain HTML/CSS/JavaScript project, use the default build settings or configure no build command and publish the repository root.
6. Review and choose **Save and deploy**.
7. Wait for deployment to finish. Copy the generated `https://...amplifyapp.com` URL.
8. Open the URL on a phone and laptop to test responsive behaviour.

AWS console labels can change. Use the current Amplify Hosting workflow shown in your account.

## Alternative: Amazon S3 static website hosting

For a simple demonstration, you can also upload the three website files to an S3 bucket and enable static website hosting. For public access, configure bucket policy and Block Public Access carefully. S3 website endpoints do not provide HTTPS by themselves; use CloudFront with Origin Access Control for a secure public HTTPS deployment. Do not put secrets or credentials in website files.

## Cloud architecture and models

**User device (mobile/laptop) → HTTPS → AWS Amplify Hosting → static HTML/CSS/JavaScript → browser-based symptom matching.**

- **Cloud provider:** Amazon Web Services (AWS)
- **Cloud service:** AWS Amplify Hosting
- **Service model:** PaaS / managed static web hosting
- **Deployment model:** Public cloud
- **Security:** HTTPS delivery; no credentials or sensitive user data collected by this prototype.

The image preview and symptom matching happen in the user's browser. This prototype does not store images in AWS.

## Suggested live demonstration

1. Open the deployed public URL on a laptop or phone.
2. Scroll to the Crop Health Checker.
3. Select Tomato.
4. Select “Brown spots with ring-like patterns” and “Yellowing of older leaves”.
5. Submit and explain the Early blight symptom match and prevention tips.
6. Repeat with Potato or Maize.
7. Show the same public URL on a second device.

## Project structure

```text
CropGuard_AWS_Project/
├── index.html
├── styles.css
├── app.js
└── README.md
```

## Academic integrity and references

This is an educational prototype. Review, understand and adapt the code before submission, and acknowledge AI assistance in the project README and presentation as required by the assignment.

Useful references to consult and cite in the final presentation:
- AWS Amplify Hosting documentation: https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html
- AWS S3 static website hosting: https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html
- University CA3 mini-project brief, CSE2285, Section 5CIT02 (provided by the project team).

Disease descriptions are simplified educational summaries. Confirm local diagnosis and crop protection decisions with a qualified agricultural extension professional.


## AI image-classification upgrade (backend)

The `backend/` folder contains a FastAPI inference service. It uses the public `neghani/plantvillage-resnet18` image-classification model (38 PlantVillage classes) through Hugging Face Transformers. The model card reports 97.90% accuracy on its held-out PlantVillage test split, but also documents that field-photo performance is substantially lower and that unknown diseases/crops can be forced into a known class. Do not present the benchmark score as real-farm accuracy.

### Deploy the AI API to AWS App Runner

1. Push the entire project to GitHub.
2. In AWS Console, open **App Runner** → **Create service**.
3. Choose **Source code repository**, connect GitHub, select the project repository and branch.
4. Set **Source directory** to `backend`.
5. Choose **Build configuration** → **Use a Dockerfile** (path `Dockerfile`).
6. Configure a CPU service with sufficient memory for PyTorch/Transformers (start with 2 GB or higher if available). This is a continuously running managed service and can incur charges while provisioned; check current pricing before creating it.
7. Set environment variable `CONFIDENCE_THRESHOLD` to `0.50`. Set `ALLOWED_ORIGINS` to your Amplify URL after the frontend is deployed. For initial API smoke testing, `*` is the default; restrict it to the Amplify domain for the final demo.
8. Create the service and wait for deployment. App Runner provides an HTTPS service URL.
9. Test `https://YOUR-API-URL/health` and `https://YOUR-API-URL/` in a browser.
10. Copy the API URL into the `window.CROPGUARD_API_URL` value in `config.js`, commit and push. Amplify will redeploy the frontend.

### AI frontend flow

When a user attaches an image and submits the form, `app.js` posts the image as multipart form data to `POST /predict`. The API validates the image, runs the classifier and returns the top prediction, confidence and top three classes. When no image is attached, the original symptom-based demonstration remains available.

### Important safeguards

- The model is a research/educational aid, not a plant-pathology diagnosis.
- Use a single, close-up RGB leaf image in daylight. Do not upload a whole field or multiple leaves in one frame.
- Below 50% confidence the API returns an uncertainty status; this threshold is a cautious routing rule, not a guarantee of correctness.
- Do not apply pesticides based only on the model output. Confirm with local agricultural extension guidance and product labels.
- Do not store AWS access keys in website code or GitHub.

### Model reference

- Model: https://huggingface.co/neghani/plantvillage-resnet18 (Apache-2.0 model card; 38 classes)
- AWS App Runner guide: https://docs.aws.amazon.com/apprunner/latest/dg/getting-started.html
- AWS Amplify Hosting guide: https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html
