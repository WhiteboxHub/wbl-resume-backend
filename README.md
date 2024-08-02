# json-resume

**Version:** 1.0.0

**Description:**  
json-resume is a resume maker application that helps candidates create professional resumes to assist them in their job search. The application features an intuitive UI for inputting resume data, generating JSON data from the input, and providing a PDF preview of the resume.

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
git clone https://github.com/ManisaiReddy/json-resume.git
cd json-resume
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

1. Open your browser and navigate to `http://localhost:8081`.
2. Fill out the resume forms.
3. Submit the form to preview your resume in HTML.
4. Generate the PDF of your resume.

## Endpoints

- **GET `http://localhost:8081/`**  
  Serve the landing page of the application.

- **GET `http://localhost:8081/forms`**  
  Serve the forms page for inputting resume data.

- **POST `http://localhost:8081/submit-form`**  
  Submit the form data to render the resume in HTML.

- **POST `http://localhost:8081/generate-pdf`**  
  Generate the PDF resume from the HTML content.

## License

This project is licensed under the MIT License.

## Contribution

Contributions are welcome! Please open an issue or submit a pull request on GitHub.

---

Made with ❤️ by Whitebox-Learning
no