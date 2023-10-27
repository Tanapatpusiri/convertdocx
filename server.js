const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const multer = require("multer");
const fs = require("fs");
const pdf = require("pdf-parse");
const HtmlDocx = require('html-docx-js');
const cors = require("cors");
const { createWorker } = require("tesseract.js");


app.use(cors());
app.use(bodyParser.json());
const upload = multer({ dest: "uploads/" });

const keywords = ["name", "CSS", "Cypress", "MySQL", "MongoDB","Vue.js", "University","Secret Number game", "Information", "role" ,"21","IT","Docker","TANAPAT","SIT Announcement System","Communication","Teamwork","Problem Solving","Adaptability","Generate shortURL"];

function extractDataFromText(text, cvData) {
  let foundProgrammingLanguages = false;

  const lines = text.split('\n');
  console.log(lines);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
      
    for (const keyword of keywords) {
      if (line.includes(keyword)) {
        console.log(`บรรทัดที่ ${i + 1}: ${line}`);
        let value = line.replace(`${keyword} :`, '').trim();
        if (keyword === "TANAPAT") {
          cvData.personalInfo.name = value;
        } else if (keyword === "University") {
          cvData.education.university = value;
        } else if (keyword === "Vue.js") {
          cvData.technicalSkills.database = value;
        } else if (keyword === "Docker") {
          cvData.technicalSkills.tools= value;
        } else if (keyword === "Information") {
          cvData.education.major = value.split('.').map(item => item.trim());
        } else if (keyword === "21") {
          cvData.education.graduationYear= value;
        } else if (keyword === "role") {
          cvData.experiences.position = value;
        } else if (keyword === "Communication") {
          cvData.professionalSummary.summary1 = value;
        } else if (keyword === "Teamwork") {
          cvData.professionalSummary.summary2 = value;
        } else if (keyword === "Problem Solving") {
          cvData.professionalSummary.summary3 = value;
        } else if (keyword === "Adaptability") {
          cvData.professionalSummary.summary4 = value;
        } else if (keyword === "Generate shortURL") {
          cvData.experiences.project1 = value;
        } else if (keyword === "SIT Announcement System") {
          cvData.experiences.project2 = value;
        } else if (keyword === "Secret Number game") {
          cvData.experiences.project3 = value;
        } else if (keyword === "CSS" && !foundProgrammingLanguages) {
          cvData.technicalSkills.programmingLanguage = value.split(',').map(item => item.trim());
          foundProgrammingLanguages = true;
        } else if (keyword === "Docker" && !foundProgrammingLanguages) {
          cvData.technicalSkills.tools = value.split(',').map(item => item.trim());
          foundProgrammingLanguages = true;
        }
      }
    }
  }
}

app.post("/api/uploadCV", upload.single("cvFile"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const cvFile = req.file;
  const cvData = {
    personalInfo: {
      name: "",
      gender: "",
      age: "",
      maritalStatus: "",
      dateOfBirth: "",
      availability: "",
    },
    professionalSummary: {
      summary1:"",
      summary2:"",
      summary3:"",
      summary4:"",
    },
    education: {
      university: "",
      major: "",
      graduationYear: "",
    },
    experiences: {
      position: "",
      project1: "",
      project2: "",
      project3: "",
      responsibilities: "",
    },
    technicalSkills: {
      programmingLanguage: [],
      tools: [],
      database: [],
    },
  };

   if (cvFile.mimetype === "image/jpeg" || cvFile.mimetype === "image/png") {
    const worker = await createWorker();
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    const { data: { text } } = await worker.recognize(cvFile.path);
    console.log(text);
    extractDataFromText(text, cvData);
    const htmlContent = `
    <html>
    <body>
    <div>
    <h2>PERSONAL INFORMATION</h2>
    <div>Name: ${cvData.personalInfo.name}</div>
    <div>Gender: ${cvData.personalInfo.gender}</div>
    <div>Age: ${cvData.personalInfo.age}</div>
    <div>Marital status: ${cvData.personalInfo.maritalStatus}</div>
    <div>Date of birth: ${cvData.personalInfo.dateOfBirth}</div>
    <div>Availability: ${cvData.personalInfo.availability}</div>
  </div>
  <div>
    <h2>PROFESSIONAL SUMMARY</h2>
    <ul>
    <li> ${cvData.professionalSummary.summary1}</li>
    <li> ${cvData.professionalSummary.summary2}</li>
    <li> ${cvData.professionalSummary.summary3}</li>
    <li> ${cvData.professionalSummary.summary4}</li>
    </ul>
  </div>
  <div>
    <h2>EDUCATION</h2>
    <ul>
      <li>University: ${cvData.education.university}</li>
      <li>Major: ${cvData.education.major}</li>
      <li>Graduation Year: ${cvData.education.graduationYear}</li>
    </ul>
  </div>
  <div>
    <h2>EXPERIENCES</h2>
    <ul>
      <li>
        <div>Position: ${cvData.experiences.position}</div>
        <div>Project: ${cvData.experiences.project1}</div>
        <div>Project: ${cvData.experiences.project2}</div>
        <div>Project: ${cvData.experiences.project3}</div>
        <div>Responsibilities: ${cvData.experiences.responsibilities}</div>
      </li>
    </ul>
  </div>
  <div>
    <h2>TECHNICAL SKILLS</h2>
    <ul>
      <li>
        <div>Programming Language: ${cvData.technicalSkills.programmingLanguage}</div>
        <div>Tools: ${cvData.technicalSkills.tools}</div>
        <div>More: ${cvData.technicalSkills.database}</div>
      </li>
    </ul>
  </div>
    </body>
    </html>
  `;

  // แปลง HTML เป็นเอกสาร Word (.docx)
  var docx = HtmlDocx.asBlob(htmlContent);


    fs.writeFile('cv.docx', docx, function (err) {
      if (err) return res.status(500).json({ error: "Error creating DOCX" });
      console.log('done');
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename=cv.docx`);
      res.end(docx);
    });

    await worker.terminate();
  }else if (cvFile.mimetype === "application/pdf") {
    fs.readFile(cvFile.path, (err, data) => {
      if (err) {
        return res.status(500).json({ error: "Error reading CV" });
      }

      pdf(data).then(function (pdfData) {
        const text = pdfData.text;
        console.log(text);
        extractDataFromText(text, cvData);

          const htmlContent = `
    <html>
    <body>
    <div>
    <h2>PERSONAL INFORMATION</h2>
    <div>Name: ${cvData.personalInfo.name}</div>
    <div>Gender: ${cvData.personalInfo.gender}</div>
    <div>Age: ${cvData.personalInfo.age}</div>
    <div>Marital status: ${cvData.personalInfo.maritalStatus}</div>
    <div>Date of birth: ${cvData.personalInfo.dateOfBirth}</div>
    <div>Availability: ${cvData.personalInfo.availability}</div>
  </div>
  <div>
    <h2>PROFESSIONAL SUMMARY</h2>
    <ul>
    <li> ${cvData.professionalSummary.summary1}</li>
    <li> ${cvData.professionalSummary.summary2}</li>
    <li> ${cvData.professionalSummary.summary3}</li>
    <li> ${cvData.professionalSummary.summary4}</li>
    </ul>
  </div>
  <div>
    <h2>EDUCATION</h2>
    <ul>
      <li>University: ${cvData.education.university}</li>
      <li>Major: ${cvData.education.major}</li>
      <li>Graduation Year: ${cvData.education.graduationYear}</li>
    </ul>
  </div>
  <div>
    <h2>EXPERIENCES</h2>
    <ul>
      <li>
        <div>Position: ${cvData.experiences.position}</div>
        <div>Project: ${cvData.experiences.project1}</div>
        <div>Project: ${cvData.experiences.project2}</div>
        <div>Project: ${cvData.experiences.project3}</div>
        <div>Responsibilities: ${cvData.experiences.responsibilities}</div>
      </li>
    </ul>
  </div>
  <div>
    <h2>TECHNICAL SKILLS</h2>
    <ul>
      <li>
        <div>Programming Language: ${cvData.technicalSkills.programmingLanguage}</div>
        <div>Tools: ${cvData.technicalSkills.tools}</div>
        <div>More: ${cvData.technicalSkills.database}</div>
      </li>
    </ul>
  </div>
    </body>
    </html>
  `;

  // แปลง HTML เป็นเอกสาร Word (.docx)
  var docx = HtmlDocx.asBlob(htmlContent);


    fs.writeFile('cv.docx', docx, function (err) {
      if (err) return res.status(500).json({ error: "Error creating DOCX" });
      console.log('done');
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename=cv.docx`);
      res.end(docx);
    });
      });
    });
  }  else if (cvFile.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const fs = require("fs");
    fs.readFile(cvFile.path, (err, data) => {
      if (err) {
        return res.status(500).json({ error: "Error reading CV" });
      }
      const mammoth = require("mammoth");
      mammoth.extractRawText({ buffer: data })
        .then((result) => {
          const text = result.value;
          
          console.log(text);
          extractDataFromText(text, cvData);
         
          const htmlContent = `
          <html>
          <body>
          <div>
          <h2>PERSONAL INFORMATION</h2>
          <div>Name: ${cvData.personalInfo.name}</div>
          <div>Gender: ${cvData.personalInfo.gender}</div>
          <div>Age: ${cvData.personalInfo.age}</div>
          <div>Marital status: ${cvData.personalInfo.maritalStatus}</div>
          <div>Date of birth: ${cvData.personalInfo.dateOfBirth}</div>
          <div>Availability: ${cvData.personalInfo.availability}</div>
        </div>
        <div>
          <h2>PROFESSIONAL SUMMARY</h2>
          <ul>
          <li> ${cvData.professionalSummary.summary1}</li>
          <li> ${cvData.professionalSummary.summary2}</li>
          <li> ${cvData.professionalSummary.summary3}</li>
          <li> ${cvData.professionalSummary.summary4}</li>
          </ul>
        </div>
        <div>
          <h2>EDUCATION</h2>
          <ul>
            <li>University: ${cvData.education.university}</li>
            <li>Major: ${cvData.education.major}</li>
            <li>Graduation Year: ${cvData.education.graduationYear}</li>
          </ul>
        </div>
        <div>
          <h2>EXPERIENCES</h2>
          <ul>
            <li>
              <div>Position: ${cvData.experiences.position}</div>
              <div>Project: ${cvData.experiences.project1}</div>
        <div>Project: ${cvData.experiences.project2}</div>
        <div>Project: ${cvData.experiences.project3}</div>
              <div>Responsibilities: ${cvData.experiences.responsibilities}</div>
            </li>
          </ul>
        </div>
        <div>
          <h2>TECHNICAL SKILLS</h2>
          <ul>
            <li>
              <div>Programming Language: ${cvData.technicalSkills.programmingLanguage}</div>
              <div>Tools: ${cvData.technicalSkills.tools}</div>
              <div>More: ${cvData.technicalSkills.database}</div>
            </li>
          </ul>
        </div>
          </body>
          </html>
        `;
    
        var docx = HtmlDocx.asBlob(htmlContent);
          fs.writeFile('cv.docx', docx, function (err) {
            if (err) return res.status(500).json({ error: "Error creating DOCX" });
            console.log('done');
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            res.setHeader("Content-Disposition", `attachment; filename=cv.docx`);
            res.end(docx);
          });
        });
    });
  }

  // สร้าง HTML จากข้อมูลที่คุณได้จากไฟล์ PDF
  // const htmlContent = `
  //   <html>
  //   <body>
  //   <div>
  //   <h2>PERSONAL INFORMATION</h2>
  //   <div>Name: ${cvData.personalInfo.name}</div>
  //   <div>Gender: ${cvData.personalInfo.gender}</div>
  //   <div>Age: ${cvData.personalInfo.age}</div>
  //   <div>Marital status: ${cvData.personalInfo.maritalStatus}</div>
  //   <div>Date of birth: ${cvData.personalInfo.dateOfBirth}</div>
  //   <div>Availability: ${cvData.personalInfo.availability}</div>
  // </div>
  // <div>
  //   <h2>PROFESSIONAL SUMMARY</h2>
  //   <ul>
  //     ${cvData.professionalSummary.map(
  //       (summary) => `<li>${summary}</li>`
  //     )}
  //   </ul>
  // </div>
  // <div>
  //   <h2>EDUCATION</h2>
  //   <ul>
  //     <li>University: ${cvData.education.university}</li>
  //     <li>Major: ${cvData.education.major}</li>
  //     <li>Graduation Year: ${cvData.education.graduationYear}</li>
  //   </ul>
  // </div>
  // <div>
  //   <h2>EXPERIENCES</h2>
  //   <ul>
  //     <li>
  //       <div>Position: ${cvData.experiences.position}</div>
  //       <div>Project: ${cvData.experiences.project}</div>
  //       <div>Responsibilities: ${cvData.experiences.responsibilities}</div>
  //     </li>
  //   </ul>
  // </div>
  // <div>
  //   <h2>TECHNICAL SKILLS</h2>
  //   <ul>
  //     <li>
  //       <div>Programming Language: ${cvData.technicalSkills.programmingLanguage}</div>
  //       <div>Tools: ${cvData.technicalSkills.tools}</div>
  //       <div>Database: ${cvData.technicalSkills.database}</div>
  //     </li>
  //   </ul>
  // </div>
  //   </body>
  //   </html>
  // `;

  // แปลง HTML เป็นเอกสาร Word (.docx)
  // var docx = HtmlDocx.asBlob(htmlContent);


    // fs.writeFile('cv.docx', docx, function (err) {
    //   if (err) return res.status(500).json({ error: "Error creating DOCX" });
    //   console.log('done');
    //   res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    //   res.setHeader("Content-Disposition", `attachment; filename=cv.docx`);
    //   res.end(docx);
    // });

  console.log(cvData);
  console.log(docx);
});


 

app.get("/api/downloadCV", (req, res) => {
  // อ่านเนื้อหาของไฟล์ .docx และส่งไปยังผู้ใช้
  const filePath = "C:/Users/bomka/CVtemplate/cvtemplate/cv.docx"; // เปลี่ยนเส้นทางไฟล์ไปยัง .docx ของคุณ
  res.download(filePath, "cv.docx", (err) => {
    if (err) {
      console.error("Error downloading CV:", err);
      res.status(500).send("Error downloading CV");
    } else {
      console.log("CV downloaded successfully");
    }
  });
});


app.use((req, res, next) => {
  // Add your desired domain to the "Access-Control-Allow-Origin" header.
  res.setHeader("Access-Control-Allow-Origin", "YOUR_DOMAIN_HERE");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.listen(1000, () => {
  console.log("Server is running on port 1000");
});
