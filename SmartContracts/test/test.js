// contracts/test_CertificateNFT.sol

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateNFT", function () {
    let CertificateNFT;
    let certificateNFT;
    let owner;
    let addr1;

    beforeEach(async function () {
        CertificateNFT = await ethers.getContractFactory("CertificateNFT");
        [owner, addr1] = await ethers.getSigners();
        certificateNFT = await CertificateNFT.deploy();
        //await certificateNFT.deployed();
        //certificateNFT = await CertificateNFT.waitForDeployment();

    });

    it("Should mint a certificate and map the metadata hash to the object ID", async function () {
        const metadataHash = "QmTzQ1Nj5Q1Nj5Q1Nj5Q1Nj5Q1Nj5Q1Nj5Q1Nj5Q1Nj5";
        const objectID = 1;

        await certificateNFT.mintCertificate(addr1.address, metadataHash, objectID);

        const storedHash = await certificateNFT.getMetadataHashes(objectID);
        expect(storedHash).to.equal(metadataHash);
    });

    it("Should fail if metadata hash is empty", async function () {
        const metadataHash = "";
        const objectID = 2;

        await expect(
            certificateNFT.mintCertificate(addr1.address, metadataHash, objectID)
        ).to.be.revertedWith("Metadata hash is empty");
    });

    it("Should fail if recipient address is invalid", async function () {
        const metadataHash = "QmTzQ1Nj5Q1Nj5Q1Nj5Q1Nj5Q1Nj5Q1Nj5Q1Nj5Q1Nj5";
        const objectID = 3;

        await expect(
            certificateNFT.mintCertificate(ethers.constants.AddressZero, metadataHash, objectID)
        ).to.be.revertedWith("Invalid recipient address");
    });

    it("Should verify certificate ownership", async function () {
        const metadataHash = "QmTzQ1Nj5Q1Nj5Q1Nj5Q1Nj5Q1Nj5Q1Nj5Q1Nj5Q1Nj5";
        const objectID = 4;

        await certificateNFT.mintCertificate(addr1.address, metadataHash, objectID);

        const isValid = await certificateNFT.isCertificateValid(objectID, addr1.address);
        expect(isValid).to.be.true;
    });

    it("Should return false for invalid certificate ownership", async function () {
        const metadataHash = "QmTzQ1Nj5Q1Nj5Q1Nj5Q1Nj5Q1Nj5Q1Nj5Q1Nj5Q1Nj5";
        const objectID = 5;

        await certificateNFT.mintCertificate(addr1.address, metadataHash, objectID);

        const isValid = await certificateNFT.isCertificateValid(objectID, owner.address);
        expect(isValid).to.be.false;
    });
});