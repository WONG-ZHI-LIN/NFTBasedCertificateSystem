// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICertificateNFT {
    function isCertificateValid(uint256 tokenId, address claimedOwner) external view returns (bool);
    //function getCertificateMetadata(uint256 tokenId) external view returns (string memory);
    //function getTokenIdFromObjectID(uint256  _objectID) external view returns (uint256); // New method to get tokenId
    function metadataHashes(uint256 tokenId) external view returns (string memory);
}

contract UserContract {
    ICertificateNFT public certificateNFT;

    constructor(address certificateNFTAddress) {
        certificateNFT = ICertificateNFT(certificateNFTAddress);
    }

    // Verify a certificate
    function verifyCertificate(
        uint256  _objectID, // Accept objectID as input
        string memory metadataHash,
        address claimedOwner
    ) public view returns (bool success, string memory errorMessage) {
        // Get tokenId using objectID
    
        //Check if the certificate is valid (owner)
        bool isOwnerValid = certificateNFT.isCertificateValid(_objectID, claimedOwner);
         require(isOwnerValid, "Certificate owner does not match the claimed owner");

        // //Retrieve the stored metadata hash
        string memory storedMetadataHash = certificateNFT.metadataHashes(_objectID);
        require(bytes(storedMetadataHash).length > 0, "Metadata is empty");
        require(
            keccak256(abi.encodePacked(storedMetadataHash)) == keccak256(abi.encodePacked(metadataHash)),
            "Metadata hash does not match the stored hash"
        );

        // If all checks pass, return success
        return (true, "Certificate is valid");
    }
}
