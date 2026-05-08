// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract ProtectionReceipt {
    enum Verdict {
        UNKNOWN,
        ALLOW,
        WARN,
        BLOCK
    }

    struct Review {
        bytes32 reviewId;
        address user;
        uint256 agentTokenId;
        bytes32 txIntentHash;
        bytes32 reportRoot;
        bytes32 daCommitment;
        bytes32 computeHash;
        uint16 riskScore;
        Verdict verdict;
        uint256 recordedAt;
    }

    mapping(bytes32 => Review) private reviews;
    mapping(bytes32 => bool) public isReview;
    mapping(address => bytes32[]) private reviewsByUser;
    mapping(uint256 => bytes32[]) private reviewsByAgent;
    bytes32[] private allReviewIds;

    event ReviewRecorded(
        bytes32 indexed reviewId,
        address indexed user,
        uint256 indexed agentTokenId,
        bytes32 txIntentHash,
        bytes32 reportRoot,
        bytes32 daCommitment,
        bytes32 computeHash,
        uint16 riskScore,
        Verdict verdict
    );
    event ReviewDAUpdated(bytes32 indexed reviewId, bytes32 previousCommitment, bytes32 newCommitment);

    error AlreadyRecorded();
    error NotRecorded();
    error EmptyField();
    error InvalidRiskScore();
    error NotReviewUser();

    function recordReview(
        uint256 agentTokenId,
        bytes32 txIntentHash,
        bytes32 reportRoot,
        bytes32 daCommitment,
        bytes32 computeHash,
        uint16 riskScore,
        Verdict verdict
    ) external returns (bytes32 reviewId) {
        if (
            agentTokenId == 0 || txIntentHash == bytes32(0) || reportRoot == bytes32(0)
                || computeHash == bytes32(0)
        ) revert EmptyField();
        if (riskScore > 1000) revert InvalidRiskScore();

        reviewId = keccak256(abi.encode(msg.sender, agentTokenId, txIntentHash, reportRoot, computeHash, block.chainid));
        if (isReview[reviewId]) revert AlreadyRecorded();

        reviews[reviewId] = Review({
            reviewId: reviewId,
            user: msg.sender,
            agentTokenId: agentTokenId,
            txIntentHash: txIntentHash,
            reportRoot: reportRoot,
            daCommitment: daCommitment,
            computeHash: computeHash,
            riskScore: riskScore,
            verdict: verdict,
            recordedAt: block.timestamp
        });
        isReview[reviewId] = true;
        reviewsByUser[msg.sender].push(reviewId);
        reviewsByAgent[agentTokenId].push(reviewId);
        allReviewIds.push(reviewId);

        emit ReviewRecorded(
            reviewId,
            msg.sender,
            agentTokenId,
            txIntentHash,
            reportRoot,
            daCommitment,
            computeHash,
            riskScore,
            verdict
        );
    }

    function updateDACommitment(bytes32 reviewId, bytes32 daCommitment) external {
        if (!isReview[reviewId]) revert NotRecorded();
        if (reviews[reviewId].user != msg.sender) revert NotReviewUser();
        if (daCommitment == bytes32(0)) revert EmptyField();
        bytes32 previousCommitment = reviews[reviewId].daCommitment;
        reviews[reviewId].daCommitment = daCommitment;
        emit ReviewDAUpdated(reviewId, previousCommitment, daCommitment);
    }

    function getReview(bytes32 reviewId) external view returns (Review memory) {
        if (!isReview[reviewId]) revert NotRecorded();
        return reviews[reviewId];
    }

    function getReviewsByUser(address user) external view returns (bytes32[] memory) {
        return reviewsByUser[user];
    }

    function getReviewsByAgent(uint256 agentTokenId) external view returns (bytes32[] memory) {
        return reviewsByAgent[agentTokenId];
    }

    function getAllReviewIds() external view returns (bytes32[] memory) {
        return allReviewIds;
    }
}
