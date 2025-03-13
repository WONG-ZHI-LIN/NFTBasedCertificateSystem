// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CertificateNFT is ERC721URIStorage, Ownable {
 
    uint256[] public allIssuedCert;
    mapping(uint256 => string) public metadataHashes;
    
    constructor() ERC721("CertificateNFT", "CERTNFT")  Ownable(msg.sender) {}

    
    event Log(string message);

    // Mint a new certificate (only owner/admin)
    function mintCertificate(address recipient,string memory metadataHash, uint256 _objectID) external onlyOwner {
        require(recipient != address(0), "Invalid recipient address");
        require(bytes(metadataHash).length > 0, "Metadata hash is empty");

       _safeMint(recipient, _objectID);
        metadataHashes[_objectID] = metadataHash;
        
    }

 
    function getMetadataHashes(uint256 id) external view returns (string memory) {
        require(bytes(metadataHashes[id]).length > 0, "Metadata hash not found.");
        string memory hash = metadataHashes[id];
        return hash;  // Return the stored metadata hash for the token
    }

    // Check if a certificate exists and its owner
    function isCertificateValid(uint256 _objectID, address claimedOwner) external view returns (bool) {
        try this.ownerOf(_objectID) returns (address owner) {
            return owner == claimedOwner;
        } catch {
            return false;
        }
    }

}

