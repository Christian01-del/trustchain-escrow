use soroban_sdk::contracterror;

/// Stable contract error codes.
///
/// Codes are part of the public contract surface: once assigned they must not
/// be renumbered or reused, so that off-chain consumers can map failures
/// deterministically. Reputation scoring errors live in the `6xx` range.
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    // --- Generic / lifecycle (1xx) ---
    AlreadyInitialized = 100,
    NotInitialized = 101,
    Unauthorized = 102,
    InvalidAmount = 103,
    InvalidState = 104,

    // --- Escrow (2xx) ---
    EscrowNotFound = 200,
    EscrowAlreadyExists = 201,
    EscrowNotFunded = 202,
    EscrowAlreadyReleased = 203,

    // --- Reputation scoring determinism (6xx) ---
    /// Reputation score inputs were not supplied in a deterministic order.
    ReputationInputsNotDeterministic = 600,
    /// A reputation score component is outside its allowed bounds.
    ReputationScoreOutOfBounds = 601,
    /// Reputation scoring was requested for an unknown or unscored subject.
    ReputationSubjectUnknown = 602,
    /// Reputation scoring arithmetic overflowed the deterministic range.
    ReputationScoreOverflow = 603,
}
