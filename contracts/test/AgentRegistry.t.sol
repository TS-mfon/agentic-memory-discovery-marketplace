// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./Test.sol";
import "../src/AgentRegistry.sol";

contract AgentRegistryTest is Test {
    AgentRegistry registry;
    address agent = address(0xA11CE);
    address reader = address(0xB0B);

    function setUp() public {
        registry = new AgentRegistry(address(this));
    }

    function _tags() internal pure returns (string[] memory tags) {
        tags = new string[](2);
        tags[0] = "DeFi";
        tags[1] = "Arbitrage";
    }

    function testRegisterAndDiscover() public {
        vm.prank(agent);
        registry.registerAgent("Yield Scout", _tags(), "{\"version\":\"1\"}", AgentRegistry.MemoryAccess.PUBLIC);
        address[] memory agents = registry.getAgentsByCapability("DeFi");
        assertEq(agents.length, 1);
        assertEq(agents[0], agent);
    }

    function testUpdateMemory() public {
        vm.prank(agent);
        registry.registerAgent("Yield Scout", _tags(), "{\"version\":\"1\"}", AgentRegistry.MemoryAccess.PUBLIC);
        vm.prank(agent);
        registry.updateMemory(bytes32(uint256(99)));
        AgentRegistry.AgentProfile memory profile = registry.getAgentProfile(agent);
        assertEq(profile.totalMemoryUpdates, 1);
    }

    function testPermissionedAccess() public {
        vm.prank(agent);
        registry.registerAgent("Yield Scout", _tags(), "{\"version\":\"1\"}", AgentRegistry.MemoryAccess.PERMISSIONED);
        assertTrue(!registry.canReadMemory(reader, agent));
        vm.prank(agent);
        registry.grantMemoryAccess(reader, 1 days);
        assertTrue(registry.canReadMemory(reader, agent));
    }

    function testCapabilityReindex() public {
        vm.prank(agent);
        registry.registerAgent("Yield Scout", _tags(), "{\"version\":\"1\"}", AgentRegistry.MemoryAccess.PUBLIC);
        string[] memory tags = new string[](1);
        tags[0] = "Storage";
        vm.prank(agent);
        registry.updateCapabilities(tags, "{\"version\":\"2\"}");
        assertEq(registry.getAgentsByCapability("DeFi").length, 0);
        assertEq(registry.getAgentsByCapability("Storage").length, 1);
    }
}
