// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract GuardianRegistry {
    struct Guardian {
        address owner;
        uint256 agentTokenId;
        bytes32 metadataRoot;
        bytes32 capabilityHash;
        string name;
        string[] tags;
        bool active;
        uint256 registeredAt;
        uint256 updatedAt;
    }

    uint256 public constant MAX_TAGS = 12;
    uint256 public constant MAX_TEXT = 128;

    mapping(uint256 => Guardian) private guardians;
    mapping(uint256 => bool) public isGuardian;
    mapping(address => uint256[]) private guardiansByOwner;
    mapping(bytes32 => uint256[]) private guardiansByTag;
    uint256[] private allGuardianIds;

    event GuardianRegistered(
        uint256 indexed agentTokenId,
        address indexed owner,
        bytes32 metadataRoot,
        bytes32 capabilityHash,
        string name
    );
    event GuardianMetadataUpdated(uint256 indexed agentTokenId, bytes32 previousRoot, bytes32 newRoot);
    event GuardianStatusChanged(uint256 indexed agentTokenId, bool active);

    error AlreadyRegistered();
    error NotRegistered();
    error NotGuardianOwner();
    error EmptyField();
    error InvalidTags();

    modifier onlyGuardianOwner(uint256 agentTokenId) {
        if (!isGuardian[agentTokenId]) revert NotRegistered();
        if (guardians[agentTokenId].owner != msg.sender) revert NotGuardianOwner();
        _;
    }

    function registerGuardian(
        uint256 agentTokenId,
        bytes32 metadataRoot,
        bytes32 capabilityHash,
        string calldata name,
        string[] calldata tags
    ) external {
        if (isGuardian[agentTokenId]) revert AlreadyRegistered();
        if (agentTokenId == 0 || metadataRoot == bytes32(0) || capabilityHash == bytes32(0)) revert EmptyField();
        _validateText(name);
        _validateTags(tags);

        Guardian storage guardian = guardians[agentTokenId];
        guardian.owner = msg.sender;
        guardian.agentTokenId = agentTokenId;
        guardian.metadataRoot = metadataRoot;
        guardian.capabilityHash = capabilityHash;
        guardian.name = name;
        guardian.active = true;
        guardian.registeredAt = block.timestamp;
        guardian.updatedAt = block.timestamp;
        _setTags(guardian, tags);

        isGuardian[agentTokenId] = true;
        guardiansByOwner[msg.sender].push(agentTokenId);
        allGuardianIds.push(agentTokenId);
        _indexTags(agentTokenId, tags);

        emit GuardianRegistered(agentTokenId, msg.sender, metadataRoot, capabilityHash, name);
    }

    function updateGuardianMetadata(uint256 agentTokenId, bytes32 newMetadataRoot)
        external
        onlyGuardianOwner(agentTokenId)
    {
        if (newMetadataRoot == bytes32(0)) revert EmptyField();
        bytes32 previousRoot = guardians[agentTokenId].metadataRoot;
        guardians[agentTokenId].metadataRoot = newMetadataRoot;
        guardians[agentTokenId].updatedAt = block.timestamp;
        emit GuardianMetadataUpdated(agentTokenId, previousRoot, newMetadataRoot);
    }

    function setGuardianActive(uint256 agentTokenId, bool active) external onlyGuardianOwner(agentTokenId) {
        guardians[agentTokenId].active = active;
        guardians[agentTokenId].updatedAt = block.timestamp;
        emit GuardianStatusChanged(agentTokenId, active);
    }

    function getGuardian(uint256 agentTokenId) external view returns (Guardian memory) {
        if (!isGuardian[agentTokenId]) revert NotRegistered();
        return guardians[agentTokenId];
    }

    function getGuardiansByOwner(address owner) external view returns (uint256[] memory) {
        return guardiansByOwner[owner];
    }

    function getGuardiansByTag(string calldata tag) external view returns (uint256[] memory) {
        return guardiansByTag[_tagHash(tag)];
    }

    function getAllGuardians() external view returns (uint256[] memory) {
        return allGuardianIds;
    }

    function _validateText(string calldata value) private pure {
        uint256 length = bytes(value).length;
        if (length == 0 || length > MAX_TEXT) revert EmptyField();
    }

    function _validateTags(string[] calldata tags) private pure {
        if (tags.length == 0 || tags.length > MAX_TAGS) revert InvalidTags();
        for (uint256 i = 0; i < tags.length; i += 1) {
            uint256 length = bytes(tags[i]).length;
            if (length == 0 || length > 64) revert InvalidTags();
        }
    }

    function _setTags(Guardian storage guardian, string[] calldata tags) private {
        for (uint256 i = 0; i < tags.length; i += 1) {
            guardian.tags.push(tags[i]);
        }
    }

    function _indexTags(uint256 agentTokenId, string[] calldata tags) private {
        for (uint256 i = 0; i < tags.length; i += 1) {
            guardiansByTag[_tagHash(tags[i])].push(agentTokenId);
        }
    }

    function _tagHash(string memory tag) private pure returns (bytes32) {
        return keccak256(bytes(tag));
    }
}
