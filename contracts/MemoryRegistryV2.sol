// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract MemoryRegistryV2 is Initializable, OwnableUpgradeable {
    // Simple example storage to demonstrate upgradeable pattern
    string public registryName;

    event MemoryStored(address indexed sender, uint256 indexed id, string data);

    function initialize(string memory name) public initializer {
        __Ownable_init(msg.sender);
        registryName = name;
    }

    function setName(string calldata name) external onlyOwner {
        registryName = name;
    }

    function storeMemory(uint256 id, string calldata data) external {
        emit MemoryStored(msg.sender, id, data);
    }
}
