const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Step 1: Deploy CertificateNFT
  console.log("Deploying CertificateNFT...");
  const CertificateNFT = await hre.ethers.getContractFactory("CertificateNFT");
  const certificateNFT = await CertificateNFT.deploy();

  // Wait for the deployment transaction to be mined
  await certificateNFT.waitForDeployment();
  console.log("CertificateNFT deployed to:", await certificateNFT.getAddress());

  // Step 2: Deploy UserContract
  console.log("Deploying UserContract...");
  const UserContract = await hre.ethers.getContractFactory("UserContract");
  const userContract = await UserContract.deploy(await certificateNFT.getAddress());

  // Wait for the deployment transaction to be mined
  await userContract.waitForDeployment();
  console.log("UserContract deployed to:", await userContract.getAddress());

  // Save contract addresses to a file or .env for later use
  const addresses = {
    certificateNFT: await certificateNFT.getAddress(),
    userContract: await userContract.getAddress(),
  };

  console.log("Contract addresses:", addresses);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });