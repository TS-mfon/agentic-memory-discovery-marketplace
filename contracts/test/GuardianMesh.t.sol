// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./Test.sol";
import "../src/GuardianRegistry.sol";
import "../src/ProtectionReceipt.sol";

contract GuardianMeshTest is Test {
    GuardianRegistry registry;
    ProtectionReceipt receipts;
    address owner = address(0xA11CE);
    address user = address(0xB0B);

    function setUp() public {
        registry = new GuardianRegistry();
        receipts = new ProtectionReceipt();
    }

    function _tags() internal pure returns (string[] memory tags) {
        tags = new string[](2);
        tags[0] = "defi-risk-review";
        tags[1] = "agent-memory";
    }

    function testRegisterGuardian() public {
        vm.prank(owner);
        registry.registerGuardian(101, bytes32(uint256(1)), bytes32(uint256(2)), "DeFi Approval Sentinel", _tags());

        GuardianRegistry.Guardian memory guardian = registry.getGuardian(101);
        assertEq(guardian.owner, owner);
        assertEq(guardian.agentTokenId, 101);
        assertTrue(guardian.active);
        assertEq(registry.getGuardiansByTag("defi-risk-review").length, 1);
    }

    function testOnlyOwnerUpdatesMetadata() public {
        vm.prank(owner);
        registry.registerGuardian(101, bytes32(uint256(1)), bytes32(uint256(2)), "DeFi Approval Sentinel", _tags());

        vm.prank(user);
        vm.expectRevert(GuardianRegistry.NotGuardianOwner.selector);
        registry.updateGuardianMetadata(101, bytes32(uint256(3)));

        vm.prank(owner);
        registry.updateGuardianMetadata(101, bytes32(uint256(4)));
        GuardianRegistry.Guardian memory guardian = registry.getGuardian(101);
        assertEq(uint256(guardian.metadataRoot), 4);
    }

    function testRecordReview() public {
        vm.prank(user);
        bytes32 reviewId = receipts.recordReview(
            101,
            bytes32(uint256(11)),
            bytes32(uint256(12)),
            bytes32(uint256(13)),
            bytes32(uint256(14)),
            875,
            ProtectionReceipt.Verdict.BLOCK
        );

        ProtectionReceipt.Review memory review = receipts.getReview(reviewId);
        assertEq(review.user, user);
        assertEq(review.agentTokenId, 101);
        assertEq(uint256(review.riskScore), 875);
        assertEq(uint256(review.verdict), uint256(ProtectionReceipt.Verdict.BLOCK));
        assertEq(receipts.getReviewsByUser(user).length, 1);
        assertEq(receipts.getReviewsByAgent(101).length, 1);
    }

    function testRejectInvalidRiskScore() public {
        vm.prank(user);
        vm.expectRevert(ProtectionReceipt.InvalidRiskScore.selector);
        receipts.recordReview(
            101,
            bytes32(uint256(11)),
            bytes32(uint256(12)),
            bytes32(uint256(13)),
            bytes32(uint256(14)),
            1001,
            ProtectionReceipt.Verdict.WARN
        );
    }

    function testUserCanUpdateDACommitment() public {
        vm.prank(user);
        bytes32 reviewId = receipts.recordReview(
            101,
            bytes32(uint256(11)),
            bytes32(uint256(12)),
            bytes32(0),
            bytes32(uint256(14)),
            650,
            ProtectionReceipt.Verdict.WARN
        );

        vm.prank(owner);
        vm.expectRevert(ProtectionReceipt.NotReviewUser.selector);
        receipts.updateDACommitment(reviewId, bytes32(uint256(99)));

        vm.prank(user);
        receipts.updateDACommitment(reviewId, bytes32(uint256(100)));
        ProtectionReceipt.Review memory review = receipts.getReview(reviewId);
        assertEq(uint256(review.daCommitment), 100);
    }
}
