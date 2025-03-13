const CertificateNFT = artifacts.require("CertificateNFT");
const UserContract = artifacts.require("UserContract");

module.exports = async function(deployer) {
  // Deploy CertificateNFT contract
  await deployer.deploy(CertificateNFT);

  // Get the address of the deployed CertificateNFT contract
  const certificateNFTInstance = await CertificateNFT.deployed();

  // Deploy UserContract with the address of the deployed CertificateNFT contract
  await deployer.deploy(UserContract, certificateNFTInstance.address);
};
