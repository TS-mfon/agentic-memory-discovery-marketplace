// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract AgentRegistry {
    enum MemoryAccess {
        PUBLIC,
        PRIVATE,
        PERMISSIONED
    }

    struct AgentProfile {
        string name;
        string[] capabilityTags;
        string capabilityMetadata;
        bytes32 memoryRootHash;
        address owner;
        uint256 registeredAt;
        uint256 lastMemoryUpdate;
        uint256 totalMemoryUpdates;
        MemoryAccess accessPolicy;
    }

    struct MemoryAccessGrant {
        address grantee;
        bool canRead;
        uint256 grantedAt;
        uint256 expiresAt;
    }

    uint256 public constant MAX_TAGS = 12;
    uint256 public constant MAX_TEXT = 512;

    address public owner;
    mapping(address => AgentProfile) private agents;
    mapping(address => bool) public isRegistered;
    mapping(bytes32 => address[]) private agentsByCapabilityHash;
    mapping(address => mapping(address => MemoryAccessGrant)) public accessGrants;
    address[] private allAgents;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event AgentRegistered(address indexed agentAddress, string name, string[] capabilityTags, uint256 timestamp);
    event MemoryUpdated(address indexed agentAddress, bytes32 oldHash, bytes32 newHash, uint256 timestamp);
    event CapabilitiesUpdated(address indexed agentAddress, string[] newTags, uint256 timestamp);
    event AccessPolicyUpdated(address indexed agentAddress, MemoryAccess policy);
    event AccessGranted(address indexed agentAddress, address indexed grantee, uint256 expiresAt);
    event AccessRevoked(address indexed agentAddress, address indexed grantee);

    error NotOwner();
    error NotAgentOwner();
    error AlreadyRegistered();
    error NotRegistered();
    error EmptyField();
    error InvalidAddress();
    error InvalidTags();
    error AccessDenied();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAgentOwner(address agentAddress) {
        if (!isRegistered[agentAddress]) revert NotRegistered();
        if (agents[agentAddress].owner != msg.sender) revert NotAgentOwner();
        _;
    }

    constructor(address initialOwner) {
        if (initialOwner == address(0)) revert InvalidAddress();
        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        address previous = owner;
        owner = newOwner;
        emit OwnershipTransferred(previous, newOwner);
    }

    function registerAgent(
        string calldata name,
        string[] calldata capabilityTags,
        string calldata capabilityMetadata,
        MemoryAccess accessPolicy
    ) external returns (address agentId) {
        if (isRegistered[msg.sender]) revert AlreadyRegistered();
        _validateText(name);
        _validateText(capabilityMetadata);
        _validateTags(capabilityTags);

        agentId = msg.sender;
        uint256 nowTs = block.timestamp;
        AgentProfile storage profile = agents[agentId];
        profile.name = name;
        profile.capabilityMetadata = capabilityMetadata;
        profile.memoryRootHash = bytes32(0);
        profile.owner = msg.sender;
        profile.registeredAt = nowTs;
        profile.lastMemoryUpdate = 0;
        profile.totalMemoryUpdates = 0;
        profile.accessPolicy = accessPolicy;
        _setTags(profile, capabilityTags);
        isRegistered[agentId] = true;
        allAgents.push(agentId);
        _indexTags(agentId, capabilityTags);
        emit AgentRegistered(agentId, name, capabilityTags, nowTs);
    }

    function updateMemory(bytes32 newMemoryRootHash) external onlyAgentOwner(msg.sender) {
        if (newMemoryRootHash == bytes32(0)) revert EmptyField();
        AgentProfile storage profile = agents[msg.sender];
        bytes32 oldHash = profile.memoryRootHash;
        profile.memoryRootHash = newMemoryRootHash;
        profile.lastMemoryUpdate = block.timestamp;
        profile.totalMemoryUpdates += 1;
        emit MemoryUpdated(msg.sender, oldHash, newMemoryRootHash, block.timestamp);
    }

    function updateCapabilities(string[] calldata newTags, string calldata newMetadata)
        external
        onlyAgentOwner(msg.sender)
    {
        _validateText(newMetadata);
        _validateTags(newTags);
        AgentProfile storage profile = agents[msg.sender];
        _removeFromTags(msg.sender, profile.capabilityTags);
        delete profile.capabilityTags;
        _setTags(profile, newTags);
        profile.capabilityMetadata = newMetadata;
        _indexTags(msg.sender, newTags);
        emit CapabilitiesUpdated(msg.sender, newTags, block.timestamp);
    }

    function setAccessPolicy(MemoryAccess newPolicy) external onlyAgentOwner(msg.sender) {
        agents[msg.sender].accessPolicy = newPolicy;
        emit AccessPolicyUpdated(msg.sender, newPolicy);
    }

    function grantMemoryAccess(address grantee, uint256 durationSeconds) external onlyAgentOwner(msg.sender) {
        if (grantee == address(0)) revert InvalidAddress();
        uint256 expiresAt = durationSeconds == 0 ? 0 : block.timestamp + durationSeconds;
        accessGrants[msg.sender][grantee] = MemoryAccessGrant({
            grantee: grantee,
            canRead: true,
            grantedAt: block.timestamp,
            expiresAt: expiresAt
        });
        emit AccessGranted(msg.sender, grantee, expiresAt);
    }

    function revokeMemoryAccess(address grantee) external onlyAgentOwner(msg.sender) {
        delete accessGrants[msg.sender][grantee];
        emit AccessRevoked(msg.sender, grantee);
    }

    function getAgentsByCapability(string calldata tag) external view returns (address[] memory) {
        return agentsByCapabilityHash[_tagHash(tag)];
    }

    function getAllAgents() external view returns (address[] memory) {
        return allAgents;
    }

    function getAgentProfile(address agentAddress) external view returns (AgentProfile memory) {
        if (!isRegistered[agentAddress]) revert NotRegistered();
        return agents[agentAddress];
    }

    function canReadMemory(address reader, address agentAddress) public view returns (bool) {
        if (!isRegistered[agentAddress]) revert NotRegistered();
        AgentProfile memory profile = agents[agentAddress];
        if (reader == profile.owner) return true;
        if (profile.accessPolicy == MemoryAccess.PUBLIC) return true;
        if (profile.accessPolicy == MemoryAccess.PRIVATE) return false;
        MemoryAccessGrant memory grant = accessGrants[agentAddress][reader];
        return grant.canRead && (grant.expiresAt == 0 || grant.expiresAt >= block.timestamp);
    }

    function getMemoryRootHash(address agentAddress) external view returns (bytes32) {
        if (!canReadMemory(msg.sender, agentAddress)) revert AccessDenied();
        return agents[agentAddress].memoryRootHash;
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

    function _setTags(AgentProfile storage profile, string[] calldata tags) private {
        for (uint256 i = 0; i < tags.length; i += 1) {
            profile.capabilityTags.push(tags[i]);
        }
    }

    function _indexTags(address agentAddress, string[] calldata tags) private {
        for (uint256 i = 0; i < tags.length; i += 1) {
            agentsByCapabilityHash[_tagHash(tags[i])].push(agentAddress);
        }
    }

    function _removeFromTags(address agentAddress, string[] memory tags) private {
        for (uint256 i = 0; i < tags.length; i += 1) {
            address[] storage indexedAgents = agentsByCapabilityHash[_tagHash(tags[i])];
            for (uint256 j = 0; j < indexedAgents.length; j += 1) {
                if (indexedAgents[j] == agentAddress) {
                    indexedAgents[j] = indexedAgents[indexedAgents.length - 1];
                    indexedAgents.pop();
                    break;
                }
            }
        }
    }

    function _tagHash(string memory tag) private pure returns (bytes32) {
        return keccak256(bytes(tag));
    }
}
