// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AuthorizationManager is EIP712, Ownable {
    using ECDSA for bytes32;

    // Error definitions for Gas Optimization
    error AuthorizationUsed();
    error InvalidSignature();
    error DeadlineExpired();

    // Typehash for EIP-712 compliance
    bytes32 private constant WITHDRAWAL_TYPEHASH = keccak256(
        "Withdrawal(address vault,address recipient,uint256 amount,uint256 nonce,uint256 deadline)"
    );

    // Mapping to prevent replay attacks: signature hash => bool
    mapping(bytes32 => bool) public isAuthUsed;

    event AuthorizationConsumed(bytes32 indexed authHash, address indexed recipient);

    constructor() EIP712("GPPVaultAuth", "1") Ownable(msg.sender) {}

    /**
     * @notice Verifies if the withdrawal is authorized by the owner (signer).
     * @dev Marks the authorization as used to prevent replay.
     */
    function verifyAuthorization(
        address _vault,
        address _recipient,
        uint256 _amount,
        uint256 _nonce,
        uint256 _deadline,
        bytes calldata _signature
    ) external returns (bool) {
        if (block.timestamp > _deadline) revert DeadlineExpired();

        // 1. Construct the digest strictly bound to this Contract, ChainID, and parameters
        bytes32 structHash = keccak256(
            abi.encode(
                WITHDRAWAL_TYPEHASH,
                _vault,
                _recipient,
                _amount,
                _nonce,
                _deadline
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);

        // 2. Check for Replay
        if (isAuthUsed[digest]) revert AuthorizationUsed();

        // 3. Recover Signer
        address signer = ECDSA.recover(digest, _signature);

        // 4. Validate Signer is the Admin/Owner
        if (signer != owner()) revert InvalidSignature();

        // 5. State Update (Effects)
        isAuthUsed[digest] = true;

        emit AuthorizationConsumed(digest, _recipient);
        return true;
    }
}