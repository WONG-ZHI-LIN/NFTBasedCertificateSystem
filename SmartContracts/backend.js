  const express = require("express");
  const Web3 = require("web3");
  const web3 = new Web3("http://127.0.0.1:8545"); // Ganache Local
  const dotenv = require("dotenv");
  const path = require("path");
  const crypto = require('crypto');
  const PDFDocument = require("pdfkit");
  const pdfParse = require("pdf-parse");
  const multer = require("multer");
  const fs = require("fs");


  const upload = multer({ dest: "uploads/" }); // The file will be uploaded to the 'uploads' folder

  dotenv.config();

  const app = express();
  app.use(express.json());

  // Serve static files
  app.use(express.static(path.join(__dirname, "public")));

  // Serve the admin login page
  app.get("/admin_login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin_login.html"));
  });

  // Serve the student login page
  app.get("/student_login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "student_login.html"));
  });

  // Connect to local Ganache or any other Ethereum network

  // Contract ABI and Address (from deployment)
  const contractABI = require("./artifacts/contracts/CertificateNFT.sol/CertificateNFT.json").abi; // ABI of the CertificateNFT contract
  const userABI = require("./artifacts/contracts/Users.sol/UserContract.json").abi;

  const certContractAddress = process.env.CERT_CONTRACT_ADDRESS;
  const userContractAddress = process.env.CERT_CONTRACT_ADDRESS;

  const certificateNFT = new web3.eth.Contract(contractABI, certContractAddress);
  const userNFT = new web3.eth.Contract(userABI, userContractAddress);

  // Admin account - private key to sign transactions
  const privateKey = process.env.PRIVATE_KEY;
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);

  
  app.post("/mint-certificate", async (req, res) => {
      const { certName, description, recipientName, recipientaddress, course, faculty, studentId } = req.body;

      if (!certName || !description || !recipientName || !recipientaddress || !course || !faculty || !studentId) {
          return res.status(400).json({ message: "All fields are required." });
      }
      
      const recipientAddress = web3.utils.toChecksumAddress(recipientaddress);
      const objectID = Date.now().toString();
      const issuedDate = new Date().toISOString().split("T")[0];
      const metadata = {
          certName,
          description,
          recipientName,
          recipientAddress,
          course,
          faculty,
          issuedDate,
          objectID,
          studentId, // Include studentId in metadata
      };

      try {
          //const owner = await certificateNFT.methods.owner().call();

          if (!web3.utils.isAddress(recipientAddress)) {
            return res.status(400).json({ message: "Invalid recipient address." });
        }
          // Generate metadata hash
          const metadataHash = generateMetadataHash(metadata);
          console.log("metahash", metadataHash);
          if (metadataHash.length === 0) {
            return res.status(400).json({ message: "Metadata hash is empty." });
        }
          console.log("END12");
          // Mint certificate on-chain
          const data = certificateNFT.methods.mintCertificate(recipientAddress, metadataHash, objectID).encodeABI();
          const tx = {
              from: account.address,
              to: certContractAddress,
              data,
              gas: 5000000,
              chainId: 1337,
          };
          const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
          const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

          if (receipt.logs.length > 0) {
            console.log("Event Logs:", receipt.logs);
            console.log("Receipt Logs:", JSON.stringify(receipt.logs, null, 2));

        } else {
            console.error("No event logs found. Transaction likely reverted.");
        }
          if (!receipt.status) {
              console.error("Transaction failed:", receipt);
              throw new Error("Transaction failed");
          }
          
          // Generate the PDF certificate
          const pdfBuffer = await generateCertificatePDF(metadata);

          // Send the PDF as a downloadable file
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename=${recipientName}_Certificate.pdf`);
          res.send(pdfBuffer);
      } catch (err) {
          console.error("Error minting certificate:", err);
          res.status(500).json({ message: "Error minting certificate: " + err.message });
      }
  });

  // Validate request data
  app.post("/verify-certificate", upload.single("certificatePdf"), async (req, res) => {
    const { claimedOwner } = req.body;
    const pdfPath = req.file.path;

    // Validate request data
    if (!claimedOwner) {
      return res.status(400).json({ error: "Claimed owner address is required." }); // JSON response
    }

    const claimedOwnerAddress = web3.utils.toChecksumAddress(claimedOwner);

    try {
        // Extract PDF metadata
        console.log("Extracting PDF metadata...");
        const pdfBuffer = fs.readFileSync(pdfPath, { flag: 'r' });
        const pdfData = await pdfParse(pdfBuffer); // Ensure this is inside an async function

        console.log("pdfData", pdfData);
        console.log("end1");

        const pdfKeywords = pdfData.info.Keywords;

        // Extract certificate metadata (Assuming the metadata is embedded in the PDF)
        const extractedMetadata = {};
        if (pdfKeywords) {
          console.log("Extracting metadata from PDF keywords...");
            const keywordsArray = pdfKeywords.split(", ");
            keywordsArray.forEach(keyword => {
                const [key, value] = keyword.split(": ");
                extractedMetadata[key] = value;
            });
        }
        console.log("end2");

        console.log("Extracted Metadata: ", extractedMetadata); // Log extracted metadata
        console.log("Claimed Owner Address: ", claimedOwner); // Log claimed owner address

        // Generate the metadata hash
        const metadataHash = generateMetadataHash(extractedMetadata);
        console.log("meta", metadataHash);
        console.log("upload pdf hash: ", metadataHash);

        // Convert objectID from extracted metadata to uint256
        const objectID = web3.utils.toBN(extractedMetadata.objectID).toString();

        const storedHash = await certificateNFT.methods.getMetadataHashes(objectID).call();
        const certOwner = await certificateNFT.methods.ownerOf(objectID).call();
        console.log("Stored Hash: ", storedHash);
        console.log("Cert Owner: ", certOwner);

        if (metadataHash === storedHash && certOwner === claimedOwnerAddress) {
            console.log("Certificate is valid.");
            res.json({ valid: true, message: "Certificate is valid." });
        }else{
            res.json({ valid: false, message: "Certificate is invalid." });
        }

    } catch (err) {
      res.status(500).json({ error: "Error verifying certificate: " + err.message }); // JSON response
    } finally {
        // Clean up the uploaded file
        fs.unlinkSync(pdfPath); // Delete the uploaded file after processing
    }
  });

  // Function to generate metadata hash (SHA-256)
  function generateMetadataHash(metadata) {
      const metadataString = JSON.stringify(metadata); 
      console.log("stringfy:", metadataString); // Convert metadata to string
      const hash = crypto.createHash('sha256').update(metadataString).digest('hex');  // Generate SHA-256 hash
      return hash;
  }


  // Function to generate the PDF certificate
  function generateCertificatePDF(metadata) {
      return new Promise((resolve, reject) => { // ✅ Wrapped in a Promise
          const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });
          const chunks = [];
      
          doc.on('data', (chunk) => chunks.push(chunk));
          doc.on('end', () => {
            resolve(Buffer.concat(chunks)); // ✅ `resolve` is now defined
          });
          doc.on('error', (err) => {
            reject(err); // ✅ `reject` is now defined
          });

    // Ensure `doc.page` is properly initialized
    if (!doc.page) {
      const error = new Error("PDFDocument page is not initialized.");
      console.error(error); // Log the error
      reject(error); // Reject the Promise
      return;
    }

      // Define pageWidth and pageHeight
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      console.log("Page dimensions:", { pageWidth, pageHeight }); // Debugging

    // Set gold color for the border
    doc.strokeColor(218, 165, 32); // Gold color (RGB)
    doc.lineWidth(5);

    // Draw the gold border
    doc.rect(20, 20, pageWidth - 40, pageHeight - 40).stroke(); // 'stroke' for border only

    // Add certificate content
    doc.font('Helvetica-Bold')
      .fontSize(28)
      .text('CERTIFICATE OF ACHIEVEMENT', { align: 'center', x: pageWidth / 2, y: 120 });

    doc.font('Helvetica')
      .fontSize(14)
      .text('This certificate is proudly presented to', { align: 'center', x: pageWidth / 2, y: 160 });

    doc.font('Times-Italic')
      .fontSize(24)
      .text(metadata.recipientName, { align: 'center', x: pageWidth / 2, y: 200 });

    doc.font('Helvetica')
      .fontSize(14)
      .text(`For successfully completing the ${metadata.course} program`, { align: 'center', x: pageWidth / 2, y: 240 })
      .text(`with a ${metadata.faculty} classification`, { align: 'center', x: pageWidth / 2, y: 260 });

    doc.fontSize(12)
      .text(`Student ID: ${metadata.studentId}`, { align: 'center', x: pageWidth / 2, y: 300 })
      .text(`Issued on: ${metadata.issuedDate}`, { align: 'center', x: pageWidth / 2, y: 320 });

    // Add footer with Chancellor's name
    doc.font('Helvetica-Bold')
      .fontSize(12)
      .text('CHANCELLOR:', { align: 'center', x: pageWidth / 2, y: 500 });

    doc.font('Times-Italic')
      .fontSize(12)
      .text('YABHG. TUN DATO’ SERI ZAKI TUN AZMI', { align: 'center', x: pageWidth / 2, y: 520 });

    // Add metadata to PDF (for verification)
    const metadataString = [
        `certName: ${metadata.certName}`,
        `description: ${metadata.description}`,
        `recipientName: ${metadata.recipientName}`,
        `recipientAddress: ${metadata.recipientAddress}`,
        `course: ${metadata.course}`,
        `faculty: ${metadata.faculty}`,
        `issuedDate: ${metadata.issuedDate}`,
        //`objectID: ${metadata.objectID}`,
        `objectID: ${metadata.objectID}`,
        `studentId: ${metadata.studentId}`

    ].join(", ");

    doc.info = {
        CreationDate: new Date(metadata.issuedDate),
        Keywords: metadataString
    };

    // Finalize the PDF
    doc.end();
  });
  }

  app.listen(3000, () => {
    console.log("Admin Login Page: http://localhost:3000/admin_login.html");
    console.log("Student Login Page: http://localhost:3000/student_login.html");
  });
