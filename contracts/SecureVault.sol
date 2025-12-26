// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IAuthManager {
    function verifyAuthorization(
        address vault,
        address recipient,
        uint256 amount,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external returns (bool);
}

contract SecureVault is ReentrancyGuard {
    IAuthManager public immutable authManager;

    event Deposit(address indexed sender, uint256 amount);
    event Withdrawal(address indexed recipient, uint256 amount);

    error TransferFailed();
    error Unauthorized();

    constructor(address _authManager) {
        authManager = IAuthManager(_authManager);
    }

    // Accept native currency
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @notice Withdraw funds with a valid signature.
     * @dev Relies entirely on AuthManager for permission logic.
     */
    function withdraw(
        uint256 _amount,
        uint256 _nonce,
        uint256 _deadline,
        bytes calldata _signature
    ) external nonReentrant {
        // 1. Interaction with AuthManager (External Call)
        // We pass 'address(this)' to bind the sig to THIS vault instance specifically
        bool isAuthorized = authManager.verifyAuthorization(
            address(this),
            msg.sender,
            _amount,
            _nonce,
            _deadline,
            _signature
        );

        if (!isAuthorized) revert Unauthorized();

        // 2. Transfer Funds (Interaction)
        // Note: Accounting is handled by EVM balance, but AuthManager handled the "Spent" state.
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        if (!success) revert TransferFailed();

        emit Withdrawal(msg.sender, _amount);
    }
}