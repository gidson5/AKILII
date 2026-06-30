// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title AkiliCredits
 * @notice G$ credit system for Akili AI operations.
 *
 * Flow:
 *   1. User claims free G$ daily from GoodDollar UBI.
 *   2. User deposits G$ into this contract.
 *   3. Akili agent calls spendCredits() when running AI analysis.
 *   4. User can withdraw unspent G$ at any time.
 *
 * Operation costs (G$ has 2 decimals, so 0.10 G$ = 10 in raw units):
 *   - Wallet report (any type): 5 raw = 0.05 G$
 *   - GD UBI analysis:          0 raw = FREE (incentivise GoodDollar participation)
 *   - Deep wallet audit:        10 raw = 0.10 G$
 *   - Chat message:             2 raw = 0.02 G$
 *
 * G$ on Celo: 0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A
 */
contract AkiliCredits {

    IERC20 public constant GD = IERC20(0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A);

    // Costs in raw G$ units (2 decimals: 100 = 1.00 G$)
    uint256 public constant COST_WALLET_REPORT = 5;   // 0.05 G$
    uint256 public constant COST_WALLET_AUDIT  = 10;  // 0.10 G$
    uint256 public constant COST_CHAT_MESSAGE  = 2;   // 0.02 G$
    uint256 public constant COST_GD_ANALYSIS   = 0;   // free

    struct UserCredits {
        uint256 balance;
        uint256 totalDeposited;
        uint256 totalSpent;
        uint256 firstDepositAt;
    }

    mapping(bytes32 => UserCredits) private _credits;
    mapping(bytes32 => address)     public  depositors;

    uint256 public globalTotalDeposited;
    uint256 public globalTotalSpent;

    address public agent;
    address public owner;

    event Deposited(bytes32 indexed userKey, address indexed from, uint256 amount, uint256 newBalance);
    event Spent(bytes32 indexed userKey, string action, uint256 cost, uint256 remaining);
    event Withdrawn(bytes32 indexed userKey, address indexed to, uint256 amount);

    constructor(address _agent) {
        agent = _agent;
        owner = msg.sender;
    }

    modifier onlyAgent() {
        require(msg.sender == agent, "Akili: unauthorized");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Akili: not owner");
        _;
    }

    // ── User: Deposit ─────────────────────────────────────────────────────────

    function deposit(string calldata userId, uint256 amount) external {
        require(amount > 0, "Akili: amount must be > 0");
        bytes32 key = _key(userId);

        // Only the first depositor owns this key — prevents griefing via dust deposits
        require(
            depositors[key] == address(0) || depositors[key] == msg.sender,
            "Akili: userId owned by another address"
        );

        require(GD.transferFrom(msg.sender, address(this), amount), "Akili: transferFrom failed");

        UserCredits storage c = _credits[key];
        if (c.firstDepositAt == 0) {
            c.firstDepositAt = block.timestamp;
            depositors[key] = msg.sender;
        }
        c.balance        += amount;
        c.totalDeposited += amount;
        globalTotalDeposited += amount;

        emit Deposited(key, msg.sender, amount, c.balance);
    }

    // ── User: Withdraw ────────────────────────────────────────────────────────

    function withdraw(string calldata userId, uint256 amount) external {
        bytes32 key = _key(userId);
        require(depositors[key] == msg.sender, "Akili: not your credits");

        UserCredits storage c = _credits[key];
        uint256 amt = amount == 0 ? c.balance : amount;
        require(c.balance >= amt, "Akili: insufficient balance");

        c.balance -= amt;
        globalTotalDeposited -= amt;
        require(GD.transfer(msg.sender, amt), "Akili: transfer failed");

        emit Withdrawn(key, msg.sender, amt);
    }

    // ── Agent: Spend ──────────────────────────────────────────────────────────

    function spendCredits(string calldata userId, string calldata action) external onlyAgent {
        uint256 cost = _actionCost(action);
        if (cost == 0) return; // free action — no state change needed

        bytes32 key = _key(userId);
        UserCredits storage c = _credits[key];
        require(c.balance >= cost, "Akili: insufficient credits");

        c.balance    -= cost;
        c.totalSpent += cost;
        globalTotalSpent += cost;

        require(GD.transfer(agent, cost), "Akili: transfer failed");

        emit Spent(key, action, cost, c.balance);
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    function getCredits(string calldata userId) external view returns (
        uint256 balance,
        uint256 totalDeposited,
        uint256 totalSpent,
        bool    canAffordReport
    ) {
        UserCredits storage c = _credits[_key(userId)];
        return (
            c.balance,
            c.totalDeposited,
            c.totalSpent,
            c.balance >= COST_WALLET_REPORT
        );
    }

    function canAfford(string calldata userId, string calldata action) external view returns (bool) {
        uint256 cost = _actionCost(action);
        if (cost == 0) return true;
        return _credits[_key(userId)].balance >= cost;
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    function setAgent(address _agent) external onlyOwner {
        require(_agent != address(0), "Akili: zero address");
        agent = _agent;
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    function _key(string memory userId) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(userId));
    }

    function _actionCost(string memory action) internal pure returns (uint256) {
        bytes32 h = keccak256(abi.encodePacked(action));
        if (h == keccak256("wallet-report")) return COST_WALLET_REPORT;
        if (h == keccak256("wallet-audit"))  return COST_WALLET_AUDIT;
        if (h == keccak256("chat-message"))  return COST_CHAT_MESSAGE;
        if (h == keccak256("gd-analysis"))   return COST_GD_ANALYSIS;
        revert("Akili: unknown action");
    }
}
