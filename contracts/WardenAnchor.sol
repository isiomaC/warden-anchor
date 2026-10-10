// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title WardenAnchor
/// @notice Publishes the head of a hash-chained Warden decision log so that
///         later rewrites or truncation of that log can be detected offline.
/// @dev Anchors are keyed by (publisher, logId). The entry count must strictly
///      increase, so an older (shorter) log can never replace a newer anchor.
contract WardenAnchor {
    struct Anchor {
        uint64 entryCount;
        bytes32 headHash;
        uint64 blockNumber;
        uint64 timestamp;
    }

    mapping(address publisher => mapping(bytes32 logId => Anchor)) private _anchors;

    event Anchored(
        address indexed publisher,
        bytes32 indexed logId,
        uint64 entryCount,
        bytes32 headHash
    );

    error EmptyLog();
    error NotAnAdvance(uint64 current, uint64 attempted);

    /// @notice Record the current head of a log.
    /// @param logId     Identifier of the log (for example keccak256 of a run id).
    /// @param entryCount Number of entries in the log at this head. Must exceed the previous anchor.
    /// @param headHash  Hash of the last entry in the chain.
    function anchor(bytes32 logId, uint64 entryCount, bytes32 headHash) external {
        if (entryCount == 0) revert EmptyLog();
        Anchor storage a = _anchors[msg.sender][logId];
        if (entryCount <= a.entryCount) revert NotAnAdvance(a.entryCount, entryCount);

        a.entryCount = entryCount;
        a.headHash = headHash;
        a.blockNumber = uint64(block.number);
        a.timestamp = uint64(block.timestamp);

        emit Anchored(msg.sender, logId, entryCount, headHash);
    }

    /// @notice Latest anchor for a publisher's log. entryCount is 0 if none exists.
    function latest(address publisher, bytes32 logId) external view returns (Anchor memory) {
        return _anchors[publisher][logId];
    }
}
