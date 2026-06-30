// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AkiliLog
 * @notice Immutable on-chain audit trail for Akili AI decisions on Celo.
 *
 * Every time Akili produces a wallet analysis, UBI optimization, or any
 * other AI-driven insight, the agent writes a record here. This creates
 * a permanent, verifiable log of the agent's activity tied to its wallet.
 *
 * Action types:
 *   "wallet-report"    — any standard wallet analysis report
 *   "wallet-audit"     — deep financial health audit
 *   "gd-ubi-history"   — GoodDollar UBI history analysis
 *   "gd-ubi-optimize"  — GoodDollar UBI optimization advice
 *   "chat-response"    — AI chat interaction
 *   "gd-claim-alert"   — idle G$ or missed claim notification sent
 */
contract AkiliLog {

    event DecisionLogged(
        address indexed agent,
        bytes32 indexed userHash,
        string  action,
        uint256 timestamp
    );

    event GDClaimAlertSent(
        bytes32 indexed userHash,
        uint256 idleDays,
        string  gdBalance,
        uint256 timestamp
    );

    event AgentSet(address indexed agent, bool allowed);

    struct Decision {
        address agent;
        bytes32 userHash;
        string  action;
        uint256 timestamp;
    }

    Decision[] public decisions;
    uint256    public decisionCount;

    // Per-user stats (privacy-preserving: keyed by hash of userId)
    mapping(bytes32 => uint256) public userDecisionCount;
    mapping(bytes32 => uint256) public userLastActivityAt;

    // Access control — only registered agents can write
    mapping(address => bool) public isAgent;
    address public owner;

    constructor() {
        owner = msg.sender;
        isAgent[msg.sender] = true;
    }

    modifier onlyAgent() {
        require(isAgent[msg.sender], "AkiliLog: not an agent");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "AkiliLog: not owner");
        _;
    }

    function setAgent(address agent, bool allowed) external onlyOwner {
        require(agent != address(0), "AkiliLog: zero address");
        isAgent[agent] = allowed;
        emit AgentSet(agent, allowed);
    }

    function logDecision(
        string calldata userId,
        string calldata action
    ) external onlyAgent {
        bytes32 userHash = keccak256(abi.encodePacked(userId));

        decisions.push(Decision({
            agent:     msg.sender,
            userHash:  userHash,
            action:    action,
            timestamp: block.timestamp
        }));

        decisionCount               += 1;
        userDecisionCount[userHash] += 1;
        userLastActivityAt[userHash] = block.timestamp;

        emit DecisionLogged(msg.sender, userHash, action, block.timestamp);
    }

    function logGDClaimAlert(
        string calldata userId,
        uint256         idleDays,
        string calldata gdBalance
    ) external onlyAgent {
        bytes32 userHash = keccak256(abi.encodePacked(userId));

        emit GDClaimAlertSent(userHash, idleDays, gdBalance, block.timestamp);

        userLastActivityAt[userHash] = block.timestamp;
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    function getDecision(uint256 index) external view returns (Decision memory) {
        require(index < decisions.length, "AkiliLog: out of bounds");
        return decisions[index];
    }

    function getUserStats(string calldata userId) external view returns (
        uint256 totalDecisions,
        uint256 lastActivityAt
    ) {
        bytes32 key = keccak256(abi.encodePacked(userId));
        return (userDecisionCount[key], userLastActivityAt[key]);
    }
}
