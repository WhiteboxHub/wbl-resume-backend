# json-live-resume

**Version:** 1.0.0

**Description:**  
json-live-resume is a resume maker application that helps candidates create professional resumes to assist them in their job search. The application features an intuitive UI for inputting resume data and showcasing the seamless live resume generation, generating JSON data from the input, and providing the html preview of the resume and resume download feature too

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Endpoints](#endpoints)
- [License](#license)

## Features

- Generate professional resumes
- Real-time preview of resume in PDF format
- Export resume to PDF
- Tailwind CSS for styling
- Handlebars templating

## Installation

1. **Clone the repository:**

\`\`\`
git clone https://github.com/WhiteboxHub/wbl-resume-backend.git
cd wbl-resume-backend
\`\`\`
  
2. **Install dependencies:**

\`\`\`
npm install
\`\`\`

3. **Run the development server:**

\`\`\`
npm start
\`\`\`

4. **Build CSS with Tailwind:**

\`\`\`
npm run build:css
\`\`\`

## Usage

1. Open your browser and navigate to `https://whitebox-learning/resume`
 (you need to have access to the whitebox-learning portal to see te resume page)
2. Fill out the resume forms you'll be seeing a live resume
3. click on Json to get the output json from input data
4. click on Pdf to download the generated pdf

## Endpoints

- **GET `https://whitebox-learning.com/resume`**
  # or
- **GET `https://www.whitebox-learning.com/resume`**

- **POST `https://whitebox-learning.com/resume/getJson`**  
  you'll get a generated Json file 

- **POST `https://whitebox-learning.com/resume/download-pdf`**  
  Generate the PDF resume from the HTML content.

## License

This project is licensed under the MIT License.

## Contribution

Contributions are welcome! Please open an issue or submit a pull request on GitHub.

---

Made with ❤️ by Whitebox-Learning
